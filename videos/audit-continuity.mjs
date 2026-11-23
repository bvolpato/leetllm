#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from './lib/lesson.mjs';
import { drawFrame } from './lib/scene.mjs';
import { discoverLessons } from './catalog.mjs';
import { renderEngineBytes, renderEngineProvenance } from './lib/render-engine.mjs';
import { canvasLessonImplementation, productionSourceManifest } from './lib/lesson-production.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const CONTINUITY_VISIBLE_OPACITY = 0.25;
const visible = (item) =>
  (item.alpha ?? 1) * Math.max(item.fillAlpha ?? 1, item.strokeAlpha ?? 0) >=
  CONTINUITY_VISIBLE_OPACITY;
const quantize = (value) => Math.round(value / 4) * 4;

export function continuityObjects(frame) {
  const labels = (frame.labels ?? [])
    .filter((label) => visible(label) && label.text?.trim())
    .map((label) => ({
      key: `label:${label.text}`,
      kind: 'label',
      text: label.text,
      bounds: { x: label.x, y: label.y, width: label.width, height: label.height },
    }));
  const shapes = (frame.shapes ?? [])
    .filter((shape) => visible(shape) && shape.width * shape.height >= 600)
    .map((shape) => ({
      key: `shape:${shape.kind}:${[shape.x, shape.y, shape.width, shape.height].map(quantize).join(':')}`,
      kind: 'shape',
      bounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
    }));
  return [...labels, ...shapes];
}

function byKey(objects) {
  const map = new Map();
  for (const object of objects) {
    const values = map.get(object.key) ?? [];
    values.push(object);
    map.set(object.key, values);
  }
  return map;
}

export function continuityReplayCandidate(before, early, after) {
  if (!early.length) throw new Error('Continuity audit requires early probes');
  const previous = byKey(continuityObjects(before)),
    next = byKey(continuityObjects(after));
  const probes = early.map((frame) => byKey(continuityObjects(frame))),
    missing = [];
  let shared = 0;
  for (const [key, objects] of previous) {
    const retained = Math.min(objects.length, next.get(key)?.length ?? 0);
    shared += retained;
    const visibleAtEitherProbe = Math.max(...probes.map((probe) => probe.get(key)?.length ?? 0));
    for (let index = visibleAtEitherProbe; index < retained; index++) missing.push(objects[index]);
  }
  const missingLabels = missing.filter((item) => item.kind === 'label').length;
  const missingArea = missing.reduce(
    (sum, item) => sum + item.bounds.width * item.bounds.height,
    0,
  );
  const candidate =
    missing.length >= 3 || (missingLabels > 0 && missing.length >= 2 && missingArea >= 8000);
  return {
    candidate,
    sharedObjects: shared,
    missingObjects: missing.length,
    missingLabels,
    missingArea,
    missing,
  };
}

