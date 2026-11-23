#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import {
  lstat,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual, promisify } from 'node:util';
import { MAX_CAPTION_CHARACTERS, MAX_CAPTION_SECONDS } from './lib/captions.mjs';
import { captionsForBeat, paragraphPolicy, teachingPolicy } from './lib/teaching-captions.mjs';
import { hashDeliveryFiles, withStagedDelivery } from './lib/delivery.mjs';
import { srt, vtt } from './lib/lesson.mjs';

const execute = promisify(execFileCallback);
const scriptFile = fileURLToPath(import.meta.url);
const videosRoot = dirname(scriptFile);
const repositoryRoot = resolve(videosRoot, '..');
const slugPattern = /^[a-z][a-z0-9-]*$/;
const shaPattern = /^[a-f0-9]{64}$/;
const auditFiles = ['text-ink-audit.json', 'motion-audit.json'];
const captionMarkup =
  /<p><strong>Caption cue:<\/strong>[\s\S]*?<\/p>|<p class="meta">No caption cue at this sample\.<\/p>/gu;

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value, previous) =>
  Buffer.from(
    JSON.stringify(value, null, 2) + (previous.toString('utf8').endsWith('\n') ? '\n' : ''),
  );

function inside(parent, child) {
  const path = relative(parent, child);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function assertSafeArtifactName(name) {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    isAbsolute(name) ||
    name.includes('\\') ||
    name.split('/').some((part) => !part || part === '.' || part === '..') ||
    name === 'verification.json'
  ) {
    throw new Error(`Unsafe receipt artifact path: ${String(name)}`);
  }
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label}: ${error.message}`, { cause: error });
  }
}

async function verifyArtifactMap(directory, hashes, label) {
  if (!hashes || typeof hashes !== 'object' || Array.isArray(hashes))
    throw new Error(`${label}: missing artifact checksum map`);
  const actual = await hashDeliveryFiles(directory);
  for (const [name, expected] of Object.entries(hashes)) {
    assertSafeArtifactName(name);
    if (!shaPattern.test(expected ?? '')) throw new Error(`${label}: invalid checksum for ${name}`);
    if (actual[name] !== expected)
      throw new Error(`${label}: artifact checksum mismatch for ${name}`);
  }
  return actual;
}

async function verifyEncodedReview(directory, receipt) {
  const reviewDirectory = join(directory, 'encoded-review');
  let info;
  try {
    info = await lstat(reviewDirectory);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error('encoded-review must be a regular directory');
  const reportPath = join(reviewDirectory, 'verification.json');
  let report;
  try {
    report = await readJson(reportPath, 'encoded-review/verification.json');
  } catch (error) {
    throw new Error(`Invalid encoded-review receipt: ${error.message}`, { cause: error });
  }
  if (report.videoSha256 !== receipt.sha256 || report.decodedFrameAudit?.passed !== true) {
    throw new Error('encoded-review is not bound to the verified lesson movie');
  }
  await verifyArtifactMap(reviewDirectory, report.artifactSha256, 'encoded-review');
}

function parseSampleTime(sample, timeline) {
  if (Number.isFinite(sample.localTime) && sample.scene && Array.isArray(timeline.scenes)) {
    let sceneIndex = Number.isInteger(sample.scene.index) ? sample.scene.index - 1 : -1;
    if (sceneIndex < 0 && typeof sample.scene.id === 'string') {
      sceneIndex = timeline.scenes.findIndex((scene) => scene.id === sample.scene.id);
    }
    const scene = timeline.scenes[sceneIndex];
    if (
      scene &&
      (!sample.scene.id || sample.scene.id === scene.id) &&
      Number.isFinite(scene.start)
    ) {
      return scene.start + sample.localTime;
    }
  }
  if (Number.isFinite(sample.absoluteTime)) return sample.absoluteTime;
  if (Number.isFinite(sample.time)) return sample.time;
  if (typeof sample.timestamp !== 'string')
    throw new Error('Frame gallery sample is missing its absolute timestamp');
  const match = sample.timestamp.match(/^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/u);
  if (!match) throw new Error(`Invalid frame gallery timestamp: ${sample.timestamp}`);
  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000
  );
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/gu,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

function refreshGalleryCaptions(gallery, html, captions, timeline) {
  if (!Array.isArray(gallery.samples)) throw new Error('Frame gallery has no samples array');
  for (const sample of gallery.samples) {
    const time = parseSampleTime(sample, timeline);
    const caption = captions.find((item) => time >= item.start && time < item.end) ?? null;
    sample.caption = caption
      ? { text: caption.text, start: caption.start, end: caption.end }
      : null;
  }
  let replacements = 0;
  const updatedHtml = html.replace(captionMarkup, () => {
    const sample = gallery.samples[replacements++];
    if (!sample)
      throw new Error('Frame gallery HTML has more caption rows than frame-gallery.json');
    return sample.caption
      ? `<p><strong>Caption cue:</strong> ${escapeHtml(sample.caption.text)}</p>`
      : '<p class="meta">No caption cue at this sample.</p>';
  });
  if (replacements !== gallery.samples.length) {
    throw new Error(
      `Frame gallery HTML has ${replacements} caption rows for ${gallery.samples.length} samples`,
    );
  }
  return updatedHtml;
}

function measuredCaptions(timeline, id, policy) {
  if (
    timeline.id !== id ||
    !Array.isArray(timeline.scenes) ||
    timeline.scenes.length === 0 ||
    !Number.isFinite(timeline.duration) ||
    timeline.duration <= 0
  ) {
    throw new Error(`${id}: missing or invalid measured timeline`);
  }
  const captions = [];
  let previousSceneStart = -Infinity;
  for (const [sceneIndex, scene] of timeline.scenes.entries()) {
    if (
      typeof scene.id !== 'string' ||
      !Array.isArray(scene.beats) ||
      scene.beats.length === 0 ||
      !Array.isArray(scene.sounds) ||
      scene.sounds.length !== scene.beats.length ||
      !Number.isFinite(scene.start) ||
      !Number.isFinite(scene.duration) ||
      scene.duration <= 0 ||
      scene.start < previousSceneStart ||
      scene.start + scene.duration > timeline.duration + 1e-6
    ) {
      throw new Error(`${id}: scene ${sceneIndex + 1} has incomplete measured speech or timing`);
    }
    previousSceneStart = scene.start;
    const generate = captionsForBeat(scene, policy);
    for (const [beatIndex, beat] of scene.beats.entries()) {
      const sound = scene.sounds[beatIndex];
      if (
        typeof beat.say !== 'string' ||
        !beat.say.trim() ||
        !Number.isFinite(beat.start) ||
        !Number.isFinite(beat.end) ||
        !Number.isFinite(beat.until) ||
        beat.start < 0 ||
        beat.end < beat.start ||
        beat.until < beat.end ||
        sound.sceneIndex !== sceneIndex ||
        sound.beatIndex !== beatIndex ||
        !Array.isArray(sound.words) ||
        sound.words.length === 0
      ) {
        throw new Error(
          `${id}/${scene.id}: beat ${beatIndex + 1} is missing its measured transcript`,
        );
      }
      const lastWord = sound.words.at(-1);
      if (
        !Number.isFinite(sound.duration) ||
        sound.duration <= 0 ||
        sound.words.some(
          (word) =>
            !Number.isFinite(word.start) ||
            !Number.isFinite(word.end) ||
            word.start < 0 ||
            word.end < word.start ||
            word.end > sound.duration + 0.05,
        ) ||
        lastWord.end > sound.duration + 0.05
      ) {
        throw new Error(
          `${id}/${scene.id}: beat ${beatIndex + 1} has invalid measured word boundaries`,
        );
      }
      try {
        const beatCaptions = generate(beat, beatIndex);
        if (
          beatCaptions.some(
            (caption) =>
              caption.text.length > MAX_CAPTION_CHARACTERS ||
              caption.end - caption.start > MAX_CAPTION_SECONDS,
          )
        ) {
          throw new Error(
            `a complete sentence exceeds the ${MAX_CAPTION_CHARACTERS}-character or ${MAX_CAPTION_SECONDS}-second caption limit`,
          );
        }
        captions.push(...beatCaptions);
      } catch (error) {
        throw new Error(`${id}/${scene.id}: beat ${beatIndex + 1}: ${error.message}`, {
          cause: error,
        });
      }
    }
  }
  if (
    !captions.length ||
    captions.some(
      (item) =>
        !Number.isFinite(item.start) ||
        !Number.isFinite(item.end) ||
        item.end <= item.start ||
        item.end > timeline.duration + 1e-6,
    )
  ) {
    throw new Error(`${id}: captions do not cover the measured narration`);
  }
  return captions;
}

/** Hash the CLI, caption grouping, and cue alignment sources used to generate captions. */
export async function getCaptionGeneratorSha256() {
  const sources = await Promise.all([
    readFile(scriptFile),
    readFile(join(videosRoot, 'lib/captions.mjs')),
    readFile(join(videosRoot, 'lib/teaching-captions.mjs')),
    readFile(join(videosRoot, 'lib/lesson.mjs')),
    readFile(join(videosRoot, 'lib/narration-cues.mjs')),
  ]);
  return digest(Buffer.concat(sources));
}

/** Return the receipt revision expected for a generated cue count. */
export async function getCaptionRevision(cues, policy = paragraphPolicy) {
  if (!Number.isInteger(cues) || cues < 1)
    throw new Error('Caption cue count must be a positive integer');
  return {
    version: 1,
    generatorSha256: await getCaptionGeneratorSha256(),
    policy,
    maximumCharacters: MAX_CAPTION_CHARACTERS,
    maximumSeconds: MAX_CAPTION_SECONDS,
    cues,
  };
}

async function buildPlan(inputRoot, id, generatorSha256) {
  if (!slugPattern.test(id ?? '')) throw new Error(`Invalid lesson ID: ${String(id)}`);
  const directory = resolve(inputRoot, id);
  if (!inside(inputRoot, directory)) throw new Error(`${id}: delivery path escaped input root`);
  const directoryInfo = await lstat(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink())
    throw new Error(`${id}: delivery must be a regular directory`);
  const receiptPath = join(directory, 'verification.json');
  const receiptBytes = await readFile(receiptPath);
  const receipt = JSON.parse(receiptBytes);
  if (
    receipt.id !== id ||
    receipt.fullDecode !== 'passed' ||
    receipt.frameAudit?.passed !== true ||
    !shaPattern.test(receipt.sha256 ?? '') ||
    !shaPattern.test(receipt.fingerprint ?? '') ||
    !Number.isFinite(receipt.duration) ||
    receipt.duration <= 0
  ) {
    throw new Error(`${id}: delivery is not a verified measured movie`);
  }
  const originalHashes = await verifyArtifactMap(
    directory,
    receipt.artifactSha256,
    `${id}/verification.json`,
  );
  if (originalHashes[`${id}.mp4`] !== receipt.sha256)
    throw new Error(`${id}: movie checksum differs from receipt`);
  if ((await stat(join(directory, `${id}.mp4`))).size !== receipt.bytes)
    throw new Error(`${id}: movie byte count differs from receipt`);
  await verifyEncodedReview(directory, receipt);

  const [timelineBytes, galleryBytes, htmlBytes, srtBytes, vttBytes] = await Promise.all([
    readFile(join(directory, 'timeline.json')),
    readFile(join(directory, 'frame-gallery.json')),
    readFile(join(directory, 'frame-gallery.html'), 'utf8'),
    readFile(join(directory, `${id}.srt`)),
    readFile(join(directory, `${id}.vtt`)),
  ]);
  if (digest(timelineBytes) !== receipt.artifactSha256?.['timeline.json'])
    throw new Error(`${id}: measured timeline checksum differs from receipt`);
  const timeline = JSON.parse(timelineBytes);
  const originalScenesBytes = JSON.stringify(timeline.scenes);
  let policy = timeline.captionPolicy;
  if (policy === undefined) {
    const manifest = originalHashes['source-manifest.json']
      ? JSON.parse(await readFile(join(directory, 'source-manifest.json'), 'utf8'))
      : {};
    policy =
      manifest.mode === 'stage' && manifest.lessonFile === `videos/stage-lessons/${id}/lesson.yaml`
        ? teachingPolicy
        : paragraphPolicy;
  }
  const captions = measuredCaptions(timeline, id, policy);
  const gallery = JSON.parse(galleryBytes);
  if (gallery.lesson !== id) throw new Error(`${id}: frame gallery belongs to another lesson`);
  const galleryHtml = refreshGalleryCaptions(gallery, htmlBytes, captions, timeline);
  const timelineOutput = { ...timeline, captions };
  const revision = {
    version: 1,
    generatorSha256,
    policy,
    maximumCharacters: MAX_CAPTION_CHARACTERS,
    maximumSeconds: MAX_CAPTION_SECONDS,
    cues: captions.length,
  };
  const outputs = new Map([
    ['timeline.json', jsonBytes(timelineOutput, timelineBytes)],
    [`${id}.srt`, Buffer.from(srt(captions))],
    [`${id}.vtt`, Buffer.from(vtt(captions))],
    ['frame-gallery.json', jsonBytes(gallery, galleryBytes)],
    ['frame-gallery.html', Buffer.from(galleryHtml)],
  ]);
  const updatedArtifactHashes = { ...receipt.artifactSha256 };
  const changed = [];
  for (const [name, bytes] of outputs) {
    if (!Object.hasOwn(receipt.artifactSha256, name))
      throw new Error(`${id}: receipt does not bind ${name}`);
    const next = digest(bytes);
    if (originalHashes[name] !== next) changed.push(name);
    updatedArtifactHashes[name] = next;
  }
  const updatedReceipt = {
    ...receipt,
    artifactSha256: updatedArtifactHashes,
    captionRevision: revision,
  };
  const receiptOutput = jsonBytes(updatedReceipt, receiptBytes);
  const revisionMatches =
    JSON.stringify(receipt.captionRevision ?? null) === JSON.stringify(revision);
  const galleryCaptionsMatch = (() => {
    const before = JSON.parse(galleryBytes);
    return (
      JSON.stringify(before.samples?.map((sample) => sample.caption ?? null)) ===
      JSON.stringify(gallery.samples.map((sample) => sample.caption))
    );
  })();
  const upToDate =
    changed.length === 0 &&
    revisionMatches &&
    galleryCaptionsMatch &&
    digest(await readFile(join(directory, `${id}.srt`))) === digest(outputs.get(`${id}.srt`)) &&
    digest(await readFile(join(directory, `${id}.vtt`))) === digest(outputs.get(`${id}.vtt`)) &&
    digest(await readFile(join(directory, 'frame-gallery.html'))) ===
      digest(outputs.get('frame-gallery.html')) &&
    digest(await readFile(receiptPath)) === digest(receiptOutput);
  return {
    id,
    directory,
    receiptPath,
    receipt,
    receiptBytes,
    receiptHash: digest(receiptBytes),
    timeline,
    originalScenesBytes,
    timelineHash: digest(timelineBytes),
    originalHashes,
    outputs,
    updatedReceipt,
    receiptOutput,
    revision,
    captions,
    changed,
    upToDate,
  };
}

async function atomicWrite(path, bytes) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function cloneHardlinks(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name),
      destinationPath = join(destination, entry.name);
    const info = await lstat(sourcePath);
    if (info.isSymbolicLink()) throw new Error(`Delivery contains a symbolic link: ${sourcePath}`);
    if (info.isDirectory()) {
      await mkdir(destinationPath);
      await cloneHardlinks(sourcePath, destinationPath);
    } else if (info.isFile()) await link(sourcePath, destinationPath);
    else throw new Error(`Delivery contains a non-regular entry: ${sourcePath}`);
  }
}

async function runAudit(script, id, auditRoot, expected, reportName) {
  const executable = join(videosRoot, script);
  try {
    await execute(
      process.execPath,
      [
        executable,
        '--lesson',
        id,
        '--input',
        auditRoot,
        ...(script === 'audit-text-ink.mjs' ? ['--actual'] : []),
      ],
      {
        cwd: repositoryRoot,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${id}: ${script} failed${output ? `: ${output}` : `: ${error.message}`}`, {
      cause: error,
    });
  }
  const report = await readJson(join(expected.stage, reportName), `${id}/${reportName}`);
  if (
    report.passed !== true ||
    report.videoSha256 !== expected.movieHash ||
    report.timelineSha256 !== expected.timelineHash ||
    report.receiptSha256 !== expected.receiptHash
  ) {
    throw new Error(`${id}: ${reportName} does not bind the regenerated measured delivery`);
  }
}

