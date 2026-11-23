#!/usr/bin/env node
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLesson } from './lib/lesson.mjs';
import { regenerateLessonCaptions } from './regenerate-captions.mjs';
import {
  MOTION_SAMPLE_PROGRESS,
  MOTION_CHANNEL_DELTA,
  MOTION_MINIMUM_PIXELS,
  MOTION_SCOPE,
  validateMotionTimeline,
  validateMotionReceipt,
} from './lib/motion-audit.mjs';
import { textInkSampleFrames } from './audit-text-ink.mjs';
import {
  assertFreezeMatches,
  assertInside,
  discoverFiles,
  freezeFiles,
  hashFileStream,
  inspectReportIsComplete,
  runBoundedQueue,
  runReviewQueue,
  runWithTruncatedSpeechRecovery,
  runtimeSnapshot,
  validateCollection,
  validateOutputPath,
} from './lib/batch.mjs';

const videosRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(videosRoot, '..');
const slug = /^[a-z][a-z0-9-]*$/;
const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};

export function parseBatchArgs(args) {
  const options = {
    jobs: 2,
    threads: 2,
    resume: false,
    prepareOnly: false,
    validateOnly: false,
    noPackage: false,
    keepGoing: false,
    help: false,
  };
  const valueOptions = new Map([
    ['--collection', 'collection'],
    ['--output', 'output'],
    ['--jobs', 'jobs'],
    ['--threads', 'threads'],
  ]);
  for (let i = 0; i < args.length; i++) {
    const [flag, inline] = args[i].split(/=(.*)/s, 2);
    if (flag === '--help' || flag === '-h') {
      options.help = true;
      continue;
    }
    if (flag === '--resume') {
      options.resume = true;
      continue;
    }
    if (flag === '--prepare-only') {
      options.prepareOnly = true;
      continue;
    }
    if (flag === '--validate-only') {
      options.validateOnly = true;
      continue;
    }
    if (flag === '--no-package') {
      options.noPackage = true;
      continue;
    }
    if (flag === '--keep-going') {
      options.keepGoing = true;
      continue;
    }
    const name = valueOptions.get(flag);
    if (!name) throw new Error(`Unknown option: ${flag}`);
    const value = inline ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
    if (name === 'jobs' || name === 'threads') {
      const number = Number(value);
      if (!Number.isInteger(number) || number < 1 || number > 16)
        throw new Error(`${flag} must be an integer from 1 to 16`);
      options[name] = number;
    } else options[name] = value;
  }
  if (!options.help && !options.collection) throw new Error('--collection is required');
  if (options.prepareOnly && options.validateOnly)
    throw new Error('--prepare-only and --validate-only cannot be combined');
  return options;
}

export function orderReceipts(ids, receipts) {
  if (!Array.isArray(ids) || !Array.isArray(receipts))
    throw new TypeError('Receipt ordering requires arrays');
  const byId = new Map();
  for (const receipt of receipts) {
    if (!receipt?.id || byId.has(receipt.id))
      throw new Error(`Duplicate or missing receipt ID: ${receipt?.id ?? '(empty)'}`);
    byId.set(receipt.id, receipt);
  }
  const ordered = ids.map((id) => {
    const receipt = byId.get(id);
    if (!receipt) throw new Error(`Missing verified receipt: ${id}`);
    return receipt;
  });
  if (byId.size !== ids.length) throw new Error('Receipt count does not match collection size');
  return ordered;
}

function help() {
  return 'node videos/batch.mjs --collection visual-curriculum [--output build/video-curriculum] [--jobs 2] [--threads 2] [--prepare-only] [--resume] [--no-package] [--keep-going] [--validate-only]';
}

function collectionPath(value) {
  const hasPath = value.includes('/') || value.includes('\\') || value.startsWith('.');
  const candidate = hasPath
    ? resolve(repositoryRoot, value)
    : resolve(videosRoot, 'collections', value.endsWith('.json') ? value : `${value}.json`);
  if (!assertInside(repositoryRoot, candidate))
    throw new Error('Collection manifest must be inside the repository');
  return candidate;
}

