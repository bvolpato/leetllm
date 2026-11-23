#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { discoverLessons } from './catalog.mjs';
import { readLesson, frameState } from './lib/lesson.mjs';
import { drawFrame } from './lib/scene.mjs';
import { resolveSceneCues } from './lib/narration-cues.mjs';
import { lexicalTokens, timedWordTokens } from './lib/captions.mjs';
import {
  compareMotionRegion,
  MOTION_CHANNEL_DELTA,
  MOTION_MINIMUM_PIXELS,
} from './lib/motion-audit.mjs';
import { renderEngineProvenance } from './lib/render-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => digest(await fs.readFile(file));
export const NARRATED_MOTION_MINIMUM_FRACTION = 0.002;
export const NARRATED_MOTION_SCOPE =
  'Source-rendered diagnostic for registered targets in current authored cue phrases containing a listed change/action word. Current cues are resolved from matching measured provider words. Focus strength and global scene fade are suppressed; authored cue phase, progress, active status and reveal remain intact. Pixel change can include text, reveal, color or an unrelated object inside a target bounding box. Observed change does not establish correct semantics, motion direction, causality or teaching quality. Static comparisons and holds can be valid. Candidates require review. This does not replace existing geometry, motion, encoded-frame or editorial gates.';

// Deliberately lexical: adjectives, nouns and quoted or conditional claims can match.
// Only declared cue phrases have authoritative target bindings; uncued claims are outside this scan.
const actionWord =
  /^(?:grow|grows|growing|grown|grew|narrow|narrows|narrowing|narrowed|rotate|rotates|rotating|rotated|move|moves|moving|moved|shift|shifts|shifting|shifted|accumulate|accumulates|accumulating|accumulated|arrive|arrives|arriving|arrived|settle|settles|settling|settled|lower|lowers|lowering|lowered|increase|increases|increasing|increased|decrease|decreases|decreasing|decreased|replace|replaces|replacing|replaced|update|updates|updating|updated|change|changes|changing|changed|shrink|shrinks|shrinking|shrank|shrunken|expand|expands|expanding|expanded|stretch|stretches|stretching|stretched|extend|extends|extending|extended|advance|advances|advancing|advanced|fill|fills|filling|filled|swap|swaps|swapping|swapped|fluctuate|fluctuates|fluctuating|fluctuated|trace|traces|tracing|traced|cross|crosses|crossing|crossed|alternate|alternates|alternating|alternated|overlap|overlaps|overlapping|overlapped|flow|flows|flowing|flowed|drop|drops|dropping|dropped|rise|rises|rising|rose|risen|fall|falls|falling|fell|fallen|prepare|prepares|preparing|prepared|execute|executes|executing|executed|begin|begins|beginning|began|finish|finishes|finishing|finished|reveal|reveals|revealing|revealed|commit|commits|committing|committed|discard|discards|discarding|discarded)$/u;

export function narrationActionWords(phrase) {
  return [...new Set(lexicalTokens(phrase).filter((word) => actionWord.test(word)))];
}

export function suppressNarrationFocus(state) {
  return {
    ...state,
    opacity: 1,
    ...(state.cues
      ? {
          cues: Object.fromEntries(
            Object.entries(state.cues).map(([id, cue]) => [id, { ...cue, strength: 0 }]),
          ),
        }
      : {}),
  };
}