// A stage film has no painter labels, and film-check.json binds its movie and sources instead.
const paintsLabels = (receipt) => receipt.videoEngine !== 'vizmatic.stage.renderFilmVideo';

async function refreshStageAudits(stage, id, expected) {
  for (const name of auditFiles) await rm(join(stage, name), { force: true });
  const auditRoot = await mkdtemp(join(dirname(stage), `.caption-audit-${id}-`));
  try {
    await symlink(stage, join(auditRoot, id), 'dir');
    await runAudit('audit-text-ink.mjs', id, auditRoot, expected, auditFiles[0]);
    await runAudit('audit-motion.mjs', id, auditRoot, expected, auditFiles[1]);
  } finally {
    await rm(auditRoot, { recursive: true, force: true });
  }
}

async function auditsCurrent(plan) {
  if (!paintsLabels(plan.receipt)) return true;
  const expected = [
    ['text-ink-audit.json', ['audit-text-ink.mjs', 'lib/text-ink-audit.mjs']],
    ['motion-audit.json', ['audit-motion.mjs', 'lib/motion-audit.mjs']],
  ];
  for (const [reportName, toolFiles] of expected) {
    let report;
    try {
      report = await readJson(join(plan.directory, reportName), reportName);
    } catch (error) {
      if (error.cause?.code === 'ENOENT') return false;
      throw error;
    }
    const toolHash = digest(
      Buffer.concat(await Promise.all(toolFiles.map((file) => readFile(join(videosRoot, file))))),
    );
    if (
      report.passed !== true ||
      report.id !== plan.id ||
      report.videoSha256 !== plan.receipt.sha256 ||
      report.timelineSha256 !== plan.timelineHash ||
      report.receiptSha256 !== plan.receiptHash ||
      report.sourceFingerprint !== plan.receipt.fingerprint ||
      report.toolSha256 !== toolHash
    )
      return false;
  }
  return true;
}

