#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverLessons } from './catalog.mjs';
import { readLesson, makeSceneTimeline } from './lib/lesson.mjs';
import { auditSceneReveals, REVEAL_AUDIT_RULE, REVEAL_AUDIT_SCOPE } from './lib/reveal-audit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function registerFonts() {
  registerLessonFonts();
}

function validateTimeline(lesson, timeline) {
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
      const sourceBeat = scene.beats[beatIndex];
      if (
        beat.say !== sourceBeat.say ||
        (beat.hold ?? 0.45) !== (sourceBeat.hold ?? 0.45) ||
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

function estimatedTimeline(lesson) {
  const fps = 30;
  let cursor = 0;
  const scenes = lesson.scenes.map((scene) => {
    const durations = scene.beats.map((beat) => beat.say.trim().split(/\s+/).length / 2.5);
    const timing = makeSceneTimeline(scene, durations, fps);
    timing.start = cursor;
    cursor += timing.duration;
    return timing;
  });
  return { id: lesson.id, fps, width: 1920, height: 1080, duration: cursor, scenes };
}

async function loadTimeline(lesson, input) {
  const file = join(input, lesson.id, 'timeline.json');
  try {
    const bytes = await readFile(file);
    const timeline = JSON.parse(bytes);
    validateTimeline(lesson, timeline);
    return {
      timeline,
      timingSource: 'measured-baseline',
      timelineSha256: hash(bytes),
      timelinePath: file,
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const timeline = estimatedTimeline(lesson);
    validateTimeline(lesson, timeline);
    return {
      timeline,
      timingSource: 'estimated',
      timelineSha256: hash(Buffer.from(JSON.stringify(timeline))),
      timelinePath: null,
    };
  }
}

export async function auditRevealLesson(id, { input = 'build/video-complete-curriculum' } = {}) {
  const lessonFile = join(here, 'lessons', `${id}.lesson.yaml`);
  const moduleFile = join(here, 'animations', `${id}.mjs`);
  const lessonBytes = await readFile(lessonFile),
    animationBytes = await readFile(moduleFile);
  const lesson = await readLesson(lessonFile, root);
  const provenance = await loadTimeline(lesson, resolve(root, input));
  const imported = await import(
    `${pathToFileURL(moduleFile).href}?reveal-audit=${hash(animationBytes)}`
  );
  if (typeof imported.draw !== 'function') throw new Error(`${id}: missing draw function`);
  imported.validateModel?.();

  const width = provenance.timeline.width ?? 960;
  const height = provenance.timeline.height ?? 540;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new Error(`${id}: invalid timeline canvas dimensions`);
  // This audit reads draw-time text and alpha, not raster visibility. A quarter-size
  // native canvas reduces fill cost while drawFrame keeps its logical 1920x1080 space.
  const canvas = createCanvas(Math.min(width, 480), Math.min(height, 270));
  const scenes = [];
  for (const [sceneIndex, timing] of provenance.timeline.scenes.entries()) {
    const scene = lesson.scenes[sceneIndex];
    const result = auditSceneReveals({
      canvas,
      lesson,
      scene,
      timing,
      draw: imported.draw,
      sceneIndex,
      sceneCount: lesson.scenes.length,
      sceneStart: timing.start ?? 0,
    });
    const sampleTimes = new Map(result.samples.map((sample) => [sample.sampleId, sample.time]));
    const samplesById = new Map(result.samples.map((sample) => [sample.sampleId, sample]));
    const warnings = result.warnings.map((warning) => ({
      ...warning,
      sampleTimes: warning.sampleIds.map((sampleId) => sampleTimes.get(sampleId)),
      sampleProgress: warning.sampleIds.map((sampleId) => samplesById.get(sampleId)?.progress),
    }));
    scenes.push({
      scene: scene.id,
      timingSource: provenance.timingSource,
      sampledFrames: result.sampledFrames,
      fillTextCalls: result.fillTextCalls,
      distinctStableText: result.distinctStableText,
      warnings,
      lowAlphaCandidates: result.lowAlphaCandidates,
    });
  }

  const currentLessonBytes = await readFile(lessonFile),
    currentAnimationBytes = await readFile(moduleFile);
  if (
    hash(currentLessonBytes) !== hash(lessonBytes) ||
    hash(currentAnimationBytes) !== hash(animationBytes)
  ) {
    throw new Error(`${id}: authored source changed during reveal audit`);
  }
  if (
    provenance.timelinePath &&
    hash(await readFile(provenance.timelinePath)) !== provenance.timelineSha256
  ) {
    throw new Error(`${id}: baseline timeline changed during reveal audit`);
  }
  const warnings = scenes.flatMap((scene) =>
    scene.warnings.map((warning) => ({ ...warning, scene: scene.scene })),
  );
  return {
    id,
    title: lesson.title,
    source: lesson.source,
    rule: REVEAL_AUDIT_RULE,
    scope: REVEAL_AUDIT_SCOPE,
    samplingCanvas: { width: canvas.width, height: canvas.height },
    lessonSha256: hash(lessonBytes),
    animationSha256: hash(animationBytes),
    timingSource: provenance.timingSource,
    timelineSha256: provenance.timelineSha256,
    scenes,
    warnings,
    lowAlphaCandidates: scenes.flatMap((scene) =>
      scene.lowAlphaCandidates.map((candidate) => ({ ...candidate, scene: scene.scene })),
    ),
    lowAlphaScope:
      'Review candidates with at least three distinct native text labels below 25% global opacity at middle or late beat samples. Intentional transitions require visual judgment. This does not measure color contrast, raster legibility, math paths, or SVG.',
  };
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
    ]);
  const value = (flag) => {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  for (const arg of args.filter((arg) => arg.startsWith('--')))
    if (!allowed.has(arg)) throw new Error(`Unknown option ${arg}`);
  const lessonId = value('--lesson'),
    input = value('--input') ?? 'build/video-complete-curriculum',
    output = value('--output');
  if (!lessonId && !args.includes('--all')) throw new Error('Use --lesson ID or --all');
  registerFonts();
  const toolFiles = ['audit-reveals.mjs', 'lib/reveal-audit.mjs'];
  const toolSha256 = hash(
    Buffer.concat(await Promise.all(toolFiles.map((file) => readFile(join(here, file))))),
  );
  const catalog = await discoverLessons(undefined, undefined, { lessonId });
  const report = {
    version: 1,
    mode: args.includes('--validate') ? 'sampled-validation' : 'sampled-diagnostic',
    generatedAt: null,
    toolSha256,
    rule: REVEAL_AUDIT_RULE,
    scope: REVEAL_AUDIT_SCOPE,
    input: resolve(root, input),
    lessons: [],
    errors: [],
  };
  for (const { id } of catalog) {
    try {
      const lessonReport = await auditRevealLesson(id, { input });
      report.lessons.push(lessonReport);
      const count = lessonReport.warnings.length;
      console.error(
        `${id}: ${lessonReport.timingSource}; ${count} reveal warning${count === 1 ? '' : 's'}`,
      );
    } catch (error) {
      report.errors.push({ id, message: error.message });
      console.error(`${id}: ERROR ${error.message}`);
    }
  }
  const finalToolSha256 = hash(
    Buffer.concat(await Promise.all(toolFiles.map((file) => readFile(join(here, file))))),
  );
  if (finalToolSha256 !== toolSha256)
    report.errors.push({
      id: 'audit-tool',
      message: 'Reveal-audit source changed during execution',
    });
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
    console.error(`Reveal audit report: ${target}`);
  } else console.log(JSON.stringify(report, null, 2));
  if (revealAuditExitCode(report, args.includes('--fail-on-warnings')) !== 0) process.exitCode = 1;
}

export function revealAuditExitCode(report, failOnWarnings = false) {
  const errors = report.errors?.length ?? report.errorCount ?? 0;
  const warnings =
    report.warningCount ??
    report.lessons?.reduce((sum, lesson) => sum + (lesson.warnings?.length ?? 0), 0) ??
    0;
  return errors > 0 || (failOnWarnings && warnings > 0) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