// Partition the exact rectangle union into disjoint horizontal strips. A broad
// bounding rectangle would count unrelated motion in gaps between target parts.
export function unionTargetRegions(bounds, width, height) {
  if (![width, height].every((value) => Number.isInteger(value) && value > 0))
    throw new Error('Invalid target canvas dimensions');
  const clipped = bounds
    .map((part) => {
      if (
        ![part.x, part.y, part.width, part.height].every(Number.isFinite) ||
        part.width < 0 ||
        part.height < 0
      )
        throw new Error('Invalid registered target bounds');
      const x = Math.max(0, Math.floor(part.x)),
        y = Math.max(0, Math.floor(part.y));
      const right = Math.min(width, Math.ceil(part.x + part.width)),
        bottom = Math.min(height, Math.ceil(part.y + part.height));
      return { x, y, right, bottom };
    })
    .filter((part) => part.right > part.x && part.bottom > part.y);
  const ys = [...new Set(clipped.flatMap((part) => [part.y, part.bottom]))].sort((a, b) => a - b),
    regions = [];
  for (let index = 1; index < ys.length; index++) {
    const top = ys[index - 1],
      bottom = ys[index];
    const intervals = clipped
      .filter((part) => part.y < bottom && part.bottom > top)
      .map((part) => [part.x, part.right])
      .sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
      const last = merged.at(-1);
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
      else merged.push([...interval]);
    }
    regions.push(...merged.map(([left, right]) => [left, top, right - left, bottom - top]));
  }
  return regions;
}

export function compareTargetMotion(
  before,
  after,
  regions,
  minimumChangedFraction = NARRATED_MOTION_MINIMUM_FRACTION,
) {
  if (
    !Number.isFinite(minimumChangedFraction) ||
    minimumChangedFraction <= 0 ||
    minimumChangedFraction > 1
  )
    throw new Error('Invalid target motion fraction');
  const comparisons = regions.map((region) =>
    compareMotionRegion(before, after, { region, minimumChangedFraction }),
  );
  const changedPixels = comparisons.reduce((sum, pair) => sum + pair.changedPixels, 0);
  const regionPixels = comparisons.reduce((sum, pair) => sum + pair.regionPixels, 0);
  const changedFraction = regionPixels ? changedPixels / regionPixels : 0;
  return {
    changedPixels,
    regionPixels,
    changedFraction,
    observedChange:
      changedPixels >= MOTION_MINIMUM_PIXELS && changedFraction >= minimumChangedFraction,
  };
}

export function evaluateNarratedMotion(samples, targetIDs) {
  if (!Array.isArray(samples) || samples.length < 2)
    throw new Error('Narrated motion requires at least two sampled frames');
  if (!Array.isArray(targetIDs) || !targetIDs.length)
    throw new Error('Narrated motion requires registered target IDs');
  const { width, height } = samples[0].frame;
  if (samples.some((sample) => sample.frame.width !== width || sample.frame.height !== height))
    throw new Error('Narrated motion frame dimensions differ');
  const pairs = samples.slice(1).map((_, index) => [index, index + 1]);
  if (samples.length > 2) pairs.push([0, samples.length - 1]);
  const targets = [...new Set(targetIDs)].map((id) => {
    const parts = samples.flatMap((sample) =>
      sample.targets.filter((part) => part.id === id && (part.alpha ?? 1) > 0.01),
    );
    const regions = unionTargetRegions(parts, width, height);
    const comparisons = pairs.map(([from, to]) => ({
      from,
      to,
      ...compareTargetMotion(samples[from].frame, samples[to].frame, regions),
    }));
    const observedChange = comparisons.some((pair) => pair.observedChange);
    return {
      id,
      regions,
      boundsBySample: samples.map((sample) => sample.targets.filter((part) => part.id === id)),
      observedChange,
      status: !regions.length
        ? 'no-visible-target-bounds'
        : observedChange
          ? 'observed-target-change'
          : 'below-change-threshold',
      comparisons,
    };
  });
  return {
    reviewNeeded: !targets.some((target) => target.observedChange),
    staticTargets: targets.filter((target) => !target.observedChange).map((target) => target.id),
    targets,
  };
}

export function cueProbeTimes(cue, timing) {
  const beat = timing.beats[cue.beat],
    epsilon = 1 / timing.fps;
  if (
    !beat ||
    ![cue.start, cue.end, beat.start, beat.until, timing.duration].every(Number.isFinite) ||
    cue.end <= cue.start ||
    timing.fps < 1
  )
    throw new Error('Invalid measured cue window');
  return [
    ...new Set([
      Math.max(beat.start, cue.start - epsilon),
      ...[0.1, 0.3, 0.5, 0.7, 0.9].map((progress) => cue.start + progress * (cue.end - cue.start)),
      Math.min(beat.until, timing.duration - epsilon / 2, cue.end + epsilon),
    ]),
  ].sort((a, b) => a - b);
}