async function verifyStaged(plan, stage, refreshAudits) {
  const stageReceiptBytes = await readFile(join(stage, 'verification.json'));
  const stageReceipt = JSON.parse(stageReceiptBytes);
  if (
    stageReceipt.id !== plan.id ||
    stageReceipt.sha256 !== plan.receipt.sha256 ||
    stageReceipt.fingerprint !== plan.receipt.fingerprint ||
    digest(await readFile(join(stage, `${plan.id}.mp4`))) !== plan.receipt.sha256
  ) {
    throw new Error(`${plan.id}: caption staging changed movie bytes or render fingerprint`);
  }
  const stageTimelineBytes = await readFile(join(stage, 'timeline.json'));
  const stageTimeline = JSON.parse(stageTimelineBytes);
  if (JSON.stringify(stageTimeline.scenes) !== plan.originalScenesBytes) {
    throw new Error(`${plan.id}: caption staging changed measured scene timings`);
  }
  if (digest(stageTimelineBytes) !== stageReceipt.artifactSha256['timeline.json']) {
    throw new Error(`${plan.id}: staged timeline checksum differs from receipt`);
  }
  const actual = await hashDeliveryFiles(stage);
  const allowed = new Set([...plan.outputs.keys(), ...(refreshAudits ? auditFiles : [])]);
  const previousNames = new Set(Object.keys(plan.originalHashes));
  const currentNames = new Set(Object.keys(actual));
  for (const name of previousNames)
    if (!currentNames.has(name))
      throw new Error(`${plan.id}: staging dropped delivery evidence ${name}`);
  for (const name of currentNames)
    if (!previousNames.has(name) && !allowed.has(name))
      throw new Error(`${plan.id}: staging added unreviewed artifact ${name}`);
  for (const name of previousNames) {
    if (!allowed.has(name) && actual[name] !== plan.originalHashes[name]) {
      throw new Error(`${plan.id}: staging changed unrelated evidence ${name}`);
    }
  }
  for (const [name, expected] of Object.entries(stageReceipt.artifactSha256)) {
    if (actual[name] !== expected)
      throw new Error(`${plan.id}: staged artifact checksum mismatch for ${name}`);
  }
  if (JSON.stringify(stageReceipt.captionRevision) !== JSON.stringify(plan.revision)) {
    throw new Error(`${plan.id}: staged caption revision differs from generator`);
  }
}

