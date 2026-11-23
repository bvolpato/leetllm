import { verifiedClockReceipt } from './frame-clock.mjs';
import { courseNarrator, speechKey as measuredSpeechKey } from './course-speech.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { discoverLessons } from '../catalog.mjs';
import { readLesson } from './lesson.mjs';
import { productionSourceManifest, lessonRenderRuntime } from './lesson-production.mjs';
import {
  fileRecord,
  inside,
  privateInstallEnvironment,
  readJson,
  sha256,
  writeJson,
} from './cohort-files.mjs';
import { spawnCohortProcess, withCohortSignals } from './cohort-process.mjs';
import { lessonSourceManifest } from './lesson-source-manifest.mjs';
import { filmEncoderSettings } from 'vizmatic/stage/export';
import {
  admissionStatus,
  reserveStorage,
  settleStorage,
  enforceStorageLease,
  DEFAULT_RENDER_RESERVATION,
  DEFAULT_AUDIO_RESERVATION,
} from '../../scripts/lib/render-admission.mjs';

const exec = promisify(execFile);
const GiB = 1024 ** 3;
export const INSPECTION_LIMITS = Object.freeze({
  canvas: 10,
  stage: 1,
  cpu: 24,
  filmRss: 32 * GiB,
  minimumHostAvailable: 8 * GiB,
  minimumRootBytes: 40 * GiB,
  emergencyRootBytes: 16 * GiB,
  minimumStoreBytes: 80 * GiB,
  minimumStoreInodes: 100000,
});

export function speechKey(beat, lesson, adapterHash) {
  return measuredSpeechKey(
    beat.say,
    {
      ...courseNarrator,
      voice: lesson.voice ?? courseNarrator.voice,
      rate: lesson.rate ?? courseNarrator.rate,
    },
    adapterHash,
  );
}

