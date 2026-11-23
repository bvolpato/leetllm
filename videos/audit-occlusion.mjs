#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, rename } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { drawFrame } from './lib/scene.mjs';
import { drawBrandIntro } from './lib/brand.mjs';
import { readLesson, makeSceneTimeline, frameState } from './lib/lesson.mjs';
import { aggregateOcclusion, AGGREGATE_OCCLUSION_RULE } from './lib/aggregate-occlusion.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { renderEngineBytes } from './lib/render-engine.mjs';
import { canvasLessonImplementation } from './lib/lesson-production.mjs';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..');
const args = process.argv.slice(2),
  value = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index < 0 ? fallback : args[index + 1];
  };
const sampled = args.includes('--validate'),
  input = resolve(root, value('--input', 'build/videos'));
const chosen = value('--lesson'),
  hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

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
  return hash(
    Buffer.concat([
      ...(await Promise.all(files.map((file) => readFile(join(here, file))))),
      renderEngineBytes(),
      adapterBytes,
    ]),
  );
}

async function main() {
  if (!chosen && !args.includes('--all')) throw new Error('Use --lesson ID or --all');
  registerLessonFonts();
  const toolSha256 = hash(
    Buffer.concat(
      await Promise.all(
        ['audit-occlusion.mjs', 'lib/aggregate-occlusion.mjs'].map((file) =>
          readFile(join(here, file)),
        ),
      ),
    ),
  );
  const files = (await readdir(join(here, 'lessons')))
    .filter(
      (file) => file.endsWith('.lesson.yaml') && (!chosen || file === `${chosen}.lesson.yaml`),
    )
    .sort();
  if (!files.length) throw new Error(`Lesson not found: ${chosen}`);
  let failed = false;
  for (const file of files) {
    const lesson = await readLesson(join(here, 'lessons', file), root),
      id = lesson.id;
    const { draw, validateModel } = canvasLessonImplementation(
      await import(pathToFileURL(join(here, 'animations', `${id}.mjs`)).href),
      lesson,
    );
    validateModel?.();
    let timeline,
      receipt,
      videoSha256 = null,
      fingerprint = null;
    if (sampled) {
      timeline = {
        fps: 30,
        scenes: lesson.scenes.map((scene) =>
          makeSceneTimeline(
            scene,
            scene.beats.map((beat) => beat.say.split(/\s+/).length / 2.5),
            30,
          ),
        ),
      };
    } else {
      receipt = JSON.parse(await readFile(join(input, id, 'verification.json')));
      timeline = JSON.parse(await readFile(join(input, id, 'timeline.json')));
      videoSha256 = hash(await readFile(join(input, id, `${id}.mp4`)));
      if (videoSha256 !== receipt.sha256)
        throw new Error(`${id}: movie checksum differs from receipt`);
      fingerprint = await sourceFingerprint(id, receipt);
      if (fingerprint !== receipt.fingerprint)
        throw new Error(`${id}: current sources differ from rendered movie`);
      if (timeline.id !== id || timeline.scenes.length !== lesson.scenes.length)
        throw new Error(`${id}: timeline differs from lesson`);
      if (
        hash(await readFile(join(input, id, 'timeline.json'))) !==
        receipt.artifactSha256['timeline.json']
      )
        throw new Error(`${id}: measured timeline checksum differs from receipt`);
    }
    const report = {
      version: 1,
      mode: sampled ? 'sampled' : 'all-frames',
      id,
      videoSha256,
      sourceFingerprint: fingerprint,
      toolSha256,
      frames: 0,
      expectedFrames: 0,
      issueFrames: 0,
      passed: false,
      rule: AGGREGATE_OCCLUSION_RULE,
      issues: [],
    };
    const canvas = createCanvas(960, 540),
      findings = new Map();
    const observe = (scene, frame, time, audit) => {
      const issues = aggregateOcclusion(audit);
      report.frames++;
      if (issues.length) report.issueFrames++;
      for (const issue of issues) {
        const key = JSON.stringify([scene, issue.text, issue.labelOrder]);
        const previous = findings.get(key);
        if (previous) {
          previous.lastFrame = frame;
          previous.lastTime = time;
          previous.occurrences++;
          if (issue.coveredInkFraction > previous.coveredInkFraction)
            Object.assign(previous, issue);
        } else
          findings.set(key, {
            ...issue,
            scene,
            firstFrame: frame,
            lastFrame: frame,
            firstTime: time,
            lastTime: time,
            occurrences: 1,
          });
      }
    };
    if (!sampled && timeline.intro) {
      report.expectedFrames += timeline.intro.frames;
      for (let frame = 0; frame < timeline.intro.frames; frame++) {
        observe(
          timeline.intro.id,
          report.frames,
          frame / timeline.fps,
          drawBrandIntro(canvas.getContext('2d'), frame / timeline.fps),
        );
      }
    }
    for (const [index, timing] of timeline.scenes.entries()) {
      const scene = lesson.scenes[index];
      if (timing.id !== scene.id || !Number.isInteger(timing.frames) || timing.frames <= 0)
        throw new Error(`${id}: invalid scene timeline`);
      const times = sampled
        ? timing.beats.flatMap((beat) =>
            [0.02, 0.25, 0.5, 0.75, 0.98].map((p) => beat.start + (beat.until - beat.start) * p),
          )
        : Array.from({ length: timing.frames }, (_, frame) => frame / timeline.fps);
      report.expectedFrames += times.length;
      for (const time of times) {
        const state = frameState(timing, time, index, lesson.scenes.length);
        observe(
          scene.id,
          report.frames,
          (timing.start ?? 0) + time,
          drawFrame(canvas.getContext('2d'), lesson, scene, state, draw),
        );
      }
      console.log(
        `${id}/${scene.id}: aggregate occlusion audited ${times.length} ${sampled ? 'samples' : 'frames'}`,
      );
    }
    report.issues = [...findings.values()];
    report.passed = report.frames === report.expectedFrames && report.issueFrames === 0;
    if (!sampled) {
      if (Math.round(timeline.duration * timeline.fps) !== report.frames)
        throw new Error(`${id}: measured frame coverage differs`);
      if ((await sourceFingerprint(id, receipt)) !== fingerprint)
        throw new Error(`${id}: source changed during audit`);
      if (hash(await readFile(join(input, id, `${id}.mp4`))) !== videoSha256)
        throw new Error(`${id}: movie changed during audit`);
    }
    const folder = sampled ? join(input, 'previews', id) : join(input, id);
    await mkdir(folder, { recursive: true });
    const target = join(
      folder,
      sampled ? 'aggregate-occlusion-sampled.json' : 'aggregate-occlusion.json',
    );
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(report, null, 2));
    await rename(temporary, target);
    console.log(
      `${id}: ${report.passed ? 'PASS' : 'FAIL'} ${report.frames}/${report.expectedFrames}; ${report.issueFrames} issue frames; ${target}`,
    );
    failed ||= !report.passed;
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
