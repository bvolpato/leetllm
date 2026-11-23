#!/usr/bin/env node
import { verifiedClockReceipt } from './lib/frame-clock.mjs';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverLessons } from './catalog.mjs';
import { readLesson } from './lib/lesson.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { renderEngineBytes } from './lib/render-engine.mjs';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import {
  MOTION_SAMPLE_PROGRESS,
  MOTION_CHANNEL_DELTA,
  MOTION_MINIMUM_PIXELS,
  MOTION_SCOPE,
  validateMotionTimeline,
  validateMotionReceipt,
  evaluateMotionFrames,
} from './lib/motion-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..');
const execute = promisify(execFile),
  hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function hashFile(file) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
}

async function sourceFingerprint(id, receipt) {
  if (receipt.sourceManifest !== undefined) return currentSourceFingerprint(root, id, receipt);
  const adapter = receipt.ttsAdapter;
  if (!adapter?.path || !adapter.sha256) throw new Error(`${id}: missing adapter provenance`);
  const adapterBytes = await readFile(resolve(root, adapter.path));
  if (hash(adapterBytes) !== adapter.sha256) throw new Error(`${id}: TTS adapter changed`);
  const files = [
    `lessons/${id}.lesson.yaml`,
    `animations/${id}.mjs`,
    'render.mjs',
    'lib/scene.mjs',
    'lib/lesson.mjs',
    'lib/narration-cues.mjs',
    'lib/captions.mjs',
    'lib/delivery.mjs',
    'lib/brand.mjs',
    'lib/frame-audit.mjs',
    'lib/layout-review.mjs',
    'assets/leetllm-mark.svg',
    'package-lock.json',
    ...conceptSourceFiles(),
  ];
  const digest = createHash('sha256');
  for (const file of files) digest.update(await readFile(join(here, file)));
  digest.update(renderEngineBytes());
  digest.update(adapterBytes);
  return digest.digest('hex');
}

