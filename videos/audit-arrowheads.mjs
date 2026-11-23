#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverLessons } from './catalog.mjs';
import { readLesson, makeSceneTimeline, frameState } from './lib/lesson.mjs';
import { drawFrame } from './lib/scene.mjs';
import { resolveSceneCues } from './lib/narration-cues.mjs';
import { validateLabelTimeline } from './audit-labels.mjs';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import { canvasLessonImplementation, productionSourceManifest } from './lib/lesson-production.mjs';
import { renderEngineProvenance } from './lib/render-engine.mjs';
import {
  findArrowheadOcclusions,
  ARROWHEAD_OCCLUSION_RULE,
  ARROWHEAD_OCCLUSION_SCOPE,
} from './lib/arrowhead-occlusion.mjs';
import {
  createClosedPathCapture,
  auditArrowheadClosedPaths,
  ARROWHEAD_PATH_RULE,
  ARROWHEAD_PATH_SCOPE,
} from './lib/arrowhead-path-intersections.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const toolFiles = ['audit-arrowheads.mjs', 'lib/arrowhead-occlusion.mjs', 'audit-labels.mjs'];
const toolHash = async (closedPaths) =>
  hash(
    Buffer.concat(
      await Promise.all(
        [...toolFiles, ...(closedPaths ? ['lib/arrowhead-path-intersections.mjs'] : [])].map(
          (file) => readFile(join(here, file)),
        ),
      ),
    ),
  );

export function arrowheadDiagnostics(audit, { closedPaths = false, strokes } = {}) {
  const warnings = findArrowheadOcclusions(audit);
  if (!closedPaths) return { warnings };
  const paths = auditArrowheadClosedPaths(audit, strokes);
  return { warnings: [...warnings, ...paths.candidates], unsupported: paths.unsupported };
}

export function validateArrowheadTimeline(lesson, timeline, measured = true) {
  validateLabelTimeline(lesson, timeline);
  if (measured)
    for (const [i, scene] of lesson.scenes.entries()) {
      const timing = timeline.scenes[i];
      if (JSON.stringify(resolveSceneCues(scene, timing)) !== JSON.stringify(timing.visualCues)) {
        throw new Error(`${lesson.id}/${scene.id}: stale measured visual cues`);
      }
    }
}

export function arrowheadSampleFrames(timing, fps, allFrames = false) {
  if (allFrames) return Array.from({ length: timing.frames }, (_, i) => i);
  const times = timing.beats.flatMap((beat) =>
    [0.12, 0.5, 0.88].map((p) => beat.start + (beat.until - beat.start) * p),
  );
  for (const cue of timing.visualCues ?? [])
    times.push(cue.start - 1 / fps, (cue.start + cue.end) / 2, cue.end + 1 / fps);
  return [
    ...new Set(
      times.map((time) => Math.max(0, Math.min(timing.frames - 1, Math.round(time * fps)))),
    ),
  ].sort((a, b) => a - b);
}

