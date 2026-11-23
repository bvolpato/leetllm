import { courseNarrator, speechKey } from './course-speech.mjs';
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { productionSourceManifest, verifyProductionSources } from './lesson-production.mjs';
import { snapshotLessonSource } from './lesson-snapshot.mjs';
import { hashDeliveryFiles } from './delivery.mjs';
import { withCohortSignals, spawnCohortProcess, runCohortPool } from './cohort-process.mjs';
import {
  V081_POLICY,
  PARALLEL_POLICY,
  cohortPolicy,
  cohortSettings,
  releaseIdentity,
  validateCohortDefinition,
  validateV2Plan,
} from './cohort-definition.mjs';
import {
  sha256,
  fileRecord,
  copyVerifiedFile,
  privateInstallEnvironment,
  readJson,
  writeJson,
  confined,
  verifiedRecord,
  preserveAuthorities,
  dependencyInventory,
  availableBytes,
  directoryBytes,
} from './cohort-files.mjs';

export const COHORT_POLICY = Object.freeze({
  runtimeVersion: '0.8.0',
  diskFloorBytes: 40 * 1024 ** 3,
  attemptEnvelopeBytes: 3 * 1024 ** 3,
  simultaneousFilms: 1,
});
const subjects = new Map([
  ['attention', 'stage'],
  ['kv-cache', 'stage'],
  ['tokenization', 'stage'],
  ['cuda-execution', 'canvas'],
  ['decision-models-jev-kev', 'canvas'],
  ['state-space-models', 'canvas'],
  ['conformal', 'canvas'],
  ['mixed-precision', 'canvas'],
]);
const exec = promisify(execFile);

async function toolchain() {
  const records = [];
  for (const command of ['node', 'ffmpeg', 'ffprobe']) {
    let file = command === 'node' ? process.execPath : undefined;
    for (const directory of file ? [] : process.env.PATH.split(path.delimiter)) {
      try {
        await fs.access(path.join(directory, command), constants.X_OK);
        file = path.join(directory, command);
        break;
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'EACCES') throw error;
      }
    }
    if (!file) throw new Error(`Required renderer executable missing: ${command}`);
    file = await fs.realpath(file);
    const version = (
      await exec(file, [command === 'node' ? '--version' : '-version'])
    ).stdout.split('\n')[0];
    records.push({ command, ...(await fileRecord(file)), version });
  }
  return records;
}
async function verifyToolchain(plan) {
  for (const executable of plan.toolchain)
    if ((await fileRecord(executable.path)).sha256 !== executable.sha256)
      throw new Error(`Renderer toolchain changed: ${executable.command}`);
}
async function verifyAudio(directory, plan) {
  for (const sound of plan.audio)
    for (const [original, extension] of [
      [sound.audio, '.mp3'],
      [sound.words, '.json'],
    ]) {
      const local = path.join(directory, 'output/.audio-cache', sound.key + extension);
      if ((await fileRecord(local)).sha256 !== original.sha256)
        throw new Error(`Retained audio cache changed: ${sound.key}${extension}`);
    }
}
async function withJobLock(jobFile, callback) {
  const directory = path.dirname(await fs.realpath(jobFile));
  const file = path.join(directory, '.state.lock'),
    lock = await fs.open(file, 'wx');
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid }) + '\n');
    return await callback();
  } finally {
    await lock.close();
    await fs.unlink(file);
  }
}

export function assertDiskAdmission(available, policy = COHORT_POLICY, attempts = 1) {
  if (
    !Number.isFinite(available) ||
    available < policy.diskFloorBytes + policy.attemptEnvelopeBytes * attempts
  )
    throw new Error(
      `Insufficient render space: ${available} bytes available; keep ${policy.diskFloorBytes} free plus ${policy.attemptEnvelopeBytes * attempts} for ${attempts} active attempt(s)`,
    );
}
const verifySource = (root, manifest) =>
  verifyProductionSources(root, {
    id: manifest.id,
    sourceManifest: manifest,
    fingerprint: manifest.fingerprint,
    renderEngine: manifest.renderEngine,
  });
