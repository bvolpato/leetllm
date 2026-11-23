#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { discoverLessons } from './catalog.mjs';
import { readLesson, makeSceneTimeline, frameState } from './lib/lesson.mjs';
import { drawFrame } from './lib/scene.mjs';
import { drawBrandIntro } from './lib/brand.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { renderEngineBytes } from './lib/render-engine.mjs';
import { canvasLessonImplementation } from './lib/lesson-production.mjs';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import { createTextInkAudit, TEXT_INK_RULE, TEXT_INK_SCOPE } from './lib/text-ink-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const progress = [0.02, 0.25, 0.5, 0.75, 0.98];

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

function validateTimeline(lesson, timeline) {
  if (
    timeline.id !== lesson.id ||
    !Number.isInteger(timeline.fps) ||
    timeline.fps < 1 ||
    timeline.fps > 60 ||
    timeline.scenes?.length !== lesson.scenes.length
  )
    throw new Error(`${lesson.id}: invalid timeline`);
  for (const [index, timing] of timeline.scenes.entries()) {
    const scene = lesson.scenes[index];
    if (
      timing.id !== scene.id ||
      !Number.isInteger(timing.frames) ||
      timing.frames <= 0 ||
      timing.beats?.length !== scene.beats.length ||
      Math.abs(timing.frames / timeline.fps - timing.duration) > 1e-8
    ) {
      throw new Error(`${lesson.id}/${scene.id}: timeline geometry differs from lesson`);
    }
    for (const [beat, voice] of timing.beats.entries()) {
      if (
        voice.say !== scene.beats[beat].say ||
        (voice.hold ?? 0.45) !== (scene.beats[beat].hold ?? 0.45) ||
        ![voice.start, voice.until].every(Number.isFinite) ||
        voice.until <= voice.start
      ) {
        throw new Error(`${lesson.id}/${scene.id}: stale or invalid beat timeline`);
      }
    }
  }
}

export function textInkSampleFrames(timing, fps) {
  const frames = new Set([0, timing.frames - 1]);
  const add = (time) =>
    frames.add(Math.max(0, Math.min(timing.frames - 1, Math.round(time * fps))));
  if (timing.beats)
    for (const beat of timing.beats) {
      add(beat.start);
      for (const p of progress) add(beat.start + (beat.until - beat.start) * p);
    }
  else for (const p of progress) add(timing.duration * p);
  return [...frames].sort((a, b) => a - b);
}