async function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const toolSha256 = hash(await fs.readFile(fileURLToPath(import.meta.url)));
  const frameworkFiles = ['scene.mjs', 'lesson.mjs', 'narration-cues.mjs'];
  const frameworkHash = async () =>
    hash(
      Buffer.concat([
        ...(await Promise.all(
          frameworkFiles.map((file) => fs.readFile(path.join(root, 'videos/lib', file))),
        )),
        renderEngineBytes(),
      ]),
    );
  const frameworkSha256 = await frameworkHash();
  const options = {
    input: 'build/video-worldclass-current-20261023',
    output: 'build/video-continuity-audit.json',
    lessons: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help') {
      console.log(
        'node videos/audit-continuity.mjs --lesson ID | --all [--input DIR] [--output FILE]',
      );
      return;
    }
    if (flag === '--all') {
      options.all = true;
      continue;
    }
    if (
      !['--input', '--output', '--lesson'].includes(flag) ||
      !argv[i + 1] ||
      argv[i + 1].startsWith('--')
    )
      throw new Error(`Invalid continuity option: ${flag}`);
    const value = argv[++i];
    if (flag === '--lesson') options.lessons.push(value);
    else options[flag.slice(2)] = value;
  }
  const catalog = options.all
    ? await discoverLessons(path.join(root, 'videos'), root)
    : (
        await Promise.all(
          [...new Set(options.lessons)].map((lessonId) =>
            discoverLessons(path.join(root, 'videos'), root, { lessonId }),
          ),
        )
      ).flat();
  const ids = options.all ? catalog.map((row) => row.id) : options.lessons;
  if (!ids.length) throw new Error('Choose --lesson ID or --all');
  for (const id of ids)
    if (!catalog.some((row) => row.id === id)) throw new Error(`Unknown lesson: ${id}`);
  registerLessonFonts();
  const input = path.resolve(root, options.input),
    output = path.resolve(root, options.output),
    lessons = [];
  for (const id of [...new Set(ids)]) {
    const markup = path.join(root, 'videos/lessons', `${id}.lesson.yaml`),
      animation = path.join(root, 'videos/animations', `${id}.mjs`);
    const timelineFile = path.join(input, id, 'timeline.json');
    let timelineBytes;
    try {
      timelineBytes = await fs.readFile(timelineFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      lessons.push({ id, status: 'skipped', reason: 'Measured timeline unavailable' });
      continue;
    }
    const lesson = await readLesson(markup, root),
      timeline = JSON.parse(timelineBytes),
      sourceBytes = await fs.readFile(animation);
    const sourceManifest = await productionSourceManifest({ root, id });
    const markupBytes = await fs.readFile(markup),
      { draw, validateModel } = canvasLessonImplementation(
        await import(`${pathToFileURL(animation).href}?continuity=${hash(sourceBytes)}`),
        lesson,
      );
    await validateModel?.();
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d'),
      boundaries = [],
      skipped = [];
    for (const [index, scene] of lesson.scenes.entries()) {
      const timing = timeline.scenes.find((item) => item.id === scene.id);
      if (
        !timing ||
        timing.beats.length !== scene.beats.length ||
        timing.beats.some((beat, i) => beat.say !== scene.beats[i].say)
      ) {
        skipped.push({ scene: scene.id, reason: 'Current script does not match measured timing' });
        continue;
      }
      const probe = (beat, progress) => {
        const time = beat.start + (beat.until - beat.start) * progress;
        return drawFrame(
          ctx,
          lesson,
          scene,
          frameState(timing, time, index, lesson.scenes.length),
          draw,
        );
      };
      for (let beat = 1; beat < timing.beats.length; beat++) {
        const previous = timing.beats[beat - 1],
          current = timing.beats[beat];
        const result = continuityReplayCandidate(
          probe(previous, 0.95),
          [probe(current, 0.02), probe(current, 0.12)],
          probe(current, 0.95),
        );
        if (result.candidate)
          boundaries.push({
            scene: scene.id,
            beat: beat + 1,
            time: timing.start + current.start,
            narration: scene.beats[beat].say,
            ...result,
          });
      }
    }
    if (
      hash(await fs.readFile(animation)) !== hash(sourceBytes) ||
      hash(await fs.readFile(markup)) !== hash(markupBytes) ||
      hash(await fs.readFile(timelineFile)) !== hash(timelineBytes) ||
      (await productionSourceManifest({ root, id })).fingerprint !== sourceManifest.fingerprint
    )
      throw new Error(`Inputs changed during continuity audit: ${id}`);
    lessons.push({
      id,
      status: 'reviewed',
      sourceManifest,
      animationSha256: hash(sourceBytes),
      markupSha256: hash(markupBytes),
      timelineSha256: hash(timelineBytes),
      boundaries,
      skipped,
    });
    console.log(
      JSON.stringify({ id, candidates: boundaries.length, skippedScenes: skipped.length }),
    );
  }
  if (
    hash(await fs.readFile(fileURLToPath(import.meta.url))) !== toolSha256 ||
    (await frameworkHash()) !== frameworkSha256
  )
    throw new Error('Continuity tool or rendering framework changed during audit');
  const report = {
    version: 2,
    toolSha256,
    frameworkSha256,
    minimumVisibleOpacity: CONTINUITY_VISIBLE_OPACITY,
    renderEngine: renderEngineProvenance(),
    scope:
      'Source-rendered measured beat-boundary probes at95% before,2%/12% early and95% after. Retained context at25% opacity remains present, including narration-focus dimming. Flags established labels or substantial geometry that disappear at both early probes and reappear later. These are editorial review candidates; an intentional reset or comparison can be valid. This does not replace encoded-frame inspection.',
    lessons,
  };
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