function currentMeasuredScenes(lesson, timeline) {
  if (
    timeline.id !== lesson.id ||
    timeline.width !== 1920 ||
    timeline.height !== 1080 ||
    !Number.isInteger(timeline.fps) ||
    timeline.fps < 1 ||
    timeline.scenes?.length !== lesson.scenes.length
  )
    throw new Error('Measured lesson identity or geometry differs');
  return lesson.scenes.map((scene, index) => {
    const timing = timeline.scenes[index];
    if (
      timing.id !== scene.id ||
      timing.fps !== timeline.fps ||
      !Number.isFinite(timing.duration) ||
      timing.duration <= 0 ||
      timing.beats?.length !== scene.beats.length
    )
      throw new Error(`${scene.id}: measured scene differs`);
    for (const [beatIndex, beat] of scene.beats.entries()) {
      const measured = timing.beats[beatIndex];
      if (
        measured.say !== beat.say ||
        (measured.hold ?? 0.45) !== (beat.hold ?? 0.45) ||
        ![measured.start, measured.end, measured.until].every(Number.isFinite) ||
        measured.start < 0 ||
        measured.end <= measured.start ||
        measured.until < measured.end ||
        measured.until > timing.duration
      )
        throw new Error(
          `${scene.id}/${beatIndex}: narration changed or measured beat is invalid; new measured audio is required`,
        );
      const sound =
        timing.sounds?.find((sound) => sound.beatIndex === beatIndex) ?? timing.sounds?.[beatIndex];
      timedWordTokens(sound?.words, beat.say);
      if (sound.words.at(-1).end > measured.end - measured.start + 0.2)
        throw new Error(`${scene.id}/${beatIndex}: provider words exceed measured speech`);
    }
    return { ...timing, visualCues: resolveSceneCues(scene, timing), cueTiming: 'provider-words' };
  });
}

function rgbFrame(ctx) {
  const { width, height } = ctx.canvas,
    rgba = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height * 3);
  for (let pixel = 0; pixel < width * height; pixel++) {
    data[pixel * 3] = rgba[pixel * 4];
    data[pixel * 3 + 1] = rgba[pixel * 4 + 1];
    data[pixel * 3 + 2] = rgba[pixel * 4 + 2];
  }
  return { width, height, data };
}

async function writeSheet(file, samples, cue) {
  const sheet = createCanvas(1440, Math.ceil(samples.length / 3) * 300),
    ctx = sheet.getContext('2d');
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  const native = createCanvas(1920, 1080),
    nativeCtx = native.getContext('2d');
  for (const [index, sample] of samples.entries()) {
    const rgba = nativeCtx.createImageData(1920, 1080);
    for (let pixel = 0; pixel < 1920 * 1080; pixel++) {
      rgba.data[pixel * 4] = sample.frame.data[pixel * 3];
      rgba.data[pixel * 4 + 1] = sample.frame.data[pixel * 3 + 1];
      rgba.data[pixel * 4 + 2] = sample.frame.data[pixel * 3 + 2];
      rgba.data[pixel * 4 + 3] = 255;
    }
    nativeCtx.putImageData(rgba, 0, 0);
    const x = (index % 3) * 480,
      y = Math.floor(index / 3) * 300;
    ctx.drawImage(native, x, y, 480, 270);
    ctx.fillStyle = '#edf3ff';
    ctx.font = '13px "Lesson Sans"';
    ctx.fillText(`${cue.id} · ${sample.time.toFixed(3)}s`, x + 8, y + 289, 462);
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, await sheet.encode('png'));
  return { path: path.relative(root, file), sha256: await hashFile(file) };
}