async function applyPlan(plan, { refreshAudits = false } = {}) {
  const { id } = plan;
  if (plan.upToDate) {
    const currentAudits = await auditsCurrent(plan);
    if (!refreshAudits || currentAudits) {
      return {
        id,
        cues: plan.captions.length,
        changed: [],
        upToDate: true,
        auditsRefreshed: false,
        auditsNeedRefresh: !currentAudits,
      };
    }
  }
  await withStagedDelivery(plan.directory, async (stage) => {
    await assertCaptionGeneratorCurrent(plan);
    // The per-lesson lock is held before this second snapshot check, closing the plan/publish race.
    const currentReceipt = await readFile(plan.receiptPath);
    if (digest(currentReceipt) !== plan.receiptHash)
      throw new Error(`${id}: delivery receipt changed during caption planning`);
    const currentHashes = await hashDeliveryFiles(plan.directory);
    if (JSON.stringify(currentHashes) !== JSON.stringify(plan.originalHashes)) {
      const names = new Set([...Object.keys(currentHashes), ...Object.keys(plan.originalHashes)]);
      const changed = [...names].filter(
        (name) => currentHashes[name] !== plan.originalHashes[name],
      );
      throw new Error(
        `${id}: delivery changed during caption planning (${changed.slice(0, 4).join(', ')})`,
      );
    }
    await cloneHardlinks(plan.directory, stage);
    for (const [name, bytes] of plan.outputs) await atomicWrite(join(stage, name), bytes);
    await atomicWrite(join(stage, 'verification.json'), plan.receiptOutput);
    if (refreshAudits && paintsLabels(plan.receipt)) {
      await refreshStageAudits(stage, id, {
        stage,
        movieHash: plan.receipt.sha256,
        timelineHash: digest(plan.outputs.get('timeline.json')),
        receiptHash: digest(plan.receiptOutput),
      });
    }
    await verifyStaged(plan, stage, refreshAudits);
    await assertCaptionGeneratorCurrent(plan);
  });
  return {
    id,
    cues: plan.captions.length,
    changed: plan.changed,
    upToDate: plan.changed.length === 0 && plan.upToDate,
    auditsRefreshed: refreshAudits,
    auditsNeedRefresh: !refreshAudits,
  };
}