async function loadCollection(value) {
  const file = collectionPath(value);
  let raw;
  try {
    raw = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read collection ${file}: ${error.message}`, { cause: error });
  }
  const collection = validateCollection(raw);
  if (extname(file) !== '.json') throw new Error(`Collection manifest must be JSON: ${file}`);
  return { file, collection };
}

async function validateInputs(collection) {
  const lessonDirectory = join(videosRoot, 'lessons');
  const names = await readdir(lessonDirectory);
  const knownIds = new Set(
    names
      .filter((name) => name.endsWith('.lesson.yaml'))
      .map((name) => name.slice(0, -'.lesson.yaml'.length)),
  );
  validateCollection(collection, { knownIds });
  const validated = [];
  for (const entry of collection.lessons) {
    const lessonFile = join(lessonDirectory, `${entry.id}.lesson.yaml`);
    const animationFile = join(videosRoot, 'animations', `${entry.id}.mjs`);
    if (!(await isFile(animationFile)))
      throw new Error(`${entry.id}: missing animation ${relative(repositoryRoot, animationFile)}`);
    const lesson = await readLesson(lessonFile, repositoryRoot);
    if (lesson.id !== entry.id)
      throw new Error(`${entry.id}: lesson ID does not match its filename`);
    if (lesson.source !== entry.source)
      throw new Error(
        `${entry.id}: collection source differs from lesson markup (${entry.source} != ${lesson.source})`,
      );
    if (lesson.title !== entry.title)
      throw new Error(
        `${entry.id}: collection title differs from lesson markup (${entry.title} != ${lesson.title})`,
      );
    const moduleUrl = `${pathToFileURL(animationFile).href}?batch-validate=${encodeURIComponent(entry.id)}`;
    const animation = await import(moduleUrl);
    if (typeof animation.draw !== 'function')
      throw new Error(`${entry.id}: animation must export draw(ctx, scene, state, api)`);
    if (typeof animation.validateModel !== 'function')
      throw new Error(`${entry.id}: animation must export validateModel()`);
    await animation.validateModel();
    validated.push({ ...entry, lessonFile, animationFile });
  }
  return validated;
}

async function sourcePaths(collectionFile, lessons) {
  const required = [
    'videos/batch.mjs',
    'videos/lib/batch.mjs',
    'videos/render.mjs',
    'videos/audit-occlusion.mjs',
    'videos/inspect.mjs',
    'videos/audit-text-ink.mjs',
    'videos/audit-motion.mjs',
    'videos/catalog.mjs',
    'videos/package.py',
    JSON.parse(await readFile(join(repositoryRoot, 'videos/narration.json'), 'utf8')).ttsScript,
    'videos/narration.json',
    'videos/soundbed.json',
    'videos/collections/complete-curriculum.json',
    'videos/regenerate-captions.mjs',
    'videos/package.json',
    'videos/package-lock.json',
    'videos/.npmrc',
    'videos/check-npm-release-age.mjs',
    'videos/assets/leetllm-mark.svg',
  ];
  const relativeToRepo = (path) => relative(repositoryRoot, path).split(sep).join('/');
  required.push(relativeToRepo(collectionFile));
  for (const lesson of lessons) {
    required.push(relativeToRepo(lesson.lessonFile), relativeToRepo(lesson.animationFile));
    required.push(`web/src/content/${lesson.source}`);
  }
  for (const path of await discoverFiles(join(videosRoot, 'lib'), { extensions: ['.mjs'] }))
    required.push(relativeToRepo(path));
  for (const path of await discoverFiles(join(videosRoot, 'assets/concepts')))
    required.push(relativeToRepo(path));
  return [...new Set(required)];
}

async function makeFreeze(collectionFile, lessons, runtime = runtimeSnapshot()) {
  const paths = await sourcePaths(collectionFile, lessons);
  return { freeze: await freezeFiles(repositoryRoot, paths, runtime), paths, runtime };
}

async function assertFrozen(context) {
  const paths = await sourcePaths(context.collectionFile, context.lessons);
  await assertFreezeMatches(repositoryRoot, context.freeze, paths, runtimeSnapshot());
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, path);
}

function blankReceipt(collection, options, freeze) {
  const phases = options.validateOnly
    ? ['renderValidate', 'occlusionValidate']
    : options.prepareOnly
      ? ['audio']
      : ['intro', 'audio', 'render', 'occlusion', 'inspection', 'package'];
  return {
    version: 1,
    collection: { id: collection.id, title: collection.title },
    mode: options.validateOnly ? 'validate-only' : options.prepareOnly ? 'prepare-only' : 'render',
    status: 'running',
    sourceFreeze: freeze,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lessons: collection.lessons.map((lesson) => ({
      id: lesson.id,
      phases: Object.fromEntries(
        phases
          .filter((phase) => phase !== 'intro' && phase !== 'package')
          .map((phase) => [phase, { status: 'pending' }]),
      ),
    })),
    phases: Object.fromEntries(
      phases
        .filter((phase) => phase === 'intro' || phase === 'package')
        .map((phase) => [phase, { status: 'pending' }]),
    ),
  };
}

function modeFor(options) {
  return options.validateOnly ? 'validate-only' : options.prepareOnly ? 'prepare-only' : 'render';
}

const modeRank = { 'validate-only': 0, 'prepare-only': 1, render: 2 };

export function promoteReceipt(previous, collection, options, freeze) {
  const ids = collection.lessons.map((lesson) => lesson.id);
  if (
    previous.version !== 1 ||
    previous.collection?.id !== collection.id ||
    JSON.stringify(previous.lessons?.map((item) => item.id)) !== JSON.stringify(ids)
  ) {
    throw new Error('Resume receipt does not match the selected collection and lesson order');
  }
  if (previous.sourceFreeze?.sha256 !== freeze.sha256) {
    throw new Error(
      'Source freeze differs from the saved receipt; rerun without --resume to create a fresh receipt',
    );
  }
  const targetMode = modeFor(options);
  if (previous.mode === targetMode) {
    previous.status = 'running';
    previous.updatedAt = new Date().toISOString();
    return previous;
  }
  if (!(previous.mode in modeRank) || modeRank[previous.mode] > modeRank[targetMode]) {
    throw new Error(`Cannot resume ${previous.mode} work as ${targetMode}`);
  }
  const promoted = blankReceipt(collection, options, freeze);
  promoted.promotedFrom = {
    mode: previous.mode,
    status: previous.status,
    completedAt: previous.completedAt ?? null,
  };
  if (previous.mode === 'prepare-only' && targetMode === 'render') {
    for (const lesson of promoted.lessons) {
      const prior = previous.lessons.find((item) => item.id === lesson.id)?.phases?.audio;
      if (prior?.status === 'complete' && prior.evidence) lesson.phases.audio = prior;
    }
  }
  return promoted;
}

async function createReceipt(output, collection, options, freeze) {
  const path = join(output, 'batch-receipt.json');
  if (!options.resume) return { path, receipt: blankReceipt(collection, options, freeze) };
  let previous;
  try {
    previous = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot resume without ${path}: ${error.message}`, { cause: error });
  }
  if (
    previous.version !== 1 ||
    previous.collection?.id !== collection.id ||
    JSON.stringify(previous.lessons?.map((item) => item.id)) !==
      JSON.stringify(collection.lessons.map((item) => item.id))
  ) {
    throw new Error('Resume receipt does not match the selected collection and lesson order');
  }
  return { path, receipt: promoteReceipt(previous, collection, options, freeze) };
}