async function timelineFor(lesson, input, actual) {
  const id = lesson.id;
  if (actual) {
    const directory = join(input, id),
      receiptBytes = await readFile(join(directory, 'verification.json'));
    const receipt = JSON.parse(receiptBytes),
      bytes = await readFile(join(directory, 'timeline.json'));
    const timeline = JSON.parse(bytes),
      timelineSha256 = hash(bytes);
    if (
      receipt.id !== id ||
      receipt.fullDecode !== 'passed' ||
      receipt.width !== timeline.width ||
      receipt.height !== timeline.height ||
      timelineSha256 !== receipt.artifactSha256?.['timeline.json']
    )
      throw new Error(`${id}: timeline or receipt does not match the verified movie`);
    const videoSha256 = await hashFile(join(directory, `${id}.mp4`));
    if (videoSha256 !== receipt.sha256)
      throw new Error(`${id}: movie checksum differs from receipt`);
    const fingerprint = await sourceFingerprint(id, receipt);
    if (fingerprint !== receipt.fingerprint)
      throw new Error(`${id}: current render sources differ from movie`);
    if (
      receipt.source !== lesson.source ||
      (await hashFile(join(root, 'web/src/content', lesson.source))) !== receipt.sourceSha256
    ) {
      throw new Error(`${id}: article changed after rendering`);
    }
    validateTimeline(lesson, timeline);
    return {
      timeline,
      timingSource: 'measured-final',
      timelineSha256,
      receipt,
      receiptSha256: hash(receiptBytes),
      videoSha256,
      sourceFingerprint: fingerprint,
    };
  }
  let bytes;
  try {
    bytes = await readFile(join(input, 'previews', id, 'timeline.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (bytes) {
    const timeline = JSON.parse(bytes);
    validateTimeline(lesson, timeline);
    return { timeline, timingSource: 'measured-preview', timelineSha256: hash(bytes) };
  }
  const fps = 30;
  const timeline = {
    id,
    fps,
    width: 1920,
    height: 1080,
    scenes: lesson.scenes.map((scene) =>
      makeSceneTimeline(
        scene,
        scene.beats.map((beat) => beat.say.split(/\s+/).length / 2.5),
        fps,
      ),
    ),
  };
  return { timeline, timingSource: 'estimated', timelineSha256: hash(JSON.stringify(timeline)) };
}

export async function auditTextInkLesson(id, { input, actual = false, everyFrame = false } = {}) {
  if (everyFrame && !actual)
    throw new Error('--every-frame requires --actual and a verified measured timeline');
  input = resolve(root, input ?? 'build/videos');
  const lesson = await readLesson(join(here, 'lessons', `${id}.lesson.yaml`), root);
  const provenance = await timelineFor(lesson, input, actual),
    { timeline } = provenance;
  const moduleFile = join(here, 'animations', `${id}.mjs`);
  const sourceBytes = await Promise.all(
    [join(here, 'lessons', `${id}.lesson.yaml`), moduleFile].map((file) => readFile(file)),
  );
  const authorSourceSha256 = hash(Buffer.concat(sourceBytes));
  const { draw, validateModel } = canvasLessonImplementation(
    await import(pathToFileURL(moduleFile).href),
    lesson,
  );
  validateModel?.();
  const width = timeline.width ?? 1920,
    height = timeline.height ?? 1080;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new Error(`${id}: invalid canvas dimensions`);
  const canvas = createCanvas(width, height),
    audit = createTextInkAudit(canvas.getContext('2d'));
  const toolSha256 = hash(
    Buffer.concat(
      await Promise.all(
        ['audit-text-ink.mjs', 'lib/text-ink-audit.mjs'].map((file) => readFile(join(here, file))),
      ),
    ),
  );
  const report = {
    version: 1,
    rule: TEXT_INK_RULE,
    scope: TEXT_INK_SCOPE,
    mode: actual ? (everyFrame ? 'all-frames' : 'sampled-final') : 'sampled-author',
    id,
    videoSha256: provenance.videoSha256 ?? null,
    sourceFingerprint: provenance.sourceFingerprint ?? null,
    authorSourceSha256,
    toolSha256,
    timelineSha256: provenance.timelineSha256,
    receiptSha256: provenance.receiptSha256 ?? null,
    timingSource: provenance.timingSource,
    width,
    height,
    fps: timeline.fps,
    thresholds: {
      minimumOpacity: 0.25,
      opacityQuantizationTolerance: 1 / 255,
      minimumChannelDelta: 6,
      minimumGlyphPixels: 3,
    },
    checkedFrames: 0,
    checkedLabels: 0,
    skippedLabels: 0,
    issueFrames: 0,
    totalFrames: 0,
    scenes: [],
    issues: [],
    passed: false,
  };
  const started = performance.now(),
    findings = new Map();
  const scenes = [
    ...(timeline.intro ? [{ timing: timeline.intro, index: -1 }] : []),
    ...timeline.scenes.map((timing, index) => ({ timing, index })),
  ];
  let cursor = 0;
  for (const { timing, index } of scenes) {
    const frames = everyFrame
      ? Array.from({ length: timing.frames }, (_, frame) => frame)
      : textInkSampleFrames(timing, timeline.fps);
    const summary = {
      scene: timing.id,
      totalFrames: timing.frames,
      checkedFrames: frames.length,
      checkedLabels: 0,
      skippedLabels: 0,
      issueFrames: 0,
      sampleFrames: everyFrame ? null : frames,
    };
    report.totalFrames += timing.frames;
    for (const frame of frames) {
      const time = frame / timeline.fps,
        metadata = {
          scene: timing.id,
          frame: cursor + frame,
          time: (cursor + frame) / timeline.fps,
        };
      audit.beginFrame(metadata);
      if (index < 0) drawBrandIntro(audit.ctx, time);
      else
        drawFrame(
          audit.ctx,
          lesson,
          lesson.scenes[index],
          frameState(timing, time, index, lesson.scenes.length),
          draw,
        );
      const result = audit.finishFrame();
      report.checkedFrames++;
      report.checkedLabels += result.checkedLabels;
      report.skippedLabels += result.skippedLabels;
      summary.checkedLabels += result.checkedLabels;
      summary.skippedLabels += result.skippedLabels;
      if (!result.passed) {
        report.issueFrames++;
        summary.issueFrames++;
      }
      for (const issue of result.issues) {
        const key = JSON.stringify([timing.id, issue.text, issue.font, issue.foreground]);
        const previous = findings.get(key);
        if (previous) {
          previous.lastFrame = issue.frame;
          previous.lastTime = issue.time;
          previous.occurrences++;
        } else
          findings.set(key, {
            ...issue,
            firstFrame: issue.frame,
            lastFrame: issue.frame,
            firstTime: issue.time,
            lastTime: issue.time,
            occurrences: 1,
          });
      }
    }
    cursor += timing.frames;
    report.scenes.push(summary);
    console.log(
      `${id}/${timing.id}: text ink ${frames.length} ${everyFrame ? 'frames' : 'samples'}, ${summary.issueFrames} issue frames`,
    );
  }
  report.elapsedSeconds = (performance.now() - started) / 1000;
  report.millisecondsPerFrame = (report.elapsedSeconds * 1000) / report.checkedFrames;
  report.issues = [...findings.values()];
  report.passed =
    report.issueFrames === 0 &&
    report.checkedFrames > 0 &&
    (!everyFrame || report.checkedFrames === report.totalFrames);
  const currentSource = hash(
    Buffer.concat(
      await Promise.all(
        [join(here, 'lessons', `${id}.lesson.yaml`), moduleFile].map((file) => readFile(file)),
      ),
    ),
  );
  if (currentSource !== authorSourceSha256)
    throw new Error(`${id}: authored source changed during text audit`);
  if (actual) {
    const folder = join(input, id);
    if (
      (await sourceFingerprint(id, provenance.receipt.ttsAdapter)) !==
        provenance.sourceFingerprint ||
      (await hashFile(join(folder, `${id}.mp4`))) !== provenance.videoSha256 ||
      (await hashFile(join(folder, 'timeline.json'))) !== provenance.timelineSha256 ||
      (await hashFile(join(folder, 'verification.json'))) !== provenance.receiptSha256
    )
      throw new Error(`${id}: rendered inputs changed during text audit`);
    if (Math.round(timeline.duration * timeline.fps) !== report.totalFrames)
      throw new Error(`${id}: measured frame coverage differs`);
  }
  const folder = actual ? join(input, id) : join(input, 'previews', id);
  await mkdir(folder, { recursive: true });
  const target = join(folder, 'text-ink-audit.json'),
    temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
  await rename(temporary, target);
  console.log(
    `${id}: ${report.passed ? 'PASS' : 'FAIL'} ${report.checkedFrames}/${report.totalFrames} frames, ${report.checkedLabels} checked labels, ${report.issues.length} distinct findings; ${report.millisecondsPerFrame.toFixed(1)} ms/frame; ${target}`,
  );
  return report;
}

function registerFonts() {
  registerLessonFonts();
}

async function main() {
  const args = process.argv.slice(2),
    allowed = new Set(['--lesson', '--input', '--actual', '--every-frame', '--all', '--validate']);
  const value = (flag) => {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  for (const arg of args.filter((arg) => arg.startsWith('--')))
    if (!allowed.has(arg)) throw new Error(`Unknown option ${arg}`);
  const chosen = value('--lesson'),
    input = value('--input'),
    actual = args.includes('--actual'),
    everyFrame = args.includes('--every-frame');
  if (!chosen && !args.includes('--all')) throw new Error('Use --lesson ID or --all');
  registerFonts();
  const lessons = await discoverLessons(undefined, undefined, { lessonId: chosen });
  let failed = false;
  for (const lesson of lessons) {
    const report = await auditTextInkLesson(lesson.id, { input, actual, everyFrame });
    failed ||= !report.passed;
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