/** Conflicting aliases must fail before a shared snapshot can silently combine epochs. */
export function unionSourceFiles(manifests) {
  const files = new Map();
  const targets = new Map();
  for (const manifest of manifests)
    for (const record of manifest.closure.files) {
      for (const name of [record.path, record.resolvedPath]) {
        if (path.isAbsolute(name) || name.split(/[\\/]/).includes('..'))
          throw new Error(`Unsafe source path: ${name}`);
      }
      for (const [map, name] of [
        [files, record.path],
        [targets, record.resolvedPath],
      ]) {
        const previous = map.get(name);
        if (
          previous &&
          (previous.sha256 !== record.sha256 || previous.resolvedPath !== record.resolvedPath)
        )
          throw new Error(`Conflicting shared source: ${name}`);
        map.set(name, record);
      }
    }
  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

export async function sharedInspectionSources(root, manifests) {
  const controller = await lessonSourceManifest({
    root,
    entry: ['videos/tools/render-inspection.mjs', 'videos/narration.json'],
  });
  return unionSourceFiles([...manifests, { closure: controller }]);
}

export async function verifyFiles(root, files) {
  for (const file of files) {
    const candidate = path.resolve(root, file.path);
    if (!inside(root, candidate) || !inside(root, await fs.realpath(candidate)))
      throw new Error(`Source escapes frozen root: ${file.path}`);
    const actual = await fileRecord(candidate);
    if (actual.sha256 !== file.sha256 || actual.bytes !== file.bytes)
      throw new Error(`Frozen file changed: ${file.path}`);
  }
}

/** Pin the real parent filesystem, so an absent USB mount cannot fall back to root. */
export async function storageIdentity(directory) {
  const actual = await fs.realpath(directory);
  const { stdout } = await exec('findmnt', [
    '--json',
    '--target',
    actual,
    '--output',
    'TARGET,SOURCE,FSTYPE,UUID,OPTIONS',
  ]);
  // systemd automounts expose both their autofs trigger and the mounted filesystem.
  const mount = JSON.parse(stdout)
    .filesystems.filter((entry) => entry.fstype === 'ext4')
    .at(-1);
  if (mount && !mount.uuid) {
    const source = await fs.realpath(mount.source);
    for (const uuid of await fs.readdir('/dev/disk/by-uuid')) {
      if ((await fs.realpath(path.join('/dev/disk/by-uuid', uuid))) === source) mount.uuid = uuid;
    }
  }
  if (!mount || mount.target === '/' || !mount.uuid)
    throw new Error('Inspection storage requires a separate identified ext4 mount');
  const value = await fs.stat(actual);
  return { mount: mount.target, source: mount.source, uuid: mount.uuid, device: value.dev };
}

export async function assertInspectionStorage(directory, expected, limits = INSPECTION_LIMITS) {
  const actual = await storageIdentity(directory);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error('Inspection storage mount identity changed');
  const store = await fs.statfs(directory, { bigint: true });
  const root = await fs.statfs('/', { bigint: true });
  const available = Number(store.bavail * store.bsize);
  if (available < limits.minimumStoreBytes || Number(store.ffree) < limits.minimumStoreInodes)
    throw new Error('Inspection storage reserve exhausted');
  const rootAvailableBytes = Number(root.bavail * root.bsize);
  const admission = inspectionReserveDecision(rootAvailableBytes, limits);
  return {
    ...actual,
    availableBytes: available,
    freeInodes: Number(store.ffree),
    rootAvailableBytes,
    ...admission,
  };
}

export function inspectionReserveDecision(rootAvailableBytes, limits = INSPECTION_LIMITS) {
  if (rootAvailableBytes < (limits.emergencyRootBytes ?? 16 * GiB))
    throw new Error('Host root emergency reserve exhausted');
  return {
    canAdmit: rootAvailableBytes >= limits.minimumRootBytes,
    reason:
      rootAvailableBytes < limits.minimumRootBytes
        ? 'Host root reserve: new admission paused; healthy external workers continue'
        : null,
  };
}

export function inspectionSceneCacheKey(entry, timing) {
  return sha256(
    JSON.stringify({
      fingerprint: entry.sourceManifest.fingerprint,
      profile: {
        name: 'clean',
        burnedCaptions: false,
        progressIndicator: false,
        captionFiles: ['srt', 'vtt'],
      },
      width: entry.width,
      height: Math.round((entry.width * 9) / 16 / 2) * 2,
      fps: entry.fps,
      ...(entry.mode === 'stage'
        ? { stageQuality: 'high', encoder: filmEncoderSettings('high') }
        : {}),
      frames: timing.frames,
      duration: timing.duration,
      audio: timing.sounds.map((sound) => [sound.key, sound.audioHash, sound.boundariesHash]),
    }),
  );
}

export async function assertInspectionWriterStopped(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    throw new Error('Recovery requires the exact prior writer PID');
  try {
    await fs.lstat(`/proc/${pid}`);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`Writer PID is still present or has been reused: ${pid}`);
}

export async function isOwnedEmptyStageCache(entry, state) {
  if (
    entry.mode !== 'stage' ||
    state.audio?.sourceFingerprint !== entry.sourceManifest.fingerprint ||
    !state.attempts.some(
      (attempt) =>
        attempt.phase === 'audio' &&
        attempt.process?.code === 0 &&
        attempt.process.directChildReaped,
    )
  )
    return false;
  if ((await fileRecord(state.audio.timeline.path)).sha256 !== state.audio.timeline.sha256)
    throw new Error(`Prepared Stage timeline changed: ${entry.id}`);
  const root = path.join(entry.output, '.scene-cache'),
    child = path.join(root, entry.id);
  const parentInfo = await fs.lstat(root),
    childInfo = await fs.lstat(child);
  if (
    !parentInfo.isDirectory() ||
    parentInfo.isSymbolicLink() ||
    !childInfo.isDirectory() ||
    childInfo.isSymbolicLink()
  )
    return false;
  const names = await fs.readdir(root);
  return names.length === 1 && names[0] === entry.id && (await fs.readdir(child)).length === 0;
}

async function inventoryTree(directory) {
  const records = [];
  async function visit(relative = '') {
    const absolute = path.join(directory, relative);
    const info = await fs.lstat(absolute);
    if (info.isDirectory())
      for (const name of (await fs.readdir(absolute)).sort())
        await visit(path.join(relative, name));
    else if (info.isSymbolicLink()) {
      if (!inside(directory, await fs.realpath(absolute)))
        throw new Error(`Dependency escapes shared installation: ${relative}`);
      records.push({ path: relative, link: await fs.readlink(absolute) });
    } else if (info.isFile())
      records.push({
        ...(await fileRecord(absolute)),
        path: relative,
        executable: Boolean(info.mode & 0o111),
      });
    else throw new Error(`Unsupported dependency: ${relative}`);
  }
  await visit();
  return records;
}

export async function validateInspectionSceneCache({ entry, timeline, cache, log }) {
  const files = await inventoryTree(cache);
  if (files.some((record) => record.link))
    throw new Error('Foreign scene-cache links cannot be recovered');
  const completedScenes = [];
  for (const [index, timing] of timeline.scenes.entries()) {
    const name = `${String(index + 1).padStart(2, '0')}-${timing.id}`;
    const markerFile = path.join(cache, entry.id, `${name}.render.json`);
    let marker;
    try {
      marker = await readJson(markerFile);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (
      marker.key !== inspectionSceneCacheKey(entry, timing) ||
      marker.frames !== timing.frames ||
      marker.duration !== timing.duration ||
      marker.audit?.passed !== true ||
      marker.audit.frames !== timing.frames
    )
      throw new Error(`Stale or foreign scene cache: ${entry.id}/${timing.id}`);
    const line =
      entry.mode === 'stage'
        ? `rendered ${index + 1}/${timeline.scenes.length}`
        : `rendering ${index + 1}/${timeline.scenes.length}:`;
    if (!log.includes(`[${entry.id}] ${line}`))
      throw new Error(`Same-run raster origin is absent: ${entry.id}/${timing.id}`);
    const movie = path.join(cache, entry.id, `${name}.mp4`);
    const media = JSON.parse(
      (await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', movie])).stdout,
    );
    const stream = media.streams.find((item) => item.codec_type === 'video');
    const [n, d = 1] = String(stream?.r_frame_rate).split('/').map(Number);
    if (
      stream?.codec_name !== 'h264' ||
      stream.width !== entry.width ||
      stream.height !== Math.round((entry.width * 9) / 16 / 2) * 2 ||
      n / d !== entry.fps ||
      Number(stream.nb_frames) !== timing.frames
    )
      throw new Error(`Incomplete cached media: ${entry.id}/${timing.id}`);
    const audioFormat = marker.audioFormat ?? 'wav';
    if (!['wav', 'flac'].includes(audioFormat))
      throw new Error(`Unsupported cached scene audio: ${entry.id}/${timing.id}`);
    completedScenes.push({
      scene: timing.id,
      key: marker.key,
      frames: timing.frames,
      movie: await fileRecord(movie),
      marker: await fileRecord(markerFile),
      audio: await fileRecord(path.join(cache, entry.id, `${name}.${audioFormat}`)),
    });
  }
  return { files, completedScenes };
}

/** Recover only our interrupted current-run workers. Historical footage is never imported. */
export async function recoverInspectionInterrupted({
  directory,
  plan,
  progress,
  planSha256,
  progressFile = 'progress.json',
}) {
  if (path.basename(progressFile) !== progressFile)
    throw new Error('Recovery progress must name a run-local ledger');
  const interrupted = progress.lessons.filter((row) => row.status === 'interrupted');
  if (!interrupted.length) throw new Error('No interrupted inspection workers need recovery');
  const output = path.join(directory, `recovery-${Date.now()}`);
  await fs.mkdir(output);
  const before = await fileRecord(path.join(directory, progressFile));
  await fs.copyFile(
    before.path,
    path.join(output, 'progress-before.json'),
    constants.COPYFILE_EXCL,
  );
  const operations = [];
  for (const row of interrupted) {
    const entry = plan.lessons.find((lesson) => lesson.id === row.id);
    if (!entry || !inside(directory, entry.output))
      throw new Error('Recovery output is outside its original run');
    const attempt = row.attempts.at(-1);
    await assertInspectionWriterStopped(attempt.pid);
    const operation = { id: row.id, writer: attempt.pid, phase: attempt.phase };
    if (row.audio) {
      if ((await fileRecord(row.audio.timeline.path)).sha256 !== row.audio.timeline.sha256)
        throw new Error(`Recovery timeline changed: ${row.id}`);
      for (const sound of row.audio.sounds) {
        if (
          (await fileRecord(sound.audio)).sha256 !== sound.audioHash ||
          (await fileRecord(sound.boundaries)).sha256 !== sound.boundariesHash
        )
          throw new Error(`Recovery speech changed: ${row.id}/${sound.key}`);
      }
    }
    const staging = path.join(entry.output, '.staging');
    try {
      const lock = await readJson(path.join(staging, `${entry.id}.lock`));
      if (lock.pid !== attempt.pid)
        throw new Error(`Recovery lock belongs to another writer: ${row.id}`);
      operation.staging = staging;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const cache = path.join(entry.output, '.scene-cache');
    let cacheExists = false;
    try {
      await fs.access(cache);
      cacheExists = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (cacheExists) {
      if (attempt.phase !== 'render' || !row.audio)
        throw new Error(`Foreign cache without a current-run raster attempt: ${row.id}`);
      if (!inside(directory, await fs.realpath(cache)))
        throw new Error(`Foreign cache root: ${row.id}`);
      const log = await fs.readFile(attempt.log, 'utf8');
      if (log.includes('cached scene'))
        throw new Error(`Recovery cannot attest an already-reused cache: ${row.id}`);
      operation.cache = await validateInspectionSceneCache({
        entry,
        cache,
        timeline: await readJson(row.audio.timeline.path),
        log,
      });
    }
    operations.push(operation);
  }
  // All identities and cache keys pass before any old lock or progress is changed.
  for (const operation of operations) {
    const row = progress.lessons.find((item) => item.id === operation.id);
    if (operation.staging) {
      const archived = path.join(output, `${operation.id}-staging`);
      await fs.rename(operation.staging, archived);
      operation.archivedStaging = archived;
    }
    if (operation.cache) {
      const entry = plan.lessons.find((item) => item.id === operation.id);
      const complete = new Set(
        operation.cache.completedScenes.flatMap((scene) => [
          scene.movie.path,
          scene.marker.path,
          scene.audio.path,
        ]),
      );
      for (const file of operation.cache.files) {
        const original = path.join(entry.output, '.scene-cache', file.path);
        if (complete.has(original)) continue;
        const archived = path.join(output, 'cache-before', operation.id, file.path);
        await fs.mkdir(path.dirname(archived), { recursive: true });
        await fs.copyFile(original, archived, constants.COPYFILE_EXCL);
        if ((await fileRecord(archived)).sha256 !== file.sha256)
          throw new Error(`Recovery archive differs: ${operation.id}/${file.path}`);
      }
      row.resumeCache = { recovery: output, planSha256, ...operation.cache };
    }
    row.status = row.audio ? 'audio-ready' : 'pending';
    delete row.error;
  }
  progress.status = 'recovered';
  delete progress.error;
  const report = {
    kind: 'leetllm.inspection-same-run-recovery',
    at: new Date().toISOString(),
    planSha256,
    previousProgress: before,
    operations,
    sourceRuntimeAudioUnchanged: true,
    historicalFootageImported: false,
    completedCurrentRunClipsRetained: operations.reduce(
      (sum, item) => sum + (item.cache?.completedScenes.length ?? 0),
      0,
    ),
  };
  await writeJson(path.join(output, 'recovery.json'), report);
  progress.recoveries ??= [];
  progress.recoveries.push(await fileRecord(path.join(output, 'recovery.json')));
  await writeJson(path.join(directory, progressFile), progress, { replace: true });
  return report;
}

async function freezePermissions(directory) {
  const info = await fs.lstat(directory);
  if (info.isSymbolicLink()) return;
  if (info.isDirectory()) {
    for (const name of await fs.readdir(directory))
      await freezePermissions(path.join(directory, name));
    await fs.chmod(directory, 0o555);
  } else await fs.chmod(directory, info.mode & 0o111 ? 0o555 : 0o444);
}

async function toolchain() {
  const records = [];
  for (const name of ['node', 'ffmpeg', 'ffprobe', 'uv']) {
    const executable =
      name === 'node' ? process.execPath : (await exec('which', [name])).stdout.trim();
    records.push({ command: name, ...(await fileRecord(await fs.realpath(executable))) });
  }
  return records;
}

async function runLogged(command, args, { cwd, env, log, signal, onStart = () => {} }) {
  const stream = await fs.open(log, 'wx');
  const worker = spawnCohortProcess(command, args, {
    cwd,
    env,
    signal,
    stdio: ['ignore', stream.fd, stream.fd],
  });
  onStart(worker.child.pid);
  try {
    const result = await worker.completion;
    if (result.error || result.code !== 0)
      throw Object.assign(
        new Error(
          `${command} exited ${result.code ?? result.signal}: ${result.error?.message ?? 'see retained log'}`,
        ),
        { result },
      );
    return {
      pid: worker.child.pid,
      code: result.code,
      directChildReaped: result.directChildReaped,
    };
  } finally {
    await stream.close();
  }
}

/** A single immutable collection closure and public dependency installation, never 199 copies. */
export async function prepareInspection({
  root,
  destination,
  authority,
  audioTimelines = [],
  collection = 'videos/collections/complete-curriculum.json',
}) {
  root = await fs.realpath(root);
  destination = path.resolve(destination);
  if (inside(root, destination))
    throw new Error('Inspection output must use the dedicated external store');
  const authorityRecord = await fileRecord(authority.path);
  if (authorityRecord.sha256 !== authority.sha256)
    throw new Error('Source-freeze authority hash changed');
  const storage = await storageIdentity(path.dirname(destination));
  if (!(await assertInspectionStorage(path.dirname(destination), storage)).canAdmit)
    throw new Error('Host root reserve prevents new inspection preparation');
  await fs.mkdir(destination); // Existing attempts, including failures, are never replaced.
  await fs.mkdir(path.join(destination, 'logs'));
  const catalog = await discoverLessons(path.join(root, 'videos'), root, { withStage: true });
  const ordered = await readJson(path.join(root, collection));
  if (ordered.lessons.length !== 199 || catalog.length !== 199)
    throw new Error('The inspection collection must contain all 199 lessons');
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const lessons = [];
  for (const entry of ordered.lessons) {
    const current = byId.get(entry.id);
    if (!current) throw new Error(`Collection ID is absent: ${entry.id}`);
    byId.delete(entry.id);
    console.log(`[freeze] ${lessons.length + 1}/199 ${entry.id}`);
    const sourceManifest = await productionSourceManifest({
      root,
      id: entry.id,
      mode: current.mode,
      ttsScript: courseNarrator.ttsScript,
    });
    lessons.push({
      ...current,
      sourceManifest,
      ttsScript: courseNarrator.ttsScript,
      fps: current.mode === 'stage' ? 60 : 30,
      width: 1920,
      output: path.join(destination, 'outputs', entry.id),
    });
  }
  if (byId.size) throw new Error('Collection contains duplicate lesson IDs');
  const files = await sharedInspectionSources(
    root,
    lessons.map((entry) => entry.sourceManifest),
  );
  const extras = [
    collection,
    'videos/tools/render-inspection.mjs',
    'videos/lib/inspection-render.mjs',
  ];
  for (const name of extras)
    if (!files.some((file) => file.path === name))
      files.push({ ...(await fileRecord(path.join(root, name))), path: name, resolvedPath: name });
  const repository = path.join(destination, 'source/repository');
  for (const record of files) {
    const target = path.join(repository, record.resolvedPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const bytes = await fs.readFile(path.join(root, record.path));
    if (sha256(bytes) !== record.sha256)
      throw new Error(`Source changed during freeze: ${record.path}`);
    try {
      await fs.writeFile(target, bytes, { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST' || (await fileRecord(target)).sha256 !== record.sha256)
        throw error;
    }
  }
  for (const record of files.filter((file) => file.path !== file.resolvedPath)) {
    const alias = path.join(repository, record.path);
    await fs.mkdir(path.dirname(alias), { recursive: true });
    await fs.symlink(
      path.relative(path.dirname(alias), path.join(repository, record.resolvedPath)),
      alias,
    );
  }
  await verifyFiles(root, files);
  const metadata = await readJson(path.join(repository, 'videos/package.json'));
  if (metadata.dependencies.vizmatic !== '0.8.1')
    throw new Error('Inspection requires exact public Vizmatic 0.8.1');
  const env = await privateInstallEnvironment(destination);
  env.npm_config_cache = path.join(destination, 'install-cache');
  await runLogged(process.execPath, ['check-npm-release-age.mjs'], {
    cwd: path.join(repository, 'videos'),
    env,
    log: path.join(destination, 'logs/npm-release-age.log'),
  });
  await runLogged('npm', ['ci', '--ignore-scripts', '--cache', env.npm_config_cache], {
    cwd: path.join(repository, 'videos'),
    env,
    log: path.join(destination, 'logs/npm-ci.log'),
  });
  const runtime = await lessonRenderRuntime(repository);
  const originalRuntime = await lessonRenderRuntime(root);
  if (JSON.stringify(runtime.provenance) !== JSON.stringify(originalRuntime.provenance))
    throw new Error('Public installed runtime differs from the frozen source runtime');
  const dependencies = await inventoryTree(path.join(repository, 'videos/node_modules'));
  await writeJson(path.join(destination, 'dependencies.json'), dependencies);
  await fs.mkdir(path.join(destination, 'audio-cache'));
  const seed = await seedInspectionAudio({
    repository,
    lessons,
    timelines: audioTimelines,
    cache: path.join(destination, 'audio-cache'),
  });
  await writeJson(path.join(destination, 'audio-seed.json'), seed);
  await verifyFiles(repository, files);
  await verifyFiles(root, files);
  await fs.copyFile(
    authorityRecord.path,
    path.join(destination, 'freeze-authority.json'),
    constants.COPYFILE_EXCL,
  );
  const plan = {
    version: 1,
    kind: 'leetllm.inspection-collection',
    createdAt: new Date().toISOString(),
    repository,
    storage,
    sourceFreeze: { files, sha256: sha256(JSON.stringify(files)), authority: authorityRecord },
    runtime: {
      version: '0.8.1',
      provenance: runtime.provenance,
      dependencies: await fileRecord(path.join(destination, 'dependencies.json')),
    },
    toolchain: await toolchain(),
    limits: INSPECTION_LIMITS,
    lessons,
    quality: {
      sourceReview: 'pending',
      encodedReview: 'pending',
      humanSoundWatch: false,
      applePlayback: false,
      publicationApproved: false,
    },
    footage:
      'Every lesson is freshly rasterized and encoded; unchanged speech alone may be reused by its exact content key.',
  };
  await freezePermissions(path.join(destination, 'source'));
  await writeJson(path.join(destination, 'inspection.json'), plan);
  await writeJson(path.join(destination, 'progress.json'), newInspectionProgress(plan));
  return plan;
}

/** Retained timelines bind the cache bytes. A changed SAY/voice/rate/adapter never matches. */
export async function seedInspectionAudio({ repository, lessons, timelines, cache }) {
  const required = new Set();
  for (const entry of lessons) {
    const lesson = await readLesson(path.join(repository, entry.lessonFile), repository);
    const adapterHash = (await fileRecord(path.join(repository, entry.ttsScript))).sha256;
    for (const beat of lesson.scenes.flatMap((scene) => scene.beats))
      required.add(speechKey(beat, courseNarrator, adapterHash));
  }
  const copied = new Map();
  const rejected = [];
  for (const file of timelines) {
    const timeline = await readJson(file);
    for (const sound of (timeline.scenes ?? []).flatMap((scene) => scene.sounds ?? [])) {
      if (!required.has(sound.key) || copied.has(sound.key)) continue;
      try {
        const audio = await fileRecord(sound.audio),
          words = await fileRecord(sound.boundaries);
        if (audio.sha256 !== sound.audioHash || words.sha256 !== sound.boundariesHash)
          throw new Error('Retained provider hash mismatch');
        if (!(await readJson(words.path)).words?.length)
          throw new Error('Retained provider words are absent');
        for (const [record, extension] of [
          [audio, '.mp3'],
          [words, '.json'],
        ])
          await fs.copyFile(
            record.path,
            path.join(cache, sound.key + extension),
            constants.COPYFILE_EXCL,
          );
        copied.set(sound.key, { key: sound.key, timeline: await fileRecord(file), audio, words });
      } catch (error) {
        rejected.push({ timeline: file, key: sound.key, error: error.message });
      }
    }
  }
  return {
    required: required.size,
    retained: copied.size,
    missing: [...required].filter((key) => !copied.has(key)),
    copied: [...copied.values()],
    rejected,
  };
}

export function newInspectionProgress(plan) {
  return {
    version: 1,
    kind: 'leetllm.inspection-progress',
    status: 'prepared',
    updatedAt: new Date().toISOString(),
    lessons: plan.lessons.map(({ id }) => ({
      id,
      status: 'pending',
      directionReview: 'unrevisited',
      attempts: [],
    })),
  };
}

export function inspectionRenderArgs(entry, { audioOnly = false } = {}) {
  return [
    'videos/render.mjs',
    '--lesson',
    entry.id,
    ...(entry.mode === 'stage' ? ['--stage', '--workers', '2', '--quality', 'high'] : []),
    '--output',
    entry.output,
    '--width',
    String(entry.width),
    '--fps',
    String(entry.fps),
    '--threads',
    '2',
    '--tts-script',
    entry.ttsScript,
    '--no-manifest',
    '--preserve-failed-stage',
    ...(audioOnly ? ['--audio-only'] : ['--retained-audio-only']),
  ];
}

/** The first two complete Canvas films are the calibration, before increasing concurrency. */
export function inspectionAdmission(
  entry,
  active,
  resources,
  completed,
  limits = INSPECTION_LIMITS,
) {
  const canvas = active.filter((row) => row.mode === 'canvas').length;
  const stage = active.filter((row) => row.mode === 'stage').length;
  const calibrated = completed.filter((row) => row.mode === 'canvas').length >= 2;
  const maxCanvas = calibrated ? limits.canvas : 2;
  if (entry.mode === 'stage' ? stage >= limits.stage : canvas >= maxCanvas) return false;
  if (
    resources.filmRss >= limits.filmRss - 3 * GiB ||
    resources.availableMemory < limits.minimumHostAvailable + 3 * GiB
  )
    return false;
  const recent = completed.filter((row) => row.mode === 'canvas').slice(-8);
  const canvasEstimate = recent.length
    ? Math.max(1.5, recent.reduce((sum, row) => sum + (row.cpuCores ?? 2.5), 0) / recent.length)
    : 2.5;
  const estimate = entry.mode === 'stage' ? 4 : canvasEstimate;
  return (
    Math.max(
      resources.busyCpu,
      active.reduce(
        (sum, row) => sum + (row.mode === 'stage' ? 4 : canvasEstimate),
        resources.otherFilmCpu,
      ),
    ) +
      estimate <=
    limits.cpu
  );
}

export function prioritizeInspectionLessons(lessons, priority = [], recovered = []) {
  if (
    new Set(priority).size !== priority.length ||
    priority.some((id) => !lessons.some((entry) => entry.id === id))
  )
    throw new Error('Priority IDs must be unique members of this inspection selection');
  const rank = (entry) =>
    recovered.includes(entry.id)
      ? -1
      : priority.includes(entry.id)
        ? priority.indexOf(entry.id)
        : priority.length + lessons.indexOf(entry);
  return [...lessons].sort((a, b) => rank(a) - rank(b));
}

async function resourceSample(previous, groups, clockTicks) {
  const at = performance.now();
  const raw = await fs.readFile('/proc/stat', 'utf8');
  const ticks = raw.split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
  const total = ticks.reduce((a, b) => a + b, 0),
    idle = ticks[3] + ticks[4];
  const memory = await fs.readFile('/proc/meminfo', 'utf8');
  const availableMemory = Number(memory.match(/^MemAvailable:\s+(\d+)/m)[1]) * 1024;
  const members = [];
  for (const pid of (await fs.readdir('/proc')).filter((name) => /^\d+$/.test(name))) {
    try {
      const stat = await fs.readFile(`/proc/${pid}/stat`, 'utf8');
      const fields = stat
        .slice(stat.lastIndexOf(')') + 2)
        .trim()
        .split(/\s+/);
      const command = await fs.readFile(`/proc/${pid}/cmdline`, 'utf8');
      const group = Number(fields[2]);
      if (groups.has(group) || /(?:videos\/render\.mjs|ffmpeg\u0000)/.test(command))
        members.push({
          pid: Number(pid),
          group,
          startTicks: fields[19],
          cpu: Number(fields[11]) + Number(fields[12]),
          rss: Number(fields[21]) * 4096,
          ours: groups.has(group),
        });
    } catch (error) {
      if (!['ENOENT', 'ESRCH', 'EACCES'].includes(error.code)) throw error;
    }
  }
  const elapsed = previous ? (at - previous.at) / 1000 : 1;
  let otherFilmCpu = 0;
  for (const row of members.filter((row) => !row.ours)) {
    const before = previous?.members.find(
      (old) => old.pid === row.pid && old.startTicks === row.startTicks,
    );
    if (before) otherFilmCpu += Math.max(0, row.cpu - before.cpu) / clockTicks / elapsed;
  }
  const busyCpu =
    previous && total > previous.total
      ? os.availableParallelism() * (1 - (idle - previous.idle) / (total - previous.total))
      : 0;
  return {
    at,
    total,
    idle,
    members,
    availableMemory,
    filmRss: members.reduce((sum, row) => sum + row.rss, 0),
    busyCpu,
    otherFilmCpu,
  };
}

export async function verifyInspectionDelivery(entry) {
  const directory = path.join(entry.output, entry.id);
  const receiptFile = path.join(directory, 'verification.json');
  const receipt = await readJson(receiptFile);
  if (
    receipt.id !== entry.id ||
    receipt.fingerprint !== entry.sourceManifest.fingerprint ||
    receipt.fullDecode !== 'passed' ||
    receipt.width !== entry.width ||
    receipt.frameAudit?.passed !== true ||
    !Object.keys(receipt.artifactSha256 ?? {}).length
  )
    throw new Error(`Incomplete or mismatched delivery: ${entry.id}`);
  for (const [name, expected] of Object.entries(receipt.artifactSha256 ?? {})) {
    const file = path.resolve(directory, name);
    if (
      !inside(directory, file) ||
      !inside(directory, await fs.realpath(file)) ||
      (await fileRecord(file)).sha256 !== expected
    )
      throw new Error(`Delivery artifact changed: ${entry.id}/${name}`);
  }
  const movie = await fileRecord(path.join(directory, `${entry.id}.mp4`));
  if (movie.sha256 !== receipt.sha256) throw new Error(`Movie checksum mismatch: ${entry.id}`);
  await verifiedClockReceipt(path.join(directory, `${entry.id}.mp4`), receipt, entry.fps);
  return {
    receipt: await fileRecord(receiptFile),
    movie,
    timeline: await fileRecord(path.join(directory, 'timeline.json')),
    captions: await Promise.all(
      ['srt', 'vtt'].map((ext) => fileRecord(path.join(directory, `${entry.id}.${ext}`))),
    ),
    chapters: await fileRecord(path.join(directory, `${entry.id}.chapters.txt`)),
    sourceFingerprint: receipt.fingerprint,
    runtime: receipt.renderEngine,
    fullDecode: receipt.fullDecode,
  };
}

export async function runInspection(
  directory,
  {
    limit = 199,
    planSha256,
    audioOnly = false,
    ids,
    audioPriority = [],
    renderPriority = [],
    resumeInterrupted = false,
    stateFile = 'progress.json',
    retryEmptyStage = false,
    storageBudget,
    renderReservationBytes = DEFAULT_RENDER_RESERVATION,
    audioReservationBytes = DEFAULT_AUDIO_RESERVATION,
  } = {},
) {
  if (!storageBudget) throw new Error('A measured --storage-budget is required; admission refused');
  await admissionStatus(storageBudget);
  directory = await fs.realpath(directory);
  if ((await fileRecord(path.join(directory, 'inspection.json'))).sha256 !== planSha256)
    throw new Error('Exact inspection plan SHA-256 is required');
  const plan = await readJson(path.join(directory, 'inspection.json'));
  if (plan.kind !== 'leetllm.inspection-collection' || plan.runtime.version !== '0.8.1')
    throw new Error('Unknown inspection collection');
  const supplemental = stateFile !== 'progress.json';
  if (
    supplemental &&
    (!/^progress-stage-[a-z0-9-]+\.json$/.test(stateFile) ||
      !ids?.length ||
      ids.some((id) => plan.lessons.find((entry) => entry.id === id)?.mode !== 'stage'))
  )
    throw new Error('Supplemental ledgers require explicitly selected Stage lessons');
  const progressPath = path.join(directory, stateFile);
  const lockPath = path.join(
    directory,
    supplemental ? stateFile.replace(/\.json$/, '.lock') : 'controller.lock',
  );
  const lock = await fs.open(lockPath, 'wx');
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    await verifyFiles(plan.repository, plan.sourceFreeze.files);
    const installed = await inventoryTree(path.join(plan.repository, 'videos/node_modules'));
    if (
      JSON.stringify(installed) !== JSON.stringify(await readJson(plan.runtime.dependencies.path))
    )
      throw new Error('Shared dependencies changed');
    for (const record of plan.toolchain)
      if ((await fileRecord(record.path)).sha256 !== record.sha256)
        throw new Error(`Toolchain changed: ${record.command}`);
    let progress;
    try {
      progress = await readJson(progressPath);
    } catch (error) {
      if (error.code !== 'ENOENT' || !supplemental) throw error;
      const original = await fs.readFile(path.join(directory, 'progress.json'));
      const preserved = path.join(directory, stateFile.replace(/\.json$/, '-input.json'));
      await fs.writeFile(preserved, original, { flag: 'wx' });
      progress = JSON.parse(original);
      progress.lessons = progress.lessons.filter((entry) => ids.includes(entry.id));
      progress.inspectionPlan = {
        path: path.join(directory, 'inspection.json'),
        sha256: planSha256,
      };
      progress.parentProgress = await fileRecord(preserved);
      progress.supplementalSelection = ids;
    }
    if (retryEmptyStage) {
      if (!supplemental) throw new Error('Empty Stage retries need a separate bound Stage ledger');
      for (const row of progress.lessons) {
        const entry = plan.lessons.find((item) => item.id === row.id);
        if (
          row.status !== 'failed' ||
          row.attempts.at(-1)?.pid ||
          !row.error?.startsWith('Unverified existing scene cache:') ||
          !(await isOwnedEmptyStageCache(entry, row))
        )
          throw new Error(`Not a verified pre-render empty Stage cache failure: ${row.id}`);
        row.emptyStageRetry = { originalError: row.error, at: new Date().toISOString() };
        row.status = 'audio-ready';
        delete row.error;
      }
    }
    if (resumeInterrupted)
      await recoverInspectionInterrupted({
        directory,
        plan,
        progress,
        planSha256,
        progressFile: stateFile,
      });
    if (
      ids &&
      (new Set(ids).size !== ids.length ||
        ids.some((id) => !plan.lessons.some((entry) => entry.id === id)))
    )
      throw new Error('Selected IDs must be unique members of the frozen collection');
    const selected = (
      ids ? ids.map((id) => plan.lessons.find((entry) => entry.id === id)) : plan.lessons
    ).slice(0, limit);
    const audioOrder = prioritizeInspectionLessons(selected, audioPriority);
    const renderOrder = prioritizeInspectionLessons(
      selected,
      renderPriority,
      progress.lessons.filter((row) => row.resumeCache).map((row) => row.id),
    );
    const env = {
      ...process.env,
      TMPDIR: path.join(directory, 'tmp'),
      UV_CACHE_DIR: path.join(directory, 'uv-cache'),
      UV_PYTHON_INSTALL_DIR: path.join(directory, 'uv-python'),
      XDG_CACHE_HOME: path.join(directory, 'cache'),
      XDG_DATA_HOME: path.join(directory, 'data'),
      npm_config_cache: path.join(directory, 'install-cache'),
      PATH: [...new Set(plan.toolchain.map((record) => path.dirname(record.path)))].join(
        path.delimiter,
      ),
    };
    await fs.mkdir(env.TMPDIR, { recursive: true });
    const active = new Map(),
      completed = progress.lessons
        .filter((row) => row.status === 'complete' && row.measurement)
        .map((row) => ({
          mode: plan.lessons.find((entry) => entry.id === row.id).mode,
          ...row.measurement,
        })),
      samples = [];
    let prior, audioTask;
    const clockTicks = Number((await exec('getconf', ['CLK_TCK'])).stdout.trim());
    if (!Number.isFinite(clockTicks) || clockTicks <= 0)
      throw new Error('Cannot resolve Linux CPU accounting clock');
    const persist = async () => {
      progress.updatedAt = new Date().toISOString();
      await writeJson(progressPath, progress, { replace: true });
      await writeJson(
        path.join(
          directory,
          supplemental ? stateFile.replace(/^progress-/, 'audio-index-') : 'audio-index.json',
        ),
        {
          version: 1,
          kind: 'leetllm.inspection-audio-index',
          planSha256,
          updatedAt: progress.updatedAt,
          repository: plan.repository,
          lessons: progress.lessons.map((entry) => ({
            id: entry.id,
            status: entry.audio ? 'prepared' : entry.status,
            ...(entry.audio ? { audio: entry.audio } : {}),
          })),
          sourceReview: 'pending',
          encodedReview: 'pending',
        },
        { replace: true },
      );
    };
    const row = (entry) => progress.lessons.find((item) => item.id === entry.id);
    await withCohortSignals(async (outerSignal) => {
      const controller = new AbortController();
      const signal = controller.signal;
      const forward = () => controller.abort(outerSignal.reason);
      outerSignal.addEventListener('abort', forward, { once: true });
      if (outerSignal.aborted) forward();
      progress.status = 'running';
      await persist();
      const launch = (entry, audioOnly, lease) => {
        const state = row(entry),
          started = performance.now();
        const attempt = {
          phase: audioOnly ? 'audio' : 'render',
          startedAt: new Date().toISOString(),
          log: path.join(
            directory,
            'logs',
            `${entry.id}-${audioOnly ? 'audio' : 'render'}-${state.attempts.length + 1}.log`,
          ),
        };
        state.attempts.push(attempt);
        state.status = audioOnly ? 'audio' : 'rendering';
        attempt.storageLease = lease;
        return (async () => {
          let storageWatcher;
          const taskController = new AbortController();
          const abortTask = () => taskController.abort(signal.reason);
          signal.addEventListener('abort', abortTask, { once: true });
          if (signal.aborted) abortTask();
          try {
            await fs.mkdir(entry.output, { recursive: true });
            const cache = path.join(entry.output, '.audio-cache');
            try {
              await fs.symlink(path.join(directory, 'audio-cache'), cache);
            } catch (error) {
              if (
                error.code !== 'EEXIST' ||
                (await fs.realpath(cache)) !== path.join(directory, 'audio-cache')
              )
                throw error;
            }
            if (!audioOnly) {
              // A fresh cache per ID means no historical scene footage can enter this run.
              const sceneCache = path.join(entry.output, '.scene-cache');
              let exists = false;
              try {
                await fs.access(sceneCache);
                exists = true;
              } catch (error) {
                if (error.code !== 'ENOENT') throw error;
              }
              if (exists) {
                if (await isOwnedEmptyStageCache(entry, state)) {
                  attempt.freshAudioOnlyStageCache = true;
                } else if (
                  state.resumeCache?.planSha256 !== planSha256 ||
                  JSON.stringify(await inventoryTree(sceneCache)) !==
                    JSON.stringify(state.resumeCache.files)
                )
                  throw new Error(`Unverified existing scene cache: ${entry.id}`);
                if (state.resumeCache) attempt.sameRunRecovery = state.resumeCache.recovery;
              }
            }
            attempt.process = await runLogged(
              process.execPath,
              inspectionRenderArgs(entry, { audioOnly }),
              {
                cwd: plan.repository,
                env,
                signal: taskController.signal,
                log: attempt.log,
                onStart: (pid) => {
                  attempt.pid = pid;
                  storageWatcher = enforceStorageLease(lease, pid, {
                    stopOwned: (error) => taskController.abort(error),
                  });
                  if (!audioOnly) active.set(entry.id, { ...entry, pid, cpuTicks: 0, peakRss: 0 });
                },
              },
            );
            await storageWatcher?.stop();
            if (audioOnly) {
              const timelineFile = path.join(entry.output, 'previews', entry.id, 'timeline.json');
              const timeline = await readJson(timelineFile);
              const sounds = timeline.scenes.flatMap((scene) => scene.sounds);
              for (const sound of sounds) {
                if (
                  (await fileRecord(sound.audio)).sha256 !== sound.audioHash ||
                  (await fileRecord(sound.boundaries)).sha256 !== sound.boundariesHash
                )
                  throw new Error(`Prepared provider bytes changed: ${entry.id}/${sound.key}`);
              }
              state.audio = {
                timeline: await fileRecord(timelineFile),
                sourceFingerprint: entry.sourceManifest.fingerprint,
                ttsAdapter: timeline.ttsAdapter,
                sounds: sounds.map(
                  ({
                    key,
                    audio,
                    boundaries,
                    audioHash,
                    boundariesHash,
                    duration,
                    sceneIndex,
                    beatIndex,
                  }) => ({
                    key,
                    audio,
                    boundaries,
                    audioHash,
                    boundariesHash,
                    duration,
                    sceneIndex,
                    beatIndex,
                  }),
                ),
              };
              state.status = 'audio-ready';
            } else {
              state.delivery = await verifyInspectionDelivery(entry);
              state.status = 'complete';
              const measured = active.get(entry.id);
              state.measurement = {
                seconds: (performance.now() - started) / 1000,
                peakRss: measured.peakRss,
                cpuCores: measured.cpuTicks / clockTicks / ((performance.now() - started) / 1000),
              };
              completed.push({ mode: entry.mode, ...state.measurement });
            }
          } catch (error) {
            state.status = signal.aborted ? 'interrupted' : 'failed';
            state.error = error.message;
            attempt.error = error.message;
          } finally {
            signal.removeEventListener('abort', abortTask);
            try {
              await storageWatcher?.stop();
            } catch (error) {
              state.status = 'failed';
              state.error = attempt.error = error.message;
            }
            try {
              attempt.storageSettlement = await settleStorage(storageBudget, lease, {
                reason: state.status,
              });
            } catch (error) {
              state.status = 'failed';
              state.error = attempt.error = error.message;
            }
            attempt.finishedAt = new Date().toISOString();
            active.delete(entry.id);
            if (audioOnly) audioTask = null;
          }
        })();
      };
      const running = new Set();
      try {
        while (true) {
          signal.throwIfAborted();
          const storage = await assertInspectionStorage(directory, plan.storage, plan.limits);
          progress.admission = {
            status: storage.canAdmit ? 'open' : 'paused-root-reserve',
            reason: storage.reason,
            rootAvailableBytes: storage.rootAvailableBytes,
            threshold: plan.limits.minimumRootBytes,
            emergencyThreshold: plan.limits.emergencyRootBytes ?? 16 * GiB,
          };
          const resources = await resourceSample(
            prior,
            new Set([...active.values()].map((entry) => entry.pid)),
            clockTicks,
          );
          for (const entry of active.values()) {
            const members = resources.members.filter((member) => member.group === entry.pid);
            entry.peakRss = Math.max(
              entry.peakRss,
              members.reduce((sum, member) => sum + member.rss, 0),
            );
            for (const member of members) {
              const before = prior?.members.find(
                (old) => old.pid === member.pid && old.startTicks === member.startTicks,
              );
              if (before) entry.cpuTicks += Math.max(0, member.cpu - before.cpu);
            }
          }
          prior = resources;
          samples.push({
            at: new Date().toISOString(),
            active: [...active.keys()],
            busyCpu: resources.busyCpu,
            otherFilmCpu: resources.otherFilmCpu,
            filmRss: resources.filmRss,
            availableMemory: resources.availableMemory,
          });
          if (storage.canAdmit && !audioTask) {
            const next = audioOrder.find((entry) => row(entry).status === 'pending');
            if (next) {
              const lease = await reserveStorage(storageBudget, {
                store: 'external',
                bytes: audioReservationBytes,
                outputs: [next.output, path.join(directory, 'audio-cache')],
                owner: `${planSha256}/${next.id}/audio`,
              });
              if (lease) audioTask = launch(next, true, lease);
              else
                progress.admission = {
                  ...progress.admission,
                  status: 'paused-storage-budget',
                  budget: await admissionStatus(storageBudget),
                };
            }
          }
          for (const entry of audioOnly || !storage.canAdmit
            ? []
            : renderOrder.filter((entry) => row(entry).status === 'audio-ready')) {
            if (
              !inspectionAdmission(entry, [...active.values()], resources, completed, plan.limits)
            )
              continue;
            const lease = await reserveStorage(storageBudget, {
              store: 'external',
              bytes: renderReservationBytes,
              outputs: [entry.output],
              owner: `${planSha256}/${entry.id}/render`,
            });
            if (!lease) {
              progress.admission = {
                ...progress.admission,
                status: 'paused-storage-budget',
                budget: await admissionStatus(storageBudget),
              };
              break;
            }
            const task = launch(entry, false, lease);
            running.add(task);
            task.finally(() => running.delete(task));
            // launch awaits filesystem setup before registering its PID; admit one per sample.
            break;
          }
          await persist();
          if (
            !audioTask &&
            !running.size &&
            !selected.some((entry) =>
              (audioOnly
                ? ['pending', 'audio']
                : ['pending', 'audio-ready', 'audio', 'rendering']
              ).includes(row(entry).status),
            )
          )
            break;
          await delay(5000, undefined, { signal });
        }
      } catch (error) {
        controller.abort(error); // Only the process leases launched by this controller receive signals.
        progress.status = outerSignal.aborted ? 'interrupted' : 'blocked';
        progress.error = error.message;
        throw error;
      } finally {
        await Promise.allSettled([...running, ...(audioTask ? [audioTask] : [])]);
        outerSignal.removeEventListener('abort', forward);
        await writeJson(path.join(directory, `resources-${Date.now()}.json`), samples);
        await persist();
      }
      progress.status = selected.some(
        (entry) => row(entry).status !== (audioOnly ? 'audio-ready' : 'complete'),
      )
        ? 'complete-with-failures'
        : audioOnly
          ? 'audio-prepared'
          : 'complete';
    });
    await persist();
    return progress;
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
}