async function main(argv) {
  const options = {
    lessons: [],
    input: 'build/video-narration-renders-20261025/previews',
    output: 'build/video-narration-direction-20261025/narrated-motion.json',
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === '--help') {
      console.log(
        'node videos/audit-narrated-motion.mjs --lesson ID [--lesson ID] | --all [--input PREVIEW_ROOT] [--output FILE.json] [--images-dir DIR]',
      );
      return;
    }
    if (flag === '--all') {
      options.all = true;
      continue;
    }
    if (
      !['--lesson', '--input', '--output', '--images-dir'].includes(flag) ||
      !argv[index + 1] ||
      argv[index + 1].startsWith('--')
    )
      throw new Error(`Invalid narrated motion option: ${flag}`);
    const value = argv[++index];
    if (flag === '--lesson') options.lessons.push(value);
    else options[flag.slice(2)] = value;
  }
  if (options.all && options.lessons.length)
    throw new Error('Choose --all or repeated --lesson, not both');
  const catalog = await discoverLessons(path.join(root, 'videos'), root);
  const ids = options.all ? catalog.map((row) => row.id) : [...new Set(options.lessons)];
  if (!ids.length) throw new Error('Choose --lesson ID or --all');
  for (const id of ids)
    if (!catalog.some((row) => row.id === id)) throw new Error(`Unknown lesson: ${id}`);
  registerLessonFonts();
  const toolSha256 = await hashFile(fileURLToPath(import.meta.url));
  const frameworkFiles = [
    'catalog.mjs',
    'lib/lesson.mjs',
    'lib/scene.mjs',
    'lib/narration-cues.mjs',
    'lib/captions.mjs',
    'lib/motion-audit.mjs',
    'lib/render-engine.mjs',
  ];
  const frameworkHashes = async () =>
    Object.fromEntries(
      await Promise.all(
        frameworkFiles.map(async (file) => [file, await hashFile(path.join(root, 'videos', file))]),
      ),
    );
  const frameworkSha256 = await frameworkHashes(),
    renderEngine = renderEngineProvenance();
  const output = path.resolve(root, options.output),
    input = path.resolve(root, options.input),
    lessons = [];
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: NARRATED_MOTION_SCOPE,
    thresholds: {
      channelDelta: MOTION_CHANNEL_DELTA,
      minimumPixels: MOTION_MINIMUM_PIXELS,
      minimumChangedFraction: NARRATED_MOTION_MINIMUM_FRACTION,
    },
    toolSha256,
    frameworkSha256,
    renderEngine,
    input: path.relative(root, input),
    requestedLessons: ids,
    lessons,
  };
  const writeReport = async () => {
    report.completedAt = new Date().toISOString();
    report.complete =
      lessons.length === ids.length && lessons.every((row) => row.status === 'reviewed');
    report.summary = {
      lessons: lessons.length,
      reviewed: lessons.filter((row) => row.status === 'reviewed').length,
      needsRerun: lessons.filter((row) => row.status !== 'reviewed').map((row) => row.id),
      inspectedCues: lessons.reduce((sum, row) => sum + (row.cues?.length ?? 0), 0),
      reviewCandidates: lessons.reduce(
        (sum, row) => sum + (row.cues?.filter((cue) => cue.reviewNeeded).length ?? 0),
        0,
      ),
    };
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  };
  for (const id of ids) {
    const row = { id, status: 'needs-rerun', cues: [] };
    lessons.push(row);
    try {
      const markup = path.join(root, 'videos/lessons', `${id}.lesson.yaml`),
        animation = path.join(root, 'videos/animations', `${id}.mjs`);
      const timelineFile = path.join(input, id, 'timeline.json');
      const [markupBytes, animationBytes, timelineBytes] = await Promise.all([
        fs.readFile(markup),
        fs.readFile(animation),
        fs.readFile(timelineFile),
      ]);
      row.markupSha256 = digest(markupBytes);
      row.animationSha256 = digest(animationBytes);
      row.timelineSha256 = digest(timelineBytes);
      row.timeline = path.relative(root, timelineFile);
      const lesson = await readLesson(markup, root),
        timings = currentMeasuredScenes(lesson, JSON.parse(timelineBytes));
      const module = await import(
        `${pathToFileURL(animation).href}?narratedMotion=${row.animationSha256}`
      );
      if (typeof module.draw !== 'function') throw new Error('Animation has no draw function');
      if (module.validateModel) module.validateModel();
      const canvas = createCanvas(1920, 1080),
        ctx = canvas.getContext('2d');
      row.totalCues = timings.reduce((sum, timing) => sum + timing.visualCues.length, 0);
      for (const [sceneIndex, scene] of lesson.scenes.entries()) {
        const timing = timings[sceneIndex];
        for (const cue of timing.visualCues) {
          const actionWords = narrationActionWords(cue.phrase);
          if (!actionWords.length) continue;
          const samples = cueProbeTimes(cue, timing).map((time) => {
            const state = suppressNarrationFocus(
              frameState(timing, time, sceneIndex, lesson.scenes.length),
            );
            const audit = drawFrame(ctx, lesson, scene, state, module.draw),
              frame = rgbFrame(ctx);
            return {
              time,
              frame,
              targets: audit.targets.filter((target) => cue.targets.includes(target.id)),
              cueState: state.cues[cue.id],
              rgb24Sha256: digest(frame.data),
            };
          });
          const result = evaluateNarratedMotion(samples, cue.targets);
          const cueRow = {
            scene: scene.id,
            beat: cue.beat,
            cue: cue.id,
            phrase: cue.phrase,
            narration: scene.beats[cue.beat].say,
            actionWords,
            start: cue.start,
            end: cue.end,
            absoluteStart: timing.start + cue.start,
            absoluteEnd: timing.start + cue.end,
            samples: samples.map(({ frame: _frame, targets: _targets, ...sample }) => sample),
            ...result,
          };
          if (options['images-dir'] && result.reviewNeeded)
            cueRow.sheet = await writeSheet(
              path.resolve(root, options['images-dir'], id, `${scene.id}-${cue.id}.png`),
              samples,
              cue,
            );
          row.cues.push(cueRow);
        }
      }
      if (
        (await hashFile(markup)) !== row.markupSha256 ||
        (await hashFile(animation)) !== row.animationSha256 ||
        (await hashFile(timelineFile)) !== row.timelineSha256
      )
        throw new Error(
          'Lesson source or measured timeline changed during audit; rerun this lesson after edits finish',
        );
      row.status = 'reviewed';
    } catch (error) {
      row.error = error.message;
    }
    console.log(
      JSON.stringify({
        id,
        status: row.status,
        inspectedCues: row.cues.length,
        reviewCandidates: row.cues.filter((cue) => cue.reviewNeeded).length,
        ...(row.error ? { error: row.error } : {}),
      }),
    );
    await writeReport();
  }
  if (
    (await hashFile(fileURLToPath(import.meta.url))) !== toolSha256 ||
    JSON.stringify(await frameworkHashes()) !== JSON.stringify(frameworkSha256) ||
    JSON.stringify(renderEngineProvenance()) !== JSON.stringify(renderEngine)
  ) {
    report.frameworkChanged = true;
    for (const row of lessons) {
      row.status = 'needs-rerun';
      row.error =
        'Audit tool, shared framework or Vizmatic changed during audit; rerun against a stable engine';
    }
  }
  // Earlier lessons can change while later ones render. Recheck every completed binding.
  for (const row of lessons.filter((row) => row.status === 'reviewed')) {
    if (
      (await hashFile(path.join(root, 'videos/lessons', `${row.id}.lesson.yaml`))) !==
        row.markupSha256 ||
      (await hashFile(path.join(root, 'videos/animations', `${row.id}.mjs`))) !==
        row.animationSha256 ||
      (await hashFile(path.join(input, row.id, 'timeline.json'))) !== row.timelineSha256
    ) {
      row.status = 'needs-rerun';
      row.error = 'Lesson changed after its samples rendered; rerun this lesson';
    }
  }
  await writeReport();
  if (!report.complete) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