async function loadTimeline(lesson, input, estimated) {
  const file = join(input, lesson.id, 'timeline.json');
  if (!estimated) {
    let bytes;
    try {
      bytes = await readFile(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (bytes) {
      const timeline = JSON.parse(bytes);
      validateArrowheadTimeline(lesson, timeline);
      return {
        timeline,
        timingSource: 'measured-provider-words',
        timelinePath: file,
        timelineSha256: hash(bytes),
      };
    }
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
  const timeline = { id: lesson.id, fps, duration: cursor, scenes };
  validateArrowheadTimeline(lesson, timeline, false);
  return {
    timeline,
    timingSource: 'estimated-word-count',
    timelinePath: null,
    timelineSha256: hash(Buffer.from(JSON.stringify(timeline))),
  };
}

export async function auditArrowheadLesson(
  id,
  {
    input = 'build/video-complete-curriculum',
    estimated = false,
    allFrames = false,
    closedPaths = false,
  } = {},
) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('Supply a valid lesson ID');
  const lessonPath = join(here, 'lessons', `${id}.lesson.yaml`),
    animationPath = join(here, 'animations', `${id}.mjs`);
  const lesson = await readLesson(lessonPath, root),
    provenance = await loadTimeline(lesson, resolve(root, input), estimated);
  const lessonSha256 = hash(await readFile(lessonPath)),
    animationSha256 = hash(await readFile(animationPath));
  const module = await import(
    `${pathToFileURL(animationPath).href}?arrowhead-audit=${animationSha256}`
  );
  const { draw, validateModel } = canvasLessonImplementation(module, lesson);
  await validateModel?.();
  let authority = provenance.timeline;
  if (provenance.timelinePath) {
    try {
      const receipt = JSON.parse(
        await readFile(join(resolve(root, input), id, 'verification.json')),
      );
      if (receipt.sourceManifest !== undefined) authority = receipt;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (authority === provenance.timeline && module.default?.kind === 'leetllm.canvas-lesson') {
    const sourceManifest = await productionSourceManifest({ root, id });
    authority = {
      id,
      sourceManifest,
      fingerprint: sourceManifest.fingerprint,
      renderEngine: sourceManifest.renderEngine,
    };
  }
  const before = await currentSourceFingerprint(root, id, authority),
    engine = renderEngineProvenance();
  const canvas = createCanvas(1920, 1080),
    scenes = [],
    capture = closedPaths ? createClosedPathCapture(canvas.getContext('2d')) : null;
  try {
    for (const [index, timing] of provenance.timeline.scenes.entries()) {
      const samples = [],
        warnings = [],
        unsupported = [];
      for (const frame of arrowheadSampleFrames(timing, provenance.timeline.fps, allFrames)) {
        const localTime = frame / provenance.timeline.fps;
        try {
          const audit = drawFrame(
            capture?.context ?? canvas.getContext('2d'),
            lesson,
            lesson.scenes[index],
            frameState(timing, localTime, index, lesson.scenes.length),
            draw,
          );
          const diagnostics = arrowheadDiagnostics(audit, {
              closedPaths,
              strokes: capture?.strokes,
            }),
            sample = { frame, localTime, time: timing.start + localTime };
          samples.push({
            ...sample,
            arrows: audit.connectors.filter((c) => c.kind === 'arrow' || c.kind === 'connect')
              .length,
            candidates: diagnostics.warnings.length,
            ...(closedPaths ? { unsupported: diagnostics.unsupported.length } : {}),
          });
          warnings.push(...diagnostics.warnings.map((candidate) => ({ ...candidate, ...sample })));
          if (closedPaths)
            unsupported.push(...diagnostics.unsupported.map((issue) => ({ ...issue, ...sample })));
        } finally {
          capture?.reset();
        }
      }
      scenes.push({
        scene: timing.id,
        checkedFrames: samples.length,
        samples,
        warnings,
        ...(closedPaths ? { unsupported } : {}),
      });
    }
  } finally {
    capture?.dispose();
  }
  if (
    before !== (await currentSourceFingerprint(root, id, authority)) ||
    engine.runtimeSha256 !== renderEngineProvenance().runtimeSha256
  )
    throw new Error(`${id}: render source or runtime changed during audit`);
  if (
    provenance.timelinePath &&
    provenance.timelineSha256 !== hash(await readFile(provenance.timelinePath))
  )
    throw new Error(`${id}: measured timeline changed during audit`);
  return {
    id,
    title: lesson.title,
    sourceFingerprint: before,
    runtime: engine,
    lessonSha256,
    animationSha256,
    ...(authority.sourceManifest ? { sourceManifest: authority.sourceManifest } : {}),
    timingSource: provenance.timingSource,
    timelinePath: provenance.timelinePath,
    timelineSha256: provenance.timelineSha256,
    coverage: allFrames ? 'all-authored-source-frames' : 'sampled-authored-source-frames',
    checkedFrames: scenes.reduce((n, scene) => n + scene.checkedFrames, 0),
    scenes,
    warnings: scenes.flatMap((scene) =>
      scene.warnings.map((warning) => ({ ...warning, scene: scene.scene })),
    ),
    ...(closedPaths
      ? {
          unsupported: scenes.flatMap((scene) =>
            scene.unsupported.map((issue) => ({ ...issue, scene: scene.scene })),
          ),
        }
      : {}),
  };
}

async function main() {
  const args = process.argv.slice(2),
    allowed = new Set([
      '--lesson',
      '--all',
      '--input',
      '--output',
      '--estimated',
      '--all-frames',
      '--closed-paths',
      '--fail-on-warnings',
      '--help',
    ]);
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'Usage: node videos/audit-arrowheads.mjs (--lesson ID | --all) [--input DIR | --estimated] [--all-frames] [--closed-paths] [--output FILE] [--fail-on-warnings]',
    );
    console.log(
      'Default: sample beat 12/50/88% and measured cue before/mid/held frames. Missing timelines use declared estimates. --all-frames covers authored scenes; brand and encoded pixels are excluded.',
    );
    console.log(
      '--closed-paths adds an independent geometric intersection diagnostic for closed round-stroked paths, including earlier paint. Unsupported paths are reported and fail --fail-on-warnings.',
    );
    return;
  }
  const value = (flag) => {
    const i = args.indexOf(flag);
    if (i < 0) return undefined;
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${flag} requires a value`);
    return args[i + 1];
  };
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unknown option ${args[i]}`);
    if (['--lesson', '--input', '--output'].includes(args[i])) {
      value(args[i]);
      i++;
    }
  }
  const lessonId = value('--lesson'),
    input = value('--input') ?? 'build/video-complete-curriculum',
    output = value('--output');
  if ((!lessonId && !args.includes('--all')) || (lessonId && args.includes('--all')))
    throw new Error('Use --lesson ID or --all');
  if (args.includes('--estimated') && args.includes('--input'))
    throw new Error('Use --input for measured timelines or --estimated');
  registerLessonFonts();
  const closedPaths = args.includes('--closed-paths'),
    toolSha256 = await toolHash(closedPaths),
    catalog = await discoverLessons(undefined, undefined, { lessonId });
  const report = {
    version: 1,
    rule: ARROWHEAD_OCCLUSION_RULE,
    scope: ARROWHEAD_OCCLUSION_SCOPE,
    sampling: args.includes('--all-frames')
      ? 'Every authored source frame at the declared timeline FPS.'
      : 'Beat 12/50/88% plus measured cue before/mid/held frames, rounded to the timeline frame grid.',
    limitations:
      'Measured reports use provider word cues. Estimated reports use word-count durations and fallback animation progress. Neither mode establishes encoded-video appearance, listening approval or every-frame human review.',
    ...(closedPaths
      ? { closedPaths: { rule: ARROWHEAD_PATH_RULE, scope: ARROWHEAD_PATH_SCOPE } }
      : {}),
    toolSha256,
    lessons: [],
    errors: [],
  };
  for (const { id } of catalog) {
    try {
      const result = await auditArrowheadLesson(id, {
        input,
        estimated: args.includes('--estimated'),
        allFrames: args.includes('--all-frames'),
        closedPaths,
      });
      report.lessons.push(result);
      console.error(
        `${id}: ${result.timingSource}; ${result.checkedFrames} ${result.coverage}; ${result.warnings.length} ${closedPaths ? 'arrowhead geometric candidates; ' + result.unsupported.length + ' unsupported closed paths' : 'covered-arrowhead candidates'}`,
      );
    } catch (error) {
      report.errors.push({ id, message: error.message });
      console.error(`${id}: ERROR ${error.message}`);
    }
  }
  if (toolSha256 !== (await toolHash(closedPaths)))
    report.errors.push({
      id: 'audit-tool',
      message: 'Arrowhead audit source changed during execution',
    });
  report.errorCount = report.errors.length;
  report.warningCount = report.lessons.reduce((n, lesson) => n + lesson.warnings.length, 0);
  if (closedPaths)
    report.unsupportedCount = report.lessons.reduce(
      (n, lesson) => n + lesson.unsupported.length,
      0,
    );
  report.generatedAt = new Date().toISOString();
  if (output) {
    const target = resolve(root, output),
      temporary = `${target}.${process.pid}.tmp`;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
    await rename(temporary, target);
    console.error(`Arrowhead audit report: ${target}`);
  } else console.log(JSON.stringify(report, null, 2));
  process.exitCode =
    report.errorCount ||
    (args.includes('--fail-on-warnings') && (report.warningCount || report.unsupportedCount))
      ? 1
      : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