async function assertCaptionGeneratorCurrent(plan) {
  const current = await getCaptionGeneratorSha256();
  if (current !== plan.revision.generatorSha256) {
    throw new Error(`${plan.id}: caption generator source changed during regeneration`);
  }
}

/** Regenerate one verified delivery. The returned result is safe to summarize in a collection manifest. */
export async function regenerateLessonCaptions({
  input,
  id,
  check = false,
  refreshAudits = false,
  generatorSha256,
} = {}) {
  if (!input) throw new Error('--input ROOT is required');
  if (check && refreshAudits) throw new Error('--check cannot be combined with --refresh-audits');
  const inputRoot = resolve(input);
  const rootInfo = await lstat(inputRoot);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink())
    throw new Error(`Input root must be a regular directory: ${inputRoot}`);
  const generatorHash = generatorSha256 ?? (await getCaptionGeneratorSha256());
  if (!shaPattern.test(generatorHash)) throw new Error('Invalid caption generator SHA-256');
  const plan = await buildPlan(inputRoot, id, generatorHash);
  if (check) {
    if (!plan.upToDate) throw new Error(`${id}: caption artifacts are not current`);
    return { id, cues: plan.captions.length, changed: [], upToDate: true, auditsRefreshed: false };
  }
  return applyPlan(plan, { refreshAudits });
}

