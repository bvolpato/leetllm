#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverLessons } from './catalog.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { readLesson, makeSceneTimeline } from './lib/lesson.mjs';
import {
  auditSceneLabels,
  LABEL_COLLISION_RULE,
  LABEL_COLLISION_SCOPE,
  LABEL_COLLISION_ALL_FRAME_SCOPE,
} from './lib/label-collisions.mjs';
import { PAINTED_TEXT_SCOPE } from './lib/painted-text.mjs';
import { canvasLessonImplementation, productionSourceManifest } from './lib/lesson-production.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function registerFonts() {
  registerLessonFonts();
}

export function validateLabelTimeline(lesson, timeline) {
  if (
    timeline.id !== lesson.id ||
    !Number.isInteger(timeline.fps) ||
    timeline.fps < 1 ||
    timeline.fps > 60 ||
    timeline.scenes?.length !== lesson.scenes.length
  )
    throw new Error(`${lesson.id}: invalid or stale timeline`);
  for (const [index, timing] of timeline.scenes.entries()) {
    const scene = lesson.scenes[index];
    if (
      timing.id !== scene.id ||
      timing.fps !== timeline.fps ||
      !Number.isInteger(timing.frames) ||
      timing.frames < 1 ||
      !Number.isFinite(timing.start ?? 0) ||
      !Number.isFinite(timing.duration) ||
      Math.abs(timing.frames / timeline.fps - timing.duration) > 1e-7 ||
      timing.beats?.length !== scene.beats.length
    )
      throw new Error(`${lesson.id}/${scene.id}: timeline geometry differs from lesson`);
    let previousUntil = 0;
    for (const [beatIndex, beat] of timing.beats.entries()) {
      const source = scene.beats[beatIndex];
      if (
        beat.say !== source.say ||
        (beat.hold ?? 0.45) !== (source.hold ?? 0.45) ||
        ![beat.start, beat.end, beat.until].every(Number.isFinite) ||
        beat.start < previousUntil - 1e-7 ||
        beat.end < beat.start ||
        beat.until < beat.end
      ) {
        throw new Error(`${lesson.id}/${scene.id}: stale or invalid beat timing`);
      }
      previousUntil = beat.until;
    }
  }
}