function completion(child) {
  return new Promise((resolve) => {
    child.once('error', (error) => resolve({ error }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
}
async function run(command, args, cwd, logFile) {
  const log = await fs.open(logFile, 'wx');
  try {
    const child = spawn(command, args, {
      cwd,
      timeout: 600000,
      stdio: ['ignore', log.fd, log.fd],
      env: await privateInstallEnvironment(path.dirname(logFile)),
    });
    const result = await completion(child);
    if (result.error) throw result.error;
    if (result.code !== 0)
      throw new Error(`${command} exited ${result.code ?? result.signal}; see ${logFile}`);
  } finally {
    await log.close();
  }
}
async function verifySnapshot(directory, plan) {
  await verifiedRecord(directory, plan.manifest);
  await verifiedRecord(directory, plan.runtimeMaterialization);
  await verifiedRecord(directory, plan.tarball);
  const snapshot = await readJson((await verifiedRecord(directory, plan.snapshot)).path);
  const root = await confined(directory, 'source'),
    repository = await confined(root, 'repository');
  if (
    snapshot.repository !== repository ||
    JSON.stringify(snapshot.manifest) !== JSON.stringify(plan.sourceManifest)
  )
    throw new Error('Snapshot differs from the immutable job plan');
  for (const file of snapshot.runtimeFiles)
    await verifiedRecord(root, { ...file, path: `vizmatic/${file.path}` });
  await verifySource(repository, plan.sourceManifest);
  return { root, repository };
}
async function loadJob(jobFile) {
  jobFile = await fs.realpath(jobFile);
  const directory = path.dirname(jobFile),
    state = await readJson(jobFile);
  if (path.basename(jobFile) !== 'job.json') throw new Error('Expected a cohort job.json');
  const planFile = await verifiedRecord(directory, state.plan),
    plan = await readJson(planFile.path);
  if (planFile.path !== path.join(directory, 'plan.json'))
    throw new Error('Unsupported cohort plan or first-wave subject');
  if (plan.version === 2) {
    const definitionFile = await verifiedRecord(directory, plan.cohortDefinition);
    const namespace = await fileRecord(
      path.join(path.dirname(directory), 'cohort-definition.json'),
    );
    if (namespace.sha256 !== definitionFile.sha256)
      throw new Error('Job differs from its cohort namespace definition');
    validateV2Plan(plan, await readJson(definitionFile.path));
  } else {
    if (
      plan.version !== 1 ||
      subjects.get(plan.id) !== plan.mode ||
      plan.sourceManifest?.renderEngine?.version !== COHORT_POLICY.runtimeVersion ||
      JSON.stringify(plan.policy) !== JSON.stringify(COHORT_POLICY)
    )
      throw new Error('Unsupported cohort plan or first-wave subject');
    await assertLegacyNamespace(path.dirname(directory));
  }
  return { jobFile, directory, state, plan, planFile };
}

async function assertLegacyNamespace(cohortRoot) {
  try {
    await fs.access(path.join(cohortRoot, 'cohort-definition.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error('A legacy job cannot enter a versioned cohort namespace');
}

async function bindCohortNamespace(cohortRoot, record) {
  for (const entry of await fs.readdir(cohortRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(cohortRoot, entry.name, 'job.json');
    let state;
    try {
      state = await readJson(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      continue;
    }
    if (!state.plan) {
      if (state.cohortDefinitionSha256 === record.sha256) continue;
      throw new Error('A new cohort cannot reuse a legacy or different cohort namespace');
    }
    const plan = await readJson((await verifiedRecord(path.dirname(file), state.plan)).path);
    if (plan.version !== 2 || plan.cohortDefinition?.sha256 !== record.sha256)
      throw new Error('A new cohort cannot reuse a legacy or different cohort namespace');
  }
  const file = path.join(cohortRoot, 'cohort-definition.json');
  try {
    await copyVerifiedFile(record, file);
  } catch (error) {
    if (error.code !== 'EEXIST' || (await fileRecord(file)).sha256 !== record.sha256) throw error;
  }
}
async function verifyDependencies(directory, plan, root) {
  const expected = await readJson((await verifiedRecord(directory, plan.dependencies)).path);
  if (JSON.stringify(await dependencyInventory(root)) !== JSON.stringify(expected))
    throw new Error('Private installed dependencies changed');
}

async function copyRetainedAudio(lesson, timelines, adapter, output) {
  const required = new Map(
    lesson.scenes.flatMap((scene, sceneIndex) =>
      scene.beats.map((beat, beatIndex) => [
        speechKey(beat.say, courseNarrator, adapter.sha256),
        { scene: scene.id, sceneIndex, beatIndex },
      ]),
    ),
  );
  const copied = new Map();
  await fs.mkdir(output, { recursive: true });
  for (const timeline of timelines)
    for (const scene of timeline.scenes ?? []) {
      for (const sound of scene.sounds ?? []) {
        if (!required.has(sound.key) || copied.has(sound.key)) continue;
        const audio = await fileRecord(sound.audio),
          words = await fileRecord(sound.boundaries);
        if (audio.sha256 !== sound.audioHash || words.sha256 !== sound.boundariesHash)
          throw new Error(`Retained provider bytes changed: ${scene.id}/${sound.key}`);
        if (!(await readJson(words.path)).words?.length)
          throw new Error(`Provider words absent: ${words.path}`);
        for (const [file, extension] of [
          [audio, '.mp3'],
          [words, '.json'],
        ])
          await copyVerifiedFile(file, path.join(output, sound.key + extension));
        copied.set(sound.key, { key: sound.key, ...required.get(sound.key), audio, words });
      }
    }
  const missing = [...required].filter(([key]) => !copied.has(key));
  if (missing.length)
    throw new Error(`Retained-only audio gate: ${missing.length} speech cache keys are missing`);
  return [...copied.values()];
}

/** Install and preflight a selected immutable snapshot before requesting its source gate. */
export async function prepareCohortJob({ consumerRoot, authorityRoot, cohortRoot, subjectFile }) {
  consumerRoot = await fs.realpath(consumerRoot);
  authorityRoot = await fs.realpath(authorityRoot);
  cohortRoot = path.resolve(cohortRoot);
  await fs.mkdir(cohortRoot, { recursive: true });
  assertDiskAdmission(await availableBytes(cohortRoot));
  const subject = await readJson(subjectFile);
  const modern = subject.version === 2;
  if (!modern && (subject.version !== 1 || subjects.get(subject.id) !== subject.mode))
    throw new Error('Subject is outside the approved first-wave cohort');
  let runtime, release, definitionRecord;
  let policy = COHORT_POLICY;
  if (modern) {
    runtime = await verifiedRecord(consumerRoot, subject.runtimeMaterialization);
    release = await readJson(runtime.path);
    if (release.runtimeVersion !== V081_POLICY.runtimeVersion || !release.cohortDefinition?.sha256)
      throw new Error('The new cohort requires its exact 0.8.1 materialization definition');
    definitionRecord = await verifiedRecord(path.dirname(consumerRoot), release.cohortDefinition);
    const definition = validateCohortDefinition(await readJson(definitionRecord.path));
    policy = cohortPolicy(definition.policyId);
    if (!definition.subjects.some(({ id, mode }) => id === subject.id && mode === subject.mode))
      throw new Error('Subject is outside the bound cohort definition');
    await bindCohortNamespace(cohortRoot, definitionRecord);
  } else await assertLegacyNamespace(cohortRoot);
  const manifest = await productionSourceManifest({
    root: consumerRoot,
    id: subject.id,
    mode: subject.mode,
    ttsScript: subject.ttsScript ?? courseNarrator.ttsScript,
  });
  if (manifest.renderEngine.version !== policy.runtimeVersion)
    throw new Error(`This cohort requires exact signed Vizmatic ${policy.runtimeVersion}`);
  const lesson = parse(await fs.readFile(path.join(consumerRoot, manifest.lessonFile), 'utf8'));
  for (const name of [
    manifest.lessonFile,
    manifest.moduleFile,
    `videos/coverage/${subject.id}.yaml`,
    `web/src/content/${lesson.source}`,
  ]) {
    const actual = manifest.closure.files.find((file) => file.path === name);
    if (
      !actual ||
      !subject.sourceBindings?.some(
        (binding) => binding.path === name && binding.sha256 === actual.sha256,
      )
    )
      throw new Error(`Current candidate binding absent or different: ${name}`);
  }
  const directory = await fs.mkdtemp(
    path.join(cohortRoot, `${subject.id}-${manifest.fingerprint.slice(0, 12)}-`),
  );
  const jobFile = path.join(directory, 'job.json');
  const state = {
    version: 1,
    state: 'preparing',
    createdAt: new Date().toISOString(),
    ...(definitionRecord ? { cohortDefinitionSha256: definitionRecord.sha256 } : {}),
  };
  await writeJson(jobFile, state);
  try {
    const authorities = await preserveAuthorities(
      authorityRoot,
      subject.authorities,
      path.join(directory, 'authorities'),
    );
    const releaseAuthorities = await preserveAuthorities(
      authorityRoot,
      subject.releaseAuthorities,
      path.join(directory, 'release-authorities'),
    );
    runtime ??= await verifiedRecord(consumerRoot, subject.runtimeMaterialization);
    release ??= await readJson(runtime.path);
    const identity = releaseIdentity(policy.runtimeVersion);
    if (
      release.kind !== 'leetllm.vizmatic-release-materialization' ||
      release.version !== 1 ||
      release.runtimeVersion !== V081_POLICY.runtimeVersion ||
      release.sourceCommit !== identity.sourceCommit ||
      release.sourceTag !== identity.sourceTag ||
      release.uploadSha1 !== identity.uploadSha1 ||
      !['accepted-upload-payload', 'registry-tarball'].includes(release.distribution) ||
      (modern && release.distribution !== 'registry-tarball') ||
      !release.tarball?.sha256 ||
      !release.runtimeFiles?.length
    )
      throw new Error('Exact signed-release payload materialization authority is required');
    if (definitionRecord)
      await copyVerifiedFile(definitionRecord, path.join(directory, 'cohort-definition.json'));
    const tarball = await verifiedRecord(path.dirname(consumerRoot), release.tarball);
    await copyVerifiedFile(tarball, path.join(directory, 'release.tgz'));
    const snapshot = await snapshotLessonSource({
      root: consumerRoot,
      destination: path.join(directory, 'source'),
      manifest,
    });
    const root = path.join(directory, 'source');
    for (const file of snapshot.runtimeFiles) {
      const published = release.runtimeFiles.find((value) => value.path === file.path);
      if (!published || published.sha256 !== file.sha256)
        throw new Error(`Snapshot runtime lacks release authority: ${file.path}`);
      await verifiedRecord(root, { ...published, path: `vizmatic/${file.path}` });
    }
    await copyVerifiedFile(runtime, path.join(directory, 'runtime-materialization.json'));
    const installation = [];
    for (const [index, install] of snapshot.install.entries()) {
      assertDiskAdmission(await availableBytes(directory));
      const args = install.command.slice(1);
      if (install.command[0] === 'pnpm')
        args.push('--package-import-method=copy', '--store-dir', path.join(root, 'pnpm-store'));
      installation.push({ cwd: install.cwd, command: [install.command[0], ...args] });
      await run(
        install.command[0],
        args,
        await confined(root, install.cwd),
        path.join(directory, `install-${index}.log`),
      );
    }
    for (const file of snapshot.runtimeFiles)
      await verifiedRecord(root, { ...file, path: `vizmatic/${file.path}` });
    await verifySource(snapshot.repository, manifest);
    await writeJson(
      path.join(directory, 'installed-dependencies.json'),
      await dependencyInventory(root),
    );
    const timelines = [];
    for (const value of subject.audioTimelines ?? []) {
      const record = await verifiedRecord(authorityRoot, value);
      timelines.push({ record, timeline: await readJson(record.path) });
    }
    const audio = await copyRetainedAudio(
      lesson,
      timelines.map((value) => value.timeline),
      await fileRecord(path.join(consumerRoot, manifest.ttsScript)),
      path.join(directory, 'output/.audio-cache'),
    );
    const settings = cohortSettings(subject.mode);
    await run(
      process.execPath,
      [
        path.join(snapshot.repository, 'videos/render.mjs'),
        '--lesson',
        subject.id,
        ...(subject.mode === 'stage' ? ['--stage'] : []),
        '--audio-only',
        '--retained-audio-only',
        '--fps',
        String(settings.fps),
        '--output',
        path.join(directory, 'output'),
        '--tts-script',
        manifest.ttsScript,
      ],
      snapshot.repository,
      path.join(directory, 'audio-preflight.log'),
    );
    await writeJson(path.join(directory, 'current-source-manifest.json'), manifest);
    const localRecord = async (name) => ({
      ...(await fileRecord(path.join(directory, name))),
      path: name,
    });
    const plan = {
      version: modern ? 2 : 1,
      id: subject.id,
      mode: subject.mode,
      policy,
      settings,
      ...(definitionRecord
        ? { cohortDefinition: await localRecord('cohort-definition.json') }
        : {}),
      subject: await fileRecord(subjectFile),
      sourceManifest: manifest,
      manifest: await localRecord('current-source-manifest.json'),
      snapshot: await localRecord('source/source-snapshot.json'),
      dependencies: await localRecord('installed-dependencies.json'),
      runtimeMaterialization: await localRecord('runtime-materialization.json'),
      tarball: await localRecord('release.tgz'),
      authorities,
      releaseAuthorities,
      audio,
      toolchain: await toolchain(),
      installation,
      audioTimelines: timelines.map((value) => value.record),
      failurePolicy:
        'Preserve failed stages, caches, logs and snapshots. Never rerun an attempted job.',
      encodedReviewRequired: true,
      humanSoundWatch: false,
      nativeAppleDecode: false,
      publicationApproved: false,
    };
    await writeJson(path.join(directory, 'plan.json'), plan);
    state.plan = await localRecord('plan.json');
    state.state = 'awaiting-source-runtime-approval';
    await writeJson(jobFile, state, { replace: true });
    return jobFile;
  } catch (error) {
    state.state = 'preparation-blocked';
    state.failure = { at: new Date().toISOString(), message: error.message };
    await writeJson(jobFile, state, { replace: true });
    throw error;
  }
}

export function validateCohortApproval(plan, approval, planSha256) {
  if (
    approval.version !== 1 ||
    approval.id !== plan.id ||
    approval.decision !== 'accepted' ||
    approval.scope !== 'source-runtime-renewal' ||
    typeof approval.reviewer !== 'string' ||
    !approval.reviewer.trim() ||
    approval.planSha256 !== planSha256 ||
    approval.fingerprint !== plan.sourceManifest.fingerprint ||
    approval.sourceManifestSha256 !== plan.manifest.sha256 ||
    approval.movieApproved !== false
  )
    throw new Error(
      'Approval must bind this exact source/runtime plan and retain the independent movie gate',
    );
  if (!Array.isArray(approval.evidence) || !approval.evidence.length)
    throw new Error('Current-runtime source/native evidence is required');
}
export async function approveCohortJob(inputs) {
  return withJobLock(inputs.jobFile, () => approveJob(inputs));
}
async function approveJob({ jobFile, approvalFile, authorityRoot }) {
  const job = await loadJob(jobFile);
  if (job.state.state !== 'awaiting-source-runtime-approval')
    throw new Error(`Cannot approve job in ${job.state.state}`);
  const approval = await readJson(approvalFile);
  validateCohortApproval(job.plan, approval, job.planFile.sha256);
  const snapshot = await verifySnapshot(job.directory, job.plan);
  await verifyDependencies(job.directory, job.plan, snapshot.root);
  await verifyAudio(job.directory, job.plan);
  await verifyToolchain(job.plan);
  const attempt = await fs.mkdtemp(path.join(job.directory, 'approval-'));
  const evidence = await preserveAuthorities(
    await fs.realpath(authorityRoot),
    approval.evidence,
    path.join(attempt, 'evidence'),
  );
  const copy = path.join(attempt, 'source-approval.json');
  await copyVerifiedFile(await fileRecord(approvalFile), copy);
  if (JSON.stringify(await readJson(copy)) !== JSON.stringify(approval))
    throw new Error('Approval changed while preserving');
  job.state.approval = { ...(await fileRecord(copy)), path: path.relative(job.directory, copy) };
  job.state.approvalEvidence = evidence;
  job.state.state = 'queued';
  await writeJson(job.jobFile, job.state, { replace: true });
  return job.state;
}

async function processTreeMemory(pid) {
  const processes = [];
  async function visit(id) {
    try {
      const status = await fs.readFile(`/proc/${id}/status`, 'utf8');
      processes.push({
        pid: Number(id),
        rssKiB: Number(status.match(/^VmRSS:\s+(\d+) kB$/m)?.[1]) || 0,
        highWaterKiB: Number(status.match(/^VmHWM:\s+(\d+) kB$/m)?.[1]) || 0,
      });
      const children = await fs.readFile(`/proc/${id}/task/${id}/children`, 'utf8');
      for (const child of children.trim().split(/\s+/).filter(Boolean)) await visit(child);
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error;
    }
  }
  if (pid) await visit(pid);
  return { processes, rssKiB: processes.reduce((sum, value) => sum + value.rssKiB, 0) };
}
async function executeSnapshot(job, repository, { signal }) {
  const log = await fs.open(path.join(job.directory, 'render.log'), 'wx');
  const initialFreeBytes = await availableBytes(job.directory);
  const resources = {
    initialFreeBytes,
    minimumFreeBytes: initialFreeBytes,
    sampledPeakJobBytes: 0,
    sampledPeakTreeRssKiB: 0,
    samples: [],
  };
  const settings =
    job.plan.version === 2
      ? job.plan.settings
      : { ...cohortSettings(job.plan.mode), fps: job.plan.settings.fps };
  const args = [
    '--max-old-space-size=4096',
    path.join(repository, 'videos/render.mjs'),
    '--lesson',
    job.plan.id,
    '--width',
    String(settings.width),
    '--fps',
    String(settings.fps),
    '--threads',
    String(settings.threads),
    '--workers',
    String(settings.workers),
    '--quality',
    settings.quality,
    '--tts-script',
    job.plan.sourceManifest.ttsScript,
    '--output',
    path.join(job.directory, 'output'),
    '--no-manifest',
    '--preserve-failed-stage',
    '--retained-audio-only',
    ...(job.plan.mode === 'stage' ? ['--stage'] : []),
  ];
  let child,
    worker,
    done,
    finished = false,
    monitor,
    monitoring = Promise.resolve(),
    failure,
    observing = false;
  try {
    worker = spawnCohortProcess(process.execPath, args, {
      signal,
      cwd: repository,
      env: {
        ...process.env,
        VIZMATIC_DISABLE_NETWORK: '1',
        VIZMATIC_OFFLINE: '1',
        PATH: [...new Set(job.plan.toolchain.map((file) => path.dirname(file.path)))].join(
          path.delimiter,
        ),
      },
      stdio: ['ignore', log.fd, log.fd],
    });
    child = worker.child;
    done = worker.completion.then((result) => {
      finished = true;
      return result;
    });
    job.state.pid = child.pid;
    job.state.command = { executable: process.execPath, args, cwd: repository };
    await writeJson(job.jobFile, job.state, { replace: true });
    const observe = async () => {
      const freeBytes = await availableBytes(job.directory),
        jobBytes = await directoryBytes(job.directory);
      const memory = await processTreeMemory(child.pid);
      resources.minimumFreeBytes = Math.min(resources.minimumFreeBytes, freeBytes);
      resources.sampledPeakJobBytes = Math.max(resources.sampledPeakJobBytes, jobBytes);
      resources.sampledPeakTreeRssKiB = Math.max(resources.sampledPeakTreeRssKiB, memory.rssKiB);
      resources.samples.push({ at: new Date().toISOString(), freeBytes, jobBytes, memory });
      if (freeBytes < job.plan.policy.diskFloorBytes)
        throw new Error('Render crossed the cohort free-space floor');
    };
    const schedule = () => {
      if (observing) return;
      observing = true;
      monitoring = observe()
        .catch((error) => {
          failure ??= error;
          worker.stop(error);
        })
        .finally(() => {
          observing = false;
        });
    };
    schedule();
    monitor = setInterval(schedule, 5000);
    const result = await done;
    job.state.workerOutcome = {
      code: result.code,
      signal: result.signal,
      directChildReaped: result.directChildReaped,
      group: result.group,
      error: result.error?.message,
      reason: result.reason?.message,
    };
    if (result.error) throw result.error;
    if (result.reason) throw result.reason;
    clearInterval(monitor);
    await monitoring;
    if (failure) throw failure;
    if (result.code !== 0)
      throw new Error(`Snapshot renderer exited ${result.code ?? result.signal}`);
  } finally {
    clearInterval(monitor);
    if (child && !finished) {
      worker.stop(new Error('Snapshot supervision stopped before worker completion'));
      await done;
    }
    await monitoring;
    await log.close();
    resources.finalFreeBytes = await availableBytes(job.directory);
    resources.finalJobBytes = await directoryBytes(job.directory);
    resources.scope =
      'Five-second directory and descendant-process RSS samples. These sampled peaks can miss shorter peaks; free disk includes other host workloads.';
    await writeJson(path.join(job.directory, 'resources.json'), resources);
  }
}

export async function verifyCohortDelivery(out, plan) {
  const receipt = await readJson(path.join(out, 'verification.json')),
    hashes = await hashDeliveryFiles(out);
  const registered = { ...receipt.artifactSha256 };
  if (plan.mode === 'stage') {
    const report = await readJson(path.join(out, 'film-check.json'));
    if (
      !report.passed ||
      report.errors !== 0 ||
      report.sourceFingerprint !== plan.sourceManifest.fingerprint ||
      report.videoSha256 !== receipt.sha256
    )
      throw new Error('Stage post-render check differs from this movie/source');
    registered['film-check.json'] = hashes['film-check.json'];
  }
  if (
    JSON.stringify(Object.entries(hashes).sort()) !==
    JSON.stringify(Object.entries(registered).sort())
  )
    throw new Error('Rendered artifact registry is incomplete or changed');
  if (
    receipt.id !== plan.id ||
    receipt.fingerprint !== plan.sourceManifest.fingerprint ||
    receipt.fullDecode !== 'passed' ||
    receipt.sha256 !== hashes[`${plan.id}.mp4`]
  )
    throw new Error('Receipt does not verify this source/runtime movie');
  return { receipt, hashes };
}
async function runJob(jobFile, { signal, activeJobs }) {
  const job = await loadJob(jobFile);
  if (job.state.state !== 'queued') throw new Error(`Cannot render job in ${job.state.state}`);
  assertDiskAdmission(await availableBytes(job.directory), job.plan.policy, activeJobs());
  try {
    signal.throwIfAborted();
    const approval = await verifiedRecord(job.directory, job.state.approval);
    validateCohortApproval(job.plan, await readJson(approval.path), job.planFile.sha256);
    for (const value of job.state.approvalEvidence)
      await verifiedRecord(job.directory, value.preserved);
    const snapshot = await verifySnapshot(job.directory, job.plan);
    await verifyDependencies(job.directory, job.plan, snapshot.root);
    await verifyAudio(job.directory, job.plan);
    await verifyToolchain(job.plan);
    signal.throwIfAborted();
    job.state.state = 'rendering';
    job.state.startedAt = new Date().toISOString();
    await writeJson(job.jobFile, job.state, { replace: true });
    await executeSnapshot(job, snapshot.repository, { signal });
    await verifySource(snapshot.repository, job.plan.sourceManifest);
    await verifyDependencies(job.directory, job.plan, snapshot.root);
    await verifyAudio(job.directory, job.plan);
    await verifyToolchain(job.plan);
    signal.throwIfAborted();
    const out = path.join(job.directory, 'output', job.plan.id);
    const { receipt, hashes } = await verifyCohortDelivery(out, job.plan);
    await verifyProductionSources(snapshot.repository, receipt);
    await writeJson(path.join(job.directory, 'artifact-registry.json'), hashes);
    job.state.verification = await fileRecord(path.join(out, 'verification.json'));
    signal.throwIfAborted();
    job.state.state = 'rendered-awaiting-independent-review';
  } catch (error) {
    job.state.state = signal.aborted ? 'interrupted' : 'production-blocked';
    job.state.failure = { at: new Date().toISOString(), message: error.message };
    throw error;
  } finally {
    job.state.finishedAt = new Date().toISOString();
    await writeJson(job.jobFile, job.state, { replace: true });
  }
  return job.state;
}
export async function runCohort(cohortRoot, { jobs = 1, signal } = {}) {
  if (!Number.isSafeInteger(jobs) || jobs < 1 || jobs > PARALLEL_POLICY.simultaneousFilms)
    throw new Error(`--jobs must be an integer from 1 to ${PARALLEL_POLICY.simultaneousFilms}`);
  return withCohortSignals((signal) => runQueue(cohortRoot, { signal, concurrency: jobs }), {
    signal,
  });
}
async function runQueue(cohortRoot, { signal, concurrency }) {
  cohortRoot = await fs.realpath(cohortRoot);
  const lockPath = path.join(cohortRoot, '.controller.lock'),
    lock = await fs.open(lockPath, 'wx');
  try {
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + '\n',
    );
    const jobs = [];
    for (const entry of await fs.readdir(cohortRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(cohortRoot, entry.name, 'job.json');
      try {
        if ((await readJson(file)).state === 'queued') jobs.push(file);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (concurrency > 1) {
      let policy = COHORT_POLICY;
      try {
        const definition = await readJson(path.join(cohortRoot, 'cohort-definition.json'));
        policy = cohortPolicy(validateCohortDefinition(definition).policyId);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (concurrency > policy.simultaneousFilms)
        throw new Error(
          `This cohort permits ${policy.simultaneousFilms} simultaneous film(s). Prepare a new cohort with policy ${PARALLEL_POLICY.id} to run jobs in parallel.`,
        );
      if (jobs.length)
        assertDiskAdmission(
          await availableBytes(cohortRoot),
          policy,
          Math.min(concurrency, jobs.length),
        );
    }
    await runCohortPool(
      jobs.sort(),
      (file, context) =>
        withJobLock(file, async () =>
          runJob(await confined(cohortRoot, path.relative(cohortRoot, file)), context),
        ),
      { signal, concurrency },
    );
    return jobs.length;
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
}