function phase(receipt, id, name) {
  const record = id ? receipt.lessons.find((lesson) => lesson.id === id) : receipt;
  const item = id ? record?.phases?.[name] : record?.phases?.[name];
  if (!item) throw new Error(`Missing batch phase: ${id ?? 'collection'}/${name}`);
  return item;
}

function makePersister(path, receipt) {
  let queue = Promise.resolve();
  return () => {
    receipt.updatedAt = new Date().toISOString();
    const snapshot = `${JSON.stringify(receipt, null, 2)}\n`;
    queue = queue.then(async () => {
      await mkdir(dirname(path), { recursive: true });
      const temporary = `${path}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
      await writeFile(temporary, snapshot);
      await rename(temporary, path);
    });
    return queue;
  };
}

function safeFile(folder, name) {
  if (typeof name !== 'string' || name.startsWith('/') || name.split(/[\\/]/).includes('..'))
    throw new Error(`Unsafe delivery path: ${name}`);
  const path = resolve(folder, name);
  if (!assertInside(folder, path)) throw new Error(`Delivery path escaped lesson folder: ${name}`);
  return path;
}

async function hashFile(path) {
  if (!(await isFile(path))) throw new Error(`Missing output file: ${path}`);
  return hashFileStream(path);
}

async function verifyArtifactMap(folder, hashes) {
  if (!hashes || typeof hashes !== 'object' || Array.isArray(hashes))
    throw new Error(`Missing artifact checksum map: ${folder}`);
  for (const [name, expected] of Object.entries(hashes)) {
    if ((await hashFile(safeFile(folder, name))) !== expected)
      throw new Error(`Artifact checksum mismatch: ${folder}/${name}`);
  }
  return hashes;
}

async function audioEvidence(output, id) {
  const folder = join(output, 'previews', id);
  let timeline;
  try {
    timeline = JSON.parse(await readFile(join(folder, 'timeline.json'), 'utf8'));
  } catch {
    return null;
  }
  if (timeline.id !== id || !Array.isArray(timeline.scenes) || !timeline.scenes.length) return null;
  const sounds = timeline.scenes.flatMap((scene) => scene.sounds ?? []);
  if (!sounds.length) return null;
  const cache = resolve(output, '.audio-cache');
  const soundHashes = [];
  for (const sound of sounds) {
    const audio = resolve(sound.audio ?? ''),
      boundaries = resolve(sound.boundaries ?? '');
    if (!assertInside(cache, audio) || !assertInside(cache, boundaries)) return null;
    const actualAudio = await hashFile(audio),
      actualBoundaries = await hashFile(boundaries);
    if (actualAudio !== sound.audioHash || actualBoundaries !== sound.boundariesHash) return null;
    soundHashes.push({ key: sound.key, audio: actualAudio, boundaries: actualBoundaries });
  }
  const files = {};
  for (const name of [
    `${id}.srt`,
    `${id}.vtt`,
    `${id}.script.md`,
    `${id}.chapters.txt`,
    'timeline.json',
  ])
    files[name] = await hashFile(join(folder, name));
  return { timeline: files['timeline.json'], files, sounds: soundHashes };
}

async function introEvidence(output) {
  const folder = join(output, 'brand'),
    movie = join(folder, 'leetllm-intro.mp4');
  if (!(await isFile(movie))) return null;
  return { movie: await hashFile(movie) };
}

async function renderEvidence(output, id) {
  const folder = join(output, id);
  let receipt;
  try {
    receipt = JSON.parse(await readFile(join(folder, 'verification.json'), 'utf8'));
  } catch {
    return null;
  }
  if (
    receipt.id !== id ||
    receipt.fullDecode !== 'passed' ||
    receipt.frameAudit?.passed !== true ||
    receipt.videoEngine !== 'vizmatic.renderRgbaVideo'
  )
    return null;
  if ((await hashFile(join(folder, `${id}.mp4`))) !== receipt.sha256) return null;
  await verifyArtifactMap(folder, receipt.artifactSha256);
  return {
    id,
    video: receipt.sha256,
    fingerprint: receipt.fingerprint,
    frames: receipt.frameAudit.frames,
    receiptSha256: await hashFile(join(folder, 'verification.json')),
  };
}

async function occlusionEvidence(output, id) {
  const folder = join(output, id);
  let report;
  try {
    report = JSON.parse(await readFile(join(folder, 'aggregate-occlusion.json'), 'utf8'));
  } catch {
    return null;
  }
  const video = JSON.parse(await readFile(join(folder, 'verification.json'), 'utf8'));
  if (
    report.mode !== 'all-frames' ||
    report.passed !== true ||
    report.issueFrames !== 0 ||
    report.videoSha256 !== video.sha256 ||
    report.frames !== video.frameAudit?.frames ||
    report.expectedFrames !== video.frameAudit?.frames
  )
    return null;
  return {
    report: await hashFile(join(folder, 'aggregate-occlusion.json')),
    frames: report.frames,
    video: report.videoSha256,
  };
}

function textInkCoverageIsComplete(report, receipt, timeline) {
  const [fpsNumerator, fpsDenominator = 1] = String(receipt.fps).split('/').map(Number);
  const receiptFps = fpsNumerator / fpsDenominator;
  if (
    report.version !== 1 ||
    report.id !== receipt.id ||
    !['sampled-final', 'all-frames'].includes(report.mode) ||
    report.timingSource !== 'measured-final' ||
    report.passed !== true ||
    report.issueFrames !== 0 ||
    !Array.isArray(report.issues) ||
    report.issues.length !== 0 ||
    !Array.isArray(report.scenes) ||
    !Array.isArray(timeline.scenes) ||
    report.width !== receipt.width ||
    report.height !== receipt.height ||
    report.width !== timeline.width ||
    report.height !== timeline.height ||
    report.fps !== timeline.fps ||
    report.fps !== receiptFps ||
    !Number.isInteger(timeline.fps) ||
    timeline.fps <= 0 ||
    timeline.fps > 60
  )
    return false;
  const timings = [...(timeline.intro ? [timeline.intro] : []), ...timeline.scenes];
  if (!timings.length || report.scenes.length !== timings.length) return false;
  let checkedFrames = 0,
    totalFrames = 0,
    checkedLabels = 0,
    skippedLabels = 0;
  for (const [index, timing] of timings.entries()) {
    const scene = report.scenes[index];
    if (
      !Number.isInteger(timing.frames) ||
      timing.frames <= 0 ||
      !Number.isFinite(timing.duration) ||
      timing.duration <= 0 ||
      Math.abs(timing.frames / timeline.fps - timing.duration) > 1e-8 ||
      !scene ||
      scene.scene !== timing.id ||
      scene.totalFrames !== timing.frames ||
      scene.issueFrames !== 0 ||
      !Number.isInteger(scene.checkedLabels) ||
      scene.checkedLabels < 0 ||
      !Number.isInteger(scene.skippedLabels) ||
      scene.skippedLabels < 0
    )
      return false;
    if (
      timing.beats &&
      (!Array.isArray(timing.beats) ||
        timing.beats.some(
          (beat) => ![beat.start, beat.until].every(Number.isFinite) || beat.until <= beat.start,
        ))
    )
      return false;
    let expectedFrames;
    if (report.mode === 'all-frames') {
      if (scene.sampleFrames !== null) return false;
      expectedFrames = timing.frames;
    } else {
      const samples = textInkSampleFrames(timing, timeline.fps);
      if (JSON.stringify(scene.sampleFrames) !== JSON.stringify(samples)) return false;
      expectedFrames = samples.length;
    }
    if (scene.checkedFrames !== expectedFrames) return false;
    checkedFrames += expectedFrames;
    totalFrames += timing.frames;
    checkedLabels += scene.checkedLabels;
    skippedLabels += scene.skippedLabels;
  }
  return (
    checkedFrames > 0 &&
    checkedLabels > 0 &&
    report.checkedFrames === checkedFrames &&
    report.totalFrames === totalFrames &&
    totalFrames === receipt.frameAudit?.frames &&
    totalFrames === Math.round(timeline.duration * timeline.fps) &&
    report.checkedLabels === checkedLabels &&
    report.skippedLabels === skippedLabels
  );
}

export async function inspectionEvidence(output, id) {
  const folder = join(output, id, 'encoded-review');
  let report;
  try {
    report = JSON.parse(await readFile(join(folder, 'verification.json'), 'utf8'));
  } catch {
    return null;
  }
  const receipt = JSON.parse(await readFile(join(output, id, 'verification.json'), 'utf8'));
  if (!inspectReportIsComplete(report, receipt) || !/^[a-f0-9]{64}$/.test(receipt.fingerprint))
    return null;
  await verifyArtifactMap(folder, report.artifactSha256);
  const delivery = join(output, id),
    inkFile = join(delivery, 'text-ink-audit.json');
  let ink, timeline;
  try {
    ink = JSON.parse(await readFile(inkFile, 'utf8'));
    timeline = JSON.parse(await readFile(join(delivery, 'timeline.json'), 'utf8'));
  } catch {
    return null;
  }
  if (!ink || !timeline || timeline.id !== id || !textInkCoverageIsComplete(ink, receipt, timeline))
    return null;
  const tool = createHash('sha256')
    .update(
      Buffer.concat(
        await Promise.all(
          ['audit-text-ink.mjs', 'lib/text-ink-audit.mjs'].map((file) =>
            readFile(join(videosRoot, file)),
          ),
        ),
      ),
    )
    .digest('hex');
  const video = await hashFile(join(delivery, `${id}.mp4`));
  const timelineHash = await hashFile(join(delivery, 'timeline.json'));
  const receiptHash = await hashFile(join(delivery, 'verification.json'));
  if (
    ink.videoSha256 !== video ||
    video !== receipt.sha256 ||
    ink.sourceFingerprint !== receipt.fingerprint ||
    ink.toolSha256 !== tool ||
    ink.timelineSha256 !== timelineHash ||
    timelineHash !== receipt.artifactSha256?.['timeline.json'] ||
    ink.receiptSha256 !== receiptHash
  )
    return null;
  const motion = await motionAuditEvidence(delivery, id, timeline, receipt, {
    video,
    timelineHash,
    receiptHash,
  });
  if (!motion) return null;
  return {
    verification: await hashFile(join(folder, 'verification.json')),
    video: report.videoSha256,
    artifacts: report.artifactSha256,
    textInk: {
      report: await hashFile(inkFile),
      video,
      fingerprint: ink.sourceFingerprint,
      tool,
      timeline: timelineHash,
      receipt: receiptHash,
      frames: ink.checkedFrames,
      totalFrames: ink.totalFrames,
    },
    motion,
  };
}

async function motionAuditEvidence(
  delivery,
  id,
  timeline,
  receipt,
  { video, timelineHash, receiptHash },
) {
  const reportFile = join(delivery, 'motion-audit.json'),
    lessonFile = join(videosRoot, 'lessons', `${id}.lesson.yaml`);
  let report, lesson;
  try {
    report = JSON.parse(await readFile(reportFile, 'utf8'));
    lesson = await readLesson(lessonFile, repositoryRoot);
  } catch {
    return null;
  }
  let expected;
  try {
    expected = validateMotionTimeline(lesson, timeline);
    validateMotionReceipt(lesson, timeline, receipt, {
      movieSha256: video,
      timelineSha256: timelineHash,
      frames: expected.frames,
    });
  } catch {
    return null;
  }
  const [lessonHash, tool] = await Promise.all([
    hashFile(lessonFile),
    createHash('sha256')
      .update(
        Buffer.concat(
          await Promise.all(
            ['audit-motion.mjs', 'lib/motion-audit.mjs'].map((file) =>
              readFile(join(videosRoot, file)),
            ),
          ),
        ),
      )
      .digest('hex'),
  ]);
  const declaredChecks = expected.checks.length;
  const coverage = report.coverage;
  if (
    report.version !== 1 ||
    report.id !== id ||
    report.mode !== 'declared-regions-encoded' ||
    report.rule !== 'declared-region-pixel-change' ||
    report.scope !== MOTION_SCOPE ||
    report.timingSource !== 'measured-final' ||
    report.width !== timeline.width ||
    report.height !== timeline.height ||
    report.fps !== timeline.fps ||
    report.thresholds?.minimumChannelDelta !== MOTION_CHANNEL_DELTA ||
    report.thresholds?.minimumChangedPixels !== MOTION_MINIMUM_PIXELS ||
    JSON.stringify(report.sampleProgress) !== JSON.stringify(MOTION_SAMPLE_PROGRESS) ||
    report.movieSha256 !== video ||
    report.videoSha256 !== video ||
    report.timelineSha256 !== timelineHash ||
    report.receiptSha256 !== receiptHash ||
    report.lessonSha256 !== lessonHash ||
    report.sourceFingerprint !== receipt.fingerprint ||
    report.toolSha256 !== tool ||
    report.passed !== true ||
    !Array.isArray(report.issues) ||
    report.issues.length !== 0 ||
    !coverage ||
    coverage.narratedBeats !== expected.narratedBeats ||
    coverage.declaredChecks !== declaredChecks ||
    coverage.checkedBeats !== declaredChecks ||
    typeof coverage.fraction !== 'number' ||
    coverage.fraction !== (expected.narratedBeats ? declaredChecks / expected.narratedBeats : 0) ||
    coverage.status !== (declaredChecks ? 'declared-subset' : 'none') ||
    !Array.isArray(report.checks) ||
    report.checks.length !== declaredChecks
  )
    return null;
  for (const [index, check] of report.checks.entries()) {
    const declaration = expected.checks[index];
    const sameDeclaration =
      check.scene === declaration.scene &&
      check.sceneIndex === declaration.sceneIndex &&
      check.beat === declaration.beat &&
      JSON.stringify(check.region) === JSON.stringify(declaration.region) &&
      check.minimumChangedFraction === declaration.minimumChangedFraction &&
      JSON.stringify(check.samples) === JSON.stringify(declaration.samples);
    const pairs = check.pairs;
    const validPairs =
      Array.isArray(pairs) &&
      pairs.length === 3 &&
      [
        [0, 1],
        [1, 2],
        [0, 2],
      ].every(([from, to], pairIndex) => {
        const pair = pairs[pairIndex],
          pixels = declaration.region[2] * declaration.region[3];
        if (
          !pair ||
          pair.from !== from ||
          pair.to !== to ||
          !Number.isInteger(pair.changedPixels) ||
          pair.changedPixels < 0 ||
          pair.changedPixels > pixels ||
          pair.regionPixels !== pixels ||
          !Number.isFinite(pair.changedFraction) ||
          Math.abs(pair.changedFraction - pair.changedPixels / pixels) > 1e-12
        )
          return false;
        const passed =
          pair.changedPixels >= MOTION_MINIMUM_PIXELS &&
          pair.changedFraction >= declaration.minimumChangedFraction;
        return pair.passed === passed;
      });
    if (
      !sameDeclaration ||
      !validPairs ||
      check.passed !== pairs.some((pair) => pair.passed) ||
      check.passed !== true
    )
      return null;
  }
  return {
    report: await hashFile(reportFile),
    video,
    fingerprint: receipt.fingerprint,
    timeline: timelineHash,
    receipt: receiptHash,
    lesson: lessonHash,
    tool,
    declaredChecks,
    checkedBeats: coverage.checkedBeats,
    narratedBeats: coverage.narratedBeats,
  };
}

const evidenceFor = {
  intro: introEvidence,
  audio: audioEvidence,
  render: renderEvidence,
  occlusion: occlusionEvidence,
  inspection: inspectionEvidence,
};

export async function reusable(receipt, id, name, output) {
  const saved = phase(receipt, id, name);
  if (saved.status !== 'complete' || !evidenceFor[name]) return false;
  const actual = await evidenceFor[name](output, id);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(saved.evidence)) {
    saved.status = 'pending';
    delete saved.evidence;
    return false;
  }
  return true;
}

function filteredProgress(text, label) {
  const useful =
    /\b(?:Error:|validated|rendering \d+\/|audited \d+ frames|aggregate occlusion audited|PASS|FAIL|READY |LeetLLM intro:|Ready:|verified$|decoded all \d+ frames)/i;
  for (const line of text.split(/\r?\n/))
    if (useful.test(line)) console.log(`[${label}] ${line.trim()}`);
}

async function runChild(command, args, { cwd, logFile, signal, label }) {
  await mkdir(dirname(logFile), { recursive: true });
  const log = createWriteStream(logFile, { flags: 'w' });
  let pending = '';
  const emit = (chunk) => {
    log.write(chunk);
    pending += chunk.toString('utf8');
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? '';
    filteredProgress(lines.join('\n'), label);
  };
  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  child.stdout.on('data', emit);
  child.stderr.on('data', emit);
  let timer;
  const stop = () => {
    if (!child.pid) return;
    try {
      if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH')
        console.error(`[${label}] unable to stop child group: ${error.message}`);
    }
    timer = setTimeout(() => {
      try {
        if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH')
          console.error(`[${label}] unable to stop child group: ${error.message}`);
      }
    }, 3000);
    timer.unref();
  };
  const abort = () => stop();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) stop();
  try {
    const result = await new Promise((resolvePromise, reject) => {
      child.once('error', reject);
      child.once('close', (code, signalName) => resolvePromise({ code, signalName }));
    });
    if (pending) filteredProgress(pending, label);
    await new Promise((resolvePromise, reject) =>
      log.end((error) => (error ? reject(error) : resolvePromise())),
    );
    if (signal?.aborted) throw new Error(`${label}: interrupted`);
    if (result.code !== 0)
      throw new Error(
        `${label}: ${command} exited ${result.code ?? result.signalName}; see ${logFile}`,
      );
  } catch (error) {
    log.destroy();
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

async function setPhase(receipt, persist, id, name, status, details = {}) {
  const record = phase(receipt, id, name);
  if (status === 'running' || status === 'failed' || status === 'cancelled') delete record.evidence;
  if (status === 'running' || status === 'complete') delete record.error;
  Object.assign(record, { status, updatedAt: new Date().toISOString() }, details);
  if (status === 'running') record.startedAt = new Date().toISOString();
  if (status === 'complete' || status === 'failed' || status === 'cancelled')
    record.completedAt = new Date().toISOString();
  await persist();
}

function pathsFor(output, id, phaseName) {
  const safeId = slug.test(id) ? id : 'invalid-id';
  return join(output, 'logs', `${safeId}.${phaseName}.log`);
}

async function runStage(
  context,
  id,
  name,
  command,
  args,
  signal,
  label = id,
  logFile = pathsFor(context.output, id ?? 'collection', name),
) {
  await assertFrozen(context);
  await runChild(command, args, { cwd: repositoryRoot, logFile, signal, label });
  await assertFrozen(context);
}

export async function runInspectionStage(context, id, run = runStage) {
  await run(
    context,
    id,
    'inspection',
    process.execPath,
    ['videos/inspect.mjs', '--lesson', id, '--input', context.output],
    context.signal,
  );
  await run(
    context,
    id,
    'inspection',
    process.execPath,
    ['videos/audit-text-ink.mjs', '--lesson', id, '--input', context.output, '--actual'],
    context.signal,
    id,
    pathsFor(context.output, id, 'text-ink'),
  );
  await run(
    context,
    id,
    'inspection',
    process.execPath,
    ['videos/audit-motion.mjs', '--lesson', id, '--input', context.output],
    context.signal,
    id,
    pathsFor(context.output, id, 'motion-audit'),
  );
}

export async function runFinalizedRenderStage(
  context,
  id,
  {
    run = runStage,
    finalizeCaptions = regenerateLessonCaptions,
    assertSources = assertFrozen,
    captureRender = renderEvidence,
  } = {},
) {
  await run(
    context,
    id,
    'render',
    process.execPath,
    [
      'videos/render.mjs',
      '--lesson',
      id,
      '--output',
      context.output,
      '--no-manifest',
      '--threads',
      String(context.options.threads),
    ],
    context.signal,
  );

  await finalizeCaptions({ input: context.output, id });
  await assertSources(context);

  const evidence = await captureRender(context.output, id);
  if (!evidence) throw new Error(`${id}: finalized render completed without a verifiable receipt`);
  return evidence;
}

async function runAudioStage(context, lesson) {
  const baseLog = pathsFor(context.output, lesson.id, 'audio');
  await runWithTruncatedSpeechRecovery({
    run: ({ logFile }) =>
      runStage(
        context,
        lesson.id,
        'audio',
        process.execPath,
        [
          'videos/render.mjs',
          '--lesson',
          lesson.id,
          '--output',
          context.output,
          '--audio-only',
          '--no-manifest',
        ],
        context.signal,
        lesson.id,
        logFile,
      ),
    readLog: (path) => readFile(path, 'utf8'),
    logFileForAttempt: (attempt) =>
      attempt === 1 ? baseLog : baseLog.replace(/\.log$/, `.attempt-${attempt}.log`),
    assertFrozen: () => assertFrozen(context),
    signal: context.signal,
    onRetry: ({ nextAttempt }) =>
      console.warn(
        `[${lesson.id}] truncated narration cache; retrying audio stage (${nextAttempt}/3)`,
      ),
  });
}

async function validateOnly(context) {
  const { receipt, persist, output, lessons, options } = context;
  await runBoundedQueue(lessons, options.jobs, async (lesson) => {
    for (const [name, commandArgs] of [
      [
        'renderValidate',
        [
          'videos/render.mjs',
          '--lesson',
          lesson.id,
          '--validate',
          '--no-manifest',
          '--output',
          output,
        ],
      ],
      [
        'occlusionValidate',
        ['videos/audit-occlusion.mjs', '--lesson', lesson.id, '--validate', '--input', output],
      ],
    ]) {
      if (await reusable(receipt, lesson.id, name, output)) continue;
      await setPhase(receipt, persist, lesson.id, name, 'running');
      try {
        await runStage(context, lesson.id, name, process.execPath, commandArgs, context.signal);
        const log = pathsFor(output, lesson.id, name);
        await setPhase(receipt, persist, lesson.id, name, 'complete', {
          evidence: { log: await hashFile(log) },
        });
      } catch (error) {
        const status = context.signal.aborted ? 'cancelled' : 'failed';
        await setPhase(receipt, persist, lesson.id, name, status, { error: error.message });
        console.error(`[${lesson.id}] ${name} ${status}: ${error.message}`);
        throw error;
      }
    }
  });
}

async function prepareOnly(context) {
  const { receipt, persist, output, lessons } = context;
  await runBoundedQueue(lessons, 1, async (lesson, index) => {
    if (await reusable(receipt, lesson.id, 'audio', output)) {
      console.log(`[${lesson.id}] audio ready (${index + 1}/${lessons.length}), reused`);
      return;
    }
    console.log(`[${lesson.id}] preparing narration (${index + 1}/${lessons.length})`);
    await setPhase(receipt, persist, lesson.id, 'audio', 'running');
    try {
      await runAudioStage(context, lesson);
      const evidence = await audioEvidence(output, lesson.id);
      if (!evidence)
        throw new Error(
          `${lesson.id}: audio preparation did not produce a verifiable measured timeline`,
        );
      await setPhase(receipt, persist, lesson.id, 'audio', 'complete', { evidence });
      console.log(`[${lesson.id}] narration ready (${index + 1}/${lessons.length})`);
    } catch (error) {
      const status = context.signal.aborted ? 'cancelled' : 'failed';
      await setPhase(receipt, persist, lesson.id, 'audio', status, { error: error.message });
      console.error(`[${lesson.id}] audio ${status}: ${error.message}`);
      throw error;
    }
  });
}

async function renderCollection(context) {
  const { receipt, persist, output, lessons, options } = context;
  if (await reusable(receipt, null, 'intro', output))
    console.log('[collection] intro ready, reused');
  else {
    await setPhase(receipt, persist, null, 'intro', 'running');
    try {
      await runStage(
        context,
        'intro',
        'intro',
        process.execPath,
        [
          'videos/render.mjs',
          '--intro-only',
          '--output',
          output,
          '--threads',
          String(options.threads),
        ],
        context.signal,
        'collection',
      );
      const evidence = await introEvidence(output);
      if (!evidence) throw new Error('Intro render did not produce a movie');
      await setPhase(receipt, persist, null, 'intro', 'complete', { evidence });
    } catch (error) {
      await setPhase(
        receipt,
        persist,
        null,
        'intro',
        context.signal.aborted ? 'cancelled' : 'failed',
        { error: error.message },
      );
      throw error;
    }
  }
  await prepareOnly(context);
  await runReviewQueue(
    lessons,
    options.jobs,
    async (lesson, index) => {
      console.log(`[${lesson.id}] rendering lesson (${index + 1}/${lessons.length})`);
      for (const [name, command, args] of [
        [
          'render',
          process.execPath,
          [
            'videos/render.mjs',
            '--lesson',
            lesson.id,
            '--output',
            output,
            '--no-manifest',
            '--threads',
            String(options.threads),
          ],
        ],
        [
          'occlusion',
          process.execPath,
          ['videos/audit-occlusion.mjs', '--lesson', lesson.id, '--input', output],
        ],
        [
          'inspection',
          process.execPath,
          ['videos/inspect.mjs', '--lesson', lesson.id, '--input', output],
        ],
      ]) {
        if (await reusable(receipt, lesson.id, name, output)) {
          console.log(`[${lesson.id}] ${name} ready, reused`);
          continue;
        }
        await setPhase(receipt, persist, lesson.id, name, 'running');
        try {
          let evidence;
          if (name === 'inspection') {
            await runInspectionStage(context, lesson.id);
            evidence = await evidenceFor[name](output, lesson.id);
          } else if (name === 'render') {
            evidence = await runFinalizedRenderStage(context, lesson.id);
          } else {
            await runStage(context, lesson.id, name, command, args, context.signal);
            evidence = await evidenceFor[name](output, lesson.id);
          }
          if (!evidence)
            throw new Error(`${lesson.id}: ${name} completed without a verifiable receipt`);
          await setPhase(receipt, persist, lesson.id, name, 'complete', { evidence });
        } catch (error) {
          const status = context.signal.aborted ? 'cancelled' : 'failed';
          await setPhase(receipt, persist, lesson.id, name, status, { error: error.message });
          console.error(`[${lesson.id}] ${name} ${status}: ${error.message}`);
          throw error;
        }
      }
    },
    {
      keepGoing: options.keepGoing,
      assertSources: () => assertFrozen(context),
      signal: context.signal,
    },
  );
}

async function combinedManifest(context) {
  await assertFrozen(context);
  const outputReceipts = [];
  for (const lesson of context.lessons) {
    const id = lesson.id;
    const render = await renderEvidence(context.output, id);
    const audit = await occlusionEvidence(context.output, id);
    const inspection = await inspectionEvidence(context.output, id);
    if (!render || !audit || !inspection)
      throw new Error(`${id}: delivery is incomplete or its verification artifacts changed`);
    const receipt = JSON.parse(
      await readFile(join(context.output, id, 'verification.json'), 'utf8'),
    );
    const articleHash = context.freeze.files.find(
      (file) => file.path === `web/src/content/${lesson.source}`,
    )?.sha256;
    if (!articleHash || receipt.sourceSha256 !== articleHash)
      throw new Error(`${id}: video receipt does not match the frozen source article`);
    outputReceipts.push(receipt);
  }
  const ordered = orderReceipts(
    context.lessons.map((lesson) => lesson.id),
    outputReceipts,
  );
  await atomicJson(join(context.output, 'manifest.json'), ordered);
  return ordered;
}

async function packageInputEvidence(context) {
  await assertFrozen(context);
  let manifest = null;
  try {
    manifest = await hashFile(join(context.output, 'manifest.json'));
  } catch {
    /* A missing manifest disables cache reuse. */
  }
  let complete = Boolean(manifest);
  const lessons = [];
  for (const lesson of context.lessons) {
    const evidence = { id: lesson.id, render: null, occlusion: null, inspection: null };
    try {
      evidence.render = await renderEvidence(context.output, lesson.id);
    } catch {
      /* A bad delivery forces a package attempt that will report the failure. */
    }
    try {
      evidence.occlusion = await occlusionEvidence(context.output, lesson.id);
    } catch {
      /* Revalidated by the strict packager. */
    }
    try {
      evidence.inspection = await inspectionEvidence(context.output, lesson.id);
    } catch {
      /* Revalidated by the strict packager. */
    }
    if (!evidence.render || !evidence.occlusion || !evidence.inspection) complete = false;
    lessons.push(evidence);
  }
  return {
    version: 1,
    complete,
    collectionId: context.collection.id,
    lessonIds: context.lessons.map((lesson) => lesson.id),
    sourceFreezeSha256: context.freeze.sha256,
    manifestSha256: manifest,
    lessons,
  };
}

export async function packageCollection(
  context,
  { getInputs = packageInputEvidence, run = runStage } = {},
) {
  const { receipt, persist, output, lessons } = context;
  if (context.options.noPackage) return;
  let inputs;
  try {
    inputs = await getInputs(context);
  } catch (error) {
    await setPhase(receipt, persist, null, 'package', 'failed', { error: error.message });
    throw error;
  }
  const saved = phase(receipt, null, 'package');
  if (saved.status === 'complete' && saved.evidence) {
    const archive = join(output, `leetllm-${context.collection.id}.zip`);
    try {
      const actual = { archive: await hashFile(archive), bytes: (await stat(archive)).size };
      if (
        inputs.complete === true &&
        saved.evidence.inputs &&
        JSON.stringify(actual) ===
          JSON.stringify({ archive: saved.evidence.archive, bytes: saved.evidence.bytes }) &&
        JSON.stringify(inputs) === JSON.stringify(saved.evidence.inputs)
      ) {
        console.log('[collection] package ready, reused');
        return;
      }
    } catch {
      /* Rebuild the archive when its saved evidence is incomplete. */
    }
  }
  await setPhase(receipt, persist, null, 'package', 'running');
  try {
    await run(
      context,
      null,
      'package',
      'uv',
      [
        'run',
        'videos/package.py',
        '--input',
        output,
        '--require-text-ink',
        '--require-motion',
        '--lessons',
        ...lessons.map((lesson) => lesson.id),
        '--archive',
        `leetllm-${context.collection.id}.zip`,
      ],
      context.signal,
      'collection',
    );
    const archive = join(output, `leetllm-${context.collection.id}.zip`);
    const packagedInputs = await getInputs(context);
    if (packagedInputs.complete !== true)
      throw new Error('Collection package inputs changed or failed verification during packaging');
    const evidence = {
      archive: await hashFile(archive),
      bytes: (await stat(archive)).size,
      inputs: packagedInputs,
    };
    await setPhase(receipt, persist, null, 'package', 'complete', { evidence });
  } catch (error) {
    await setPhase(
      receipt,
      persist,
      null,
      'package',
      context.signal.aborted ? 'cancelled' : 'failed',
      { error: error.message },
    );
    throw error;
  }
}

export async function runBatch(options) {
  const { file: collectionFile, collection } = await loadCollection(options.collection);
  let output = resolve(
    repositoryRoot,
    options.output ?? collection.output ?? `build/videos-${collection.id}`,
  );
  validateOutputPath(output, {
    repositoryRoot,
    videosRoot,
    contentRoot: join(repositoryRoot, 'web/src/content'),
  });
  const lessons = await validateInputs(collection);
  const { freeze, runtime } = await makeFreeze(collectionFile, lessons);
  await mkdir(output, { recursive: true });
  output = await realpath(output);
  validateOutputPath(output, {
    repositoryRoot,
    videosRoot,
    contentRoot: join(repositoryRoot, 'web/src/content'),
  });
  const { path: receiptPath, receipt } = await createReceipt(output, collection, options, freeze);
  const persist = makePersister(receiptPath, receipt);
  await persist();
  const controller = new AbortController();
  let interrupted = false;
  const onInterrupt = () => {
    interrupted = true;
    controller.abort();
  };
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);
  const context = {
    collectionFile,
    collection,
    lessons,
    output,
    receipt,
    persist,
    options,
    freeze,
    runtime,
    controller,
    signal: controller.signal,
    get interrupted() {
      return interrupted;
    },
  };
  try {
    await assertFrozen(context);
    if (options.validateOnly) await validateOnly(context);
    else if (options.prepareOnly) await prepareOnly(context);
    else {
      await renderCollection(context);
      await combinedManifest(context);
      await packageCollection(context);
    }
    await assertFrozen(context);
    receipt.status = 'complete';
    receipt.completedAt = new Date().toISOString();
    await persist();
    console.log(`[collection] ${receipt.mode} complete: ${output}`);
    return { output, receipt };
  } catch (error) {
    receipt.status = interrupted ? 'interrupted' : 'failed';
    receipt.error = error.message;
    receipt.completedAt = new Date().toISOString();
    await persist();
    if (interrupted)
      throw Object.assign(new Error('interrupted', { cause: error }), { code: 'SIGINT' });
    throw error;
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onInterrupt);
  }
}

async function main() {
  const options = parseBatchArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  try {
    await runBatch(options);
  } catch (error) {
    console.error(error.stack ?? error);
    process.exitCode = error.code === 'SIGINT' ? 130 : 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