async function loadTimeline(lesson, input) {
  const file = join(input, lesson.id, 'timeline.json');
  try {
    const bytes = await readFile(file),
      timeline = JSON.parse(bytes);
    validateLabelTimeline(lesson, timeline);
    return {
      timeline,
      timingSource: 'measured-baseline',
      timelineSha256: hash(bytes),
      timelinePath: file,
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let cursor = 0;
  const fps = 30,
    scenes = lesson.scenes.map((scene) => {
      const timing = makeSceneTimeline(
        scene,
        scene.beats.map((beat) => beat.say.trim().split(/\s+/).length / 2.5),
        fps,
      );
      timing.start = cursor;
      cursor += timing.duration;
      return timing;
    });
  const timeline = { id: lesson.id, fps, width: 1920, height: 1080, duration: cursor, scenes };
  validateLabelTimeline(lesson, timeline);
  return {
    timeline,
    timingSource: 'estimated',
    timelineSha256: hash(Buffer.from(JSON.stringify(timeline))),
    timelinePath: null,
  };
}

async function sourceHashes(id) {
  const files = [
    `lessons/${id}.lesson.yaml`,
    `animations/${id}.mjs`,
    'audit-labels.mjs',
    'lib/label-collisions.mjs',
    'lib/painted-text.mjs',
    'lib/scene.mjs',
    'lib/lesson.mjs',
    'lib/brand.mjs',
    'lib/frame-audit.mjs',
    'lib/layout-review.mjs',
    'package-lock.json',
    ...conceptSourceFiles(),
  ];
  const sourceManifest = await productionSourceManifest({ root, id });
  return {
    hashes: Object.fromEntries(
      await Promise.all(files.map(async (file) => [file, hash(await readFile(join(here, file)))])),
    ),
    sourceManifest,
  };
}

export async function auditLabelLesson(
  id,
  { input = 'build/video-complete-curriculum', allFrames = false, paintedText = false } = {},
) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('Supply a valid lesson ID');
  const evidence = await sourceHashes(id),
    before = evidence.hashes;
  const lesson = await readLesson(join(here, 'lessons', `${id}.lesson.yaml`), root);
  const provenance = await loadTimeline(lesson, resolve(root, input));
  const module = await import(
    `${pathToFileURL(join(here, 'animations', `${id}.mjs`)).href}?label-audit=${before[`animations/${id}.mjs`]}`
  );
  const { draw, validateModel } = canvasLessonImplementation(module, lesson);
  await validateModel?.();
  const canvas = createCanvas(1920, 1080),
    scenes = provenance.timeline.scenes.map((timing, index) =>
      auditSceneLabels({
        canvas,
        lesson,
        scene: lesson.scenes[index],
        timing,
        draw,
        sceneIndex: index,
        sceneCount: lesson.scenes.length,
        allFrames,
        paintedText,
      }),
    );
  const after = await sourceHashes(id);
  if (
    Object.keys(before).some((file) => before[file] !== after.hashes[file]) ||
    evidence.sourceManifest.fingerprint !== after.sourceManifest.fingerprint
  )
    throw new Error(`${id}: source changed during label audit`);
  if (
    provenance.timelinePath &&
    hash(await readFile(provenance.timelinePath)) !== provenance.timelineSha256
  ) {
    throw new Error(`${id}: baseline timeline changed during label audit`);
  }
  return {
    id,
    title: lesson.title,
    source: lesson.source,
    samplingCanvas: { width: 1920, height: 1080 },
    lessonSha256: before[`lessons/${id}.lesson.yaml`],
    animationSha256: before[`animations/${id}.mjs`],
    sourceHashes: before,
    sourceManifest: evidence.sourceManifest,
    timingSource: provenance.timingSource,
    timelineSha256: provenance.timelineSha256,
    timelinePath: provenance.timelinePath ? resolve(root, provenance.timelinePath) : null,
    coverage: allFrames ? 'all-authored-scene-frames' : 'sampled-authored-scene-frames',
    paintedText,
    sampledFrames: scenes.reduce((sum, scene) => sum + scene.sampledFrames, 0),
    issueFrames: scenes.reduce((sum, scene) => sum + scene.issueFrames, 0),
    scenes,
    warnings: scenes.flatMap((scene) =>
      scene.warnings.map((warning) => ({ ...warning, scene: scene.scene })),
    ),
  };
}

export function labelAuditExitCode(report, failOnWarnings = false) {
  return (report.errors?.length ?? report.errorCount ?? 0) > 0 ||
    (failOnWarnings &&
      (report.warningCount ??
        report.lessons?.reduce((sum, lesson) => sum + lesson.warnings.length, 0) ??
        0) > 0)
    ? 1
    : 0;
}

async function main() {
  const args = process.argv.slice(2),
    allowed = new Set([
      '--lesson',
      '--input',
      '--output',
      '--all',
      '--validate',
      '--fail-on-warnings',
      '--all-frames',
      '--painted-text',
    ]);
  const value = (flag) => {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!allowed.has(arg)) throw new Error(`Unknown option ${arg}`);
    if (['--lesson', '--input', '--output'].includes(arg)) {
      value(arg);
      index++;
    }
  }
  const lessonId = value('--lesson'),
    input = value('--input') ?? 'build/video-complete-curriculum',
    output = value('--output');
  if ((!lessonId && !args.includes('--all')) || (lessonId && args.includes('--all')))
    throw new Error('Use --lesson ID or --all');
  registerFonts();
  const toolFiles = ['audit-labels.mjs', 'lib/label-collisions.mjs', 'lib/painted-text.mjs'];
  const toolSha256 = hash(
    Buffer.concat(await Promise.all(toolFiles.map((file) => readFile(join(here, file))))),
  );
  const catalog = await discoverLessons(undefined, undefined, { lessonId });
  const allFrames = args.includes('--all-frames');
  const paintedText = args.includes('--painted-text');
  const report = {
    version: 1,
    mode: allFrames
      ? 'all-frames'
      : args.includes('--validate')
        ? 'sampled-validation'
        : 'sampled-diagnostic',
    rule: LABEL_COLLISION_RULE,
    scope: allFrames ? LABEL_COLLISION_ALL_FRAME_SCOPE : LABEL_COLLISION_SCOPE,
    ...(paintedText
      ? {
          paintedTextScope: PAINTED_TEXT_SCOPE,
          crowdingScope:
            'Complete paint bounds also flag readability candidates above the existing bounds-area threshold, including interleaved glyphs without shared pixels. These require visual judgment.',
        }
      : {}),
    input: resolve(root, input),
    toolSha256,
    lessons: [],
    errors: [],
  };
  for (const { id } of catalog) {
    try {
      const result = await auditLabelLesson(id, { input, allFrames, paintedText });
      report.lessons.push(result);
      console.error(
        `${id}: ${result.timingSource}; ${result.sampledFrames} native ${allFrames ? 'frames' : 'samples'}; ${result.warnings.length} label intersection candidates`,
      );
    } catch (error) {
      report.errors.push({ id, message: error.message });
      console.error(`${id}: ERROR ${error.message}`);
    }
  }
  if (
    hash(Buffer.concat(await Promise.all(toolFiles.map((file) => readFile(join(here, file)))))) !==
    toolSha256
  ) {
    report.errors.push({
      id: 'audit-tool',
      message: 'Label-audit source changed during execution',
    });
  }
  report.lessonCount = report.lessons.length;
  report.errorCount = report.errors.length;
  report.warningCount = report.lessons.reduce((sum, lesson) => sum + lesson.warnings.length, 0);
  report.generatedAt = new Date().toISOString();
  if (output) {
    const target = resolve(root, output),
      temporary = `${target}.${process.pid}.tmp`;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
    await rename(temporary, target);
    console.error(`Label audit report: ${target}`);
  } else console.log(JSON.stringify(report, null, 2));
  process.exitCode = labelAuditExitCode(report, args.includes('--fail-on-warnings'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