function parseArgs(args) {
  const options = {
    input: resolve(repositoryRoot, 'build/videos'),
    lessonIds: [],
    jobs: 4,
    all: false,
    check: false,
    refreshAudits: false,
  };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--input') {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error('--input requires a value');
      options.input = args[++index];
    } else if (argument === '--lesson') {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error('--lesson requires an ID');
      options.lessonIds.push(args[++index]);
    } else if (argument === '--lessons') {
      let count = 0;
      while (args[index + 1] && !args[index + 1].startsWith('--')) {
        options.lessonIds.push(
          ...args[++index]
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        );
        count++;
      }
      if (!count) throw new Error('--lessons requires one or more IDs');
    } else if (argument === '--jobs') {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error('--jobs requires a value');
      options.jobs = Number(args[++index]);
    } else if (argument === '--all') options.all = true;
    else if (argument === '--check') options.check = true;
    else if (argument === '--refresh-audits') options.refreshAudits = true;
    else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  if (!options.help && !options.input) throw new Error('Use --input ROOT');
  if (!options.help && !options.all && options.lessonIds.length === 0)
    throw new Error('Use --lesson ID, --lessons IDs, or --all');
  if (options.all && options.lessonIds.length)
    throw new Error('--all cannot be combined with --lesson or --lessons');
  if (!Number.isInteger(options.jobs) || options.jobs < 1 || options.jobs > 16)
    throw new Error('--jobs must be 1..16');
  if (options.check && options.refreshAudits)
    throw new Error('--check cannot be combined with --refresh-audits');
  if (new Set(options.lessonIds).size !== options.lessonIds.length)
    throw new Error('Lesson IDs must be unique');
  for (const id of options.lessonIds)
    if (!slugPattern.test(id)) throw new Error(`Invalid lesson ID: ${id}`);
  return options;
}