export async function extractMotionFrame(movie, time, width = 1920, height = 1080) {
  const { stdout } = await execute(
    'ffmpeg',
    [
      '-v',
      'error',
      '-threads',
      '1',
      '-filter_threads',
      '1',
      '-ss',
      time.toFixed(9),
      '-i',
      movie,
      '-frames:v',
      '1',
      '-an',
      '-sn',
      '-pix_fmt',
      'rgb24',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    { encoding: 'buffer', maxBuffer: width * height * 3 + 1024 * 1024 },
  );
  if (stdout.length !== width * height * 3)
    throw new Error(
      `Encoded frame at ${time}s has ${stdout.length} bytes; expected native RGB24 ${width}×${height}`,
    );
  return { width, height, data: stdout };
}

export async function inspectEncodedMotionCheck(movie, check) {
  const frames = await Promise.all(
    check.samples.map((sample) => extractMotionFrame(movie, sample.time)),
  );
  return evaluateMotionFrames(frames, {
    region: check.region,
    minimumChangedFraction: check.minimumChangedFraction,
  });
}

export async function auditMotionLesson(id, { input = 'build/videos', output } = {}) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Lesson ID must be a lowercase slug');
  const directory = join(resolve(root, input), id),
    movie = join(directory, `${id}.mp4`);
  const lessonFile = join(here, 'lessons', `${id}.lesson.yaml`);
  const lesson = await readLesson(lessonFile, root),
    lessonSha256 = await hashFile(lessonFile);
  const timelineBytes = await readFile(join(directory, 'timeline.json'));
  const receiptBytes = await readFile(join(directory, 'verification.json'));
  const timeline = JSON.parse(timelineBytes),
    receipt = JSON.parse(receiptBytes);
  const { checks, narratedBeats, frames } = validateMotionTimeline(lesson, timeline);
  const movieSha256 = await hashFile(movie),
    timelineSha256 = hash(timelineBytes),
    receiptSha256 = hash(receiptBytes);
  validateMotionReceipt(lesson, timeline, await verifiedClockReceipt(movie, receipt, timeline.fps), { movieSha256, timelineSha256, frames });
  const fingerprint = await sourceFingerprint(id, receipt);
  if (receipt.fingerprint !== fingerprint)
    throw new Error(`${id}: current render sources differ from movie`);
  if (
    receipt.source !== lesson.source ||
    (await hashFile(join(root, 'web/src/content', lesson.source))) !== receipt.sourceSha256
  )
    throw new Error(`${id}: article changed after rendering`);
  const { stdout } = await execute(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', movie],
    { maxBuffer: 1024 * 1024 },
  );
  const media = JSON.parse(stdout),
    video = media.streams?.find((stream) => stream.codec_type === 'video');
  if (
    !video ||
    video.width !== 1920 ||
    video.height !== 1080 ||
    Number(video.nb_frames) !== frames ||
    !Number.isFinite(Number(video.duration)) ||
    Math.abs(Number(video.duration) - timeline.duration) > 1e-6 ||
    Math.abs(Number(media.format?.duration) - timeline.duration) > 0.15 ||
    Math.abs(Number(media.format?.duration) - receipt.duration) > 1e-6
  )
    throw new Error(`${id}: encoded native geometry or duration differs from timeline`);
  const toolSha256 = hash(
    Buffer.concat(
      await Promise.all(
        ['audit-motion.mjs', 'lib/motion-audit.mjs'].map((file) => readFile(join(here, file))),
      ),
    ),
  );
  const report = {
    version: 1,
    id,
    mode: 'declared-regions-encoded',
    rule: 'declared-region-pixel-change',
    scope: MOTION_SCOPE,
    movieSha256,
    videoSha256: movieSha256,
    timelineSha256,
    receiptSha256,
    lessonSha256,
    sourceFingerprint: fingerprint,
    toolSha256,
    timingSource: 'measured-final',
    width: 1920,
    height: 1080,
    fps: timeline.fps,
    thresholds: {
      minimumChannelDelta: MOTION_CHANNEL_DELTA,
      minimumChangedPixels: MOTION_MINIMUM_PIXELS,
    },
    sampleProgress: MOTION_SAMPLE_PROGRESS,
    coverage: {
      narratedBeats,
      declaredChecks: checks.length,
      checkedBeats: 0,
      fraction: checks.length / narratedBeats,
      status: checks.length ? 'declared-subset' : 'none',
      note: checks.length
        ? 'Undeclared beats are outside this audit.'
        : 'Zero motion coverage: no beat declares motion_check.',
    },
    checks: [],
    issues: [],
    passed: false,
  };
  for (const check of checks) {
    const result = await inspectEncodedMotionCheck(movie, check);
    report.checks.push({ ...check, ...result });
    report.coverage.checkedBeats++;
    if (!result.passed)
      report.issues.push({
        scene: check.scene,
        beat: check.beat,
        region: check.region,
        description:
          'No sampled pair meets both the changed-pixel floor and the declared changed fraction.',
      });
    console.log(
      `${id}/${check.scene} beat ${check.beat + 1}: ${result.passed ? 'PASS' : 'FAIL'} declared region`,
    );
  }
  report.passed = report.issues.length === 0;
  const currentTool = hash(
    Buffer.concat(
      await Promise.all(
        ['audit-motion.mjs', 'lib/motion-audit.mjs'].map((file) => readFile(join(here, file))),
      ),
    ),
  );
  if (
    (await hashFile(movie)) !== movieSha256 ||
    (await hashFile(join(directory, 'timeline.json'))) !== timelineSha256 ||
    (await hashFile(join(directory, 'verification.json'))) !== receiptSha256 ||
    (await hashFile(lessonFile)) !== lessonSha256 ||
    (await sourceFingerprint(id, receipt)) !== fingerprint ||
    currentTool !== toolSha256 ||
    (await hashFile(join(root, 'web/src/content', lesson.source))) !== receipt.sourceSha256
  )
    throw new Error(`${id}: audited inputs changed during motion audit`);
  const targetDirectory = output ? join(resolve(root, output), id) : directory;
  await mkdir(targetDirectory, { recursive: true });
  const target = join(targetDirectory, 'motion-audit.json'),
    temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
  await rename(temporary, target);
  console.log(
    `${id}: ${report.passed ? 'PASS' : 'FAIL'} ${checks.length}/${narratedBeats} declared beats${checks.length ? '' : ' · ZERO COVERAGE'}; ${target}`,
  );
  return report;
}

async function main() {
  const args = process.argv.slice(2),
    allowed = new Set(['--lesson', '--input', '--output', '--actual', '--all', '--validate']);
  const value = (flag) => {
    const at = args.indexOf(flag);
    if (at < 0) return undefined;
    if (!args[at + 1] || args[at + 1].startsWith('--')) throw new Error(`${flag} requires a value`);
    return args[at + 1];
  };
  for (const arg of args.filter((arg) => arg.startsWith('--')))
    if (!allowed.has(arg)) throw new Error(`Unknown option ${arg}`);
  const lessonId = value('--lesson'),
    input = value('--input'),
    output = value('--output');
  if (!lessonId && !args.includes('--all'))
    throw new Error(
      'Use --lesson ID or --all; this audit requires delivered MP4s and verified measured timelines',
    );
  const lessons = await discoverLessons(undefined, undefined, { lessonId });
  for (const lesson of lessons) {
    const report = await auditMotionLesson(lesson.id, { input, output });
    if (!report.passed) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