async function chooseLessons(options) {
  const root = resolve(options.input);
  if (!options.all) return options.lessonIds;
  const ids = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !slugPattern.test(entry.name)) continue;
    try {
      const receiptInfo = await lstat(join(root, entry.name, 'verification.json'));
      if (receiptInfo.isFile()) ids.push(entry.name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!ids.length) throw new Error(`No verified lesson deliveries found in ${root}`);
  return ids.sort();
}

async function mapConcurrent(values, concurrency, callback) {
  const result = new Array(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (true) {
        const index = cursor++;
        if (index >= values.length) return;
        result[index] = await callback(values[index]);
      }
    }),
  );
  return result;
}

async function readManifestSnapshot(inputRoot, selectedIds) {
  const path = join(inputRoot, 'manifest.json');
  let bytes = null;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error(`Collection manifest must be a regular file: ${path}`);
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const rows = bytes ? JSON.parse(bytes) : [];
  if (
    !Array.isArray(rows) ||
    rows.some(
      (row) => !row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string',
    )
  ) {
    throw new Error(`Invalid collection manifest: ${path}`);
  }
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id))
      throw new Error(`Collection manifest contains duplicate lesson ${row.id}`);
    seen.add(row.id);
  }
  for (const id of selectedIds) {
    const matches = rows.filter((row) => row.id === id);
    if (matches.length > 1) throw new Error(`Collection manifest contains duplicate lesson ${id}`);
  }
  return { path, bytes, rows };
}

function validateManifestRows(snapshot, plans) {
  if (!snapshot.bytes) return;
  const rows = new Map(snapshot.rows.map((row) => [row.id, row]));
  for (const plan of plans) {
    const row = rows.get(plan.id);
    if (row && !isDeepStrictEqual(row, plan.receipt)) {
      throw new Error(`${plan.id}: collection manifest receipt is stale`);
    }
  }
}

async function updateManifest(inputRoot, snapshot, selectedIds) {
  const currentBytes = await readFile(snapshot.path).catch((error) => {
    if (error.code === 'ENOENT' && !snapshot.bytes) return null;
    throw error;
  });
  if ((currentBytes && digest(currentBytes)) !== (snapshot.bytes && digest(snapshot.bytes))) {
    throw new Error('Collection manifest changed while captions were being regenerated');
  }
  const selected = new Set(selectedIds);
  const receipts = new Map();
  for (const id of selectedIds) {
    const receipt = await readJson(
      join(inputRoot, id, 'verification.json'),
      `${id}/verification.json`,
    );
    if (
      receipt.id !== id ||
      !receipt.captionRevision ||
      !shaPattern.test(receipt.captionRevision.generatorSha256 ?? '')
    ) {
      throw new Error(`${id}: regenerated receipt is missing its caption revision`);
    }
    receipts.set(id, receipt);
  }
  const remaining = new Set(selected);
  const rows = snapshot.rows.map((row) => {
    if (!selected.has(row.id)) return row;
    remaining.delete(row.id);
    return receipts.get(row.id);
  });
  for (const id of selectedIds) if (remaining.has(id)) rows.push(receipts.get(id));
  const previous = snapshot.bytes ?? Buffer.from('[]');
  const output = jsonBytes(rows, previous);
  if (!snapshot.bytes || !output.equals(snapshot.bytes)) await atomicWrite(snapshot.path, output);
  return rows.length;
}

export async function runCaptionCli(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(
      'node videos/regenerate-captions.mjs [--input ROOT (default build/videos)] (--lesson ID ... | --lessons ID[,ID] ... | --all) [--jobs 4] [--check | --refresh-audits]',
    );
    return;
  }
  const ids = await chooseLessons(options);
  const generatorSha256 = await getCaptionGeneratorSha256();
  const manifest = await readManifestSnapshot(resolve(options.input), ids);
  // Validate every selected source before the first delivery can be published.
  const plans = [];
  for (const id of ids) plans.push(await buildPlan(resolve(options.input), id, generatorSha256));
  if (options.check) {
    const stale = plans.filter((plan) => !plan.upToDate).map((plan) => plan.id);
    if (stale.length) throw new Error(`Captions are not current for ${stale.join(', ')}`);
    validateManifestRows(manifest, plans);
    console.log(
      `Captions current: ${plans.length} lessons, ${plans.reduce((sum, plan) => sum + plan.captions.length, 0)} cues`,
    );
    return;
  }
  const results = await mapConcurrent(plans, options.jobs, (plan) =>
    applyPlan(plan, { refreshAudits: options.refreshAudits }),
  );
  await updateManifest(resolve(options.input), manifest, ids);
  for (const result of results) {
    console.log(
      `${result.id}: ${result.upToDate ? 'current' : `updated ${result.changed.length} artifacts`}, ${result.cues} cues${result.auditsRefreshed ? ', audits refreshed' : result.auditsNeedRefresh ? ', audits need refresh' : ''}`,
    );
  }
  console.log(
    `Caption regeneration complete: ${results.length} lessons, ${results.reduce((sum, result) => sum + result.cues, 0)} cues`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCaptionCli().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
