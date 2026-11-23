#!/usr/bin/env node
// Find moments when a stage film's content area goes blank, without rendering a movie.
// One picture must not finish fading before the next one starts. inspect.mjs fails the same
// frames in the encoded movie, but only after a full render. This needs a preview's timeline.json.
//
// Opacity alone cannot predict what inspect.mjs measures, because a dim color at full opacity
// also counts as blank. So frames without a clearly visible mark are painted and measured.
//
//   node videos/audit-stage-blank.mjs --lesson ID --input build/videos/previews/ID
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderFilmFrames } from 'vizmatic/stage/export';
import { pathBounds } from 'vizmatic/stage';
import { readLesson } from './lib/lesson.mjs';
import { compileStageLesson, sceneWindows } from './lib/stage-lesson.mjs';

const here = fileURLToPath(new URL('.', import.meta.url)),
  root = resolve(here, '..');
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const id = value('--lesson'),
  input = value('--input');
if (!id || !input)
  throw new Error('Usage: node videos/audit-stage-blank.mjs --lesson ID --input PREVIEW_DIR');

// These match the content region, the sampling size, and the foreground rule in inspect.mjs.
// BLANK_FRACTION is twice the rule's 0.001, because painted and encoded pixels differ a little.
const CONTENT = { x: 100, y: 200, width: 1720, height: 785 };
const WIDTH = 320,
  HEIGHT = 180,
  FOREGROUND_GRAY = 48,
  BLANK_FRACTION = 0.002;
const SCENE_START = 0.45,
  SCENE_END = 0.35,
  BEAT_EDGE = 0.12;
// A frame with a large bright fill at this opacity cannot be blank, so it does not need painting.
// Strokes do not count. A thin outline or a half-drawn path has a huge box and can still measure blank.
const SURE_ALPHA = 0.6,
  SURE_AREA = 20000,
  BATCH = 120;
const inContent = (box) =>
  box.x < CONTENT.x + CONTENT.width &&
  box.x + box.width > CONTENT.x &&
  box.y < CONTENT.y + CONTENT.height &&
  box.y + box.height > CONTENT.y;

function clearlyHasContent(frame) {
  let area = 0;
  for (const op of frame.ops) {
    if (op.kind !== 'path' || op.path.length === 0 || !op.fill || op.fillAlpha < SURE_ALPHA)
      continue;
    const [red, green, blue] = op.fill;
    if ((0.299 * red + 0.587 * green + 0.114 * blue) * op.fillAlpha <= FOREGROUND_GRAY) continue;
    const box = pathBounds(op.path);
    if (box && inContent(box)) area += box.width * box.height;
    if (area >= SURE_AREA) return true;
  }
  return false;
}

function blankFraction(pixels) {
  const top = Math.floor((HEIGHT * CONTENT.y) / 1080),
    bottom = Math.ceil((HEIGHT * (CONTENT.y + CONTENT.height)) / 1080);
  const left = Math.floor((WIDTH * CONTENT.x) / 1920),
    right = Math.ceil((WIDTH * (CONTENT.x + CONTENT.width)) / 1920);
  let foreground = 0,
    total = 0;
  for (let y = top; y < bottom; y++)
    for (let x = left; x < right; x++) {
      if (pixels[y * WIDTH + x] > FOREGROUND_GRAY) foreground++;
      total++;
    }
  return foreground / total;
}

async function paintedBlank(compiled, times, directory) {
  const blank = new Set();
  for (let start = 0; start < times.length; start += BATCH) {
    const batch = times.slice(start, start + BATCH),
      prefix = join(directory, `batch-${start}-`);
    await renderFilmFrames(compiled, batch, prefix, { width: WIDTH });
    const raw = execFileSync(
      'ffmpeg',
      [
        '-nostdin',
        '-v',
        'error',
        '-start_number',
        '0',
        '-i',
        `${prefix}%03d.png`,
        '-vf',
        'format=gray',
        '-pix_fmt',
        'gray',
        '-f',
        'rawvideo',
        'pipe:1',
      ],
      { maxBuffer: batch.length * WIDTH * HEIGHT + 1024 },
    );
    if (raw.length !== batch.length * WIDTH * HEIGHT)
      throw new Error(
        `Expected ${batch.length} painted frames, and got ${raw.length / (WIDTH * HEIGHT)}`,
      );
    batch.forEach((time, index) => {
      if (
        blankFraction(raw.subarray(index * WIDTH * HEIGHT, (index + 1) * WIDTH * HEIGHT)) <
        BLANK_FRACTION
      )
        blank.add(time);
    });
  }
  return blank;
}

async function frameAt(compiled, time) {
  for (;;) {
    try {
      return compiled.frame(time);
    } catch (error) {
      if (!error?.promise) throw error;
      await error.promise;
    }
  }
}

const lesson = await readLesson(join(here, 'stage-lessons', `${id}.lesson.yaml`), root);
const { default: definition } = await import(
  pathToFileURL(join(here, 'stage-lessons', `${id}.film.mjs`)).href
);
const timeline = JSON.parse(await readFile(join(input, 'timeline.json'), 'utf8'));
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const windows = sceneWindows(timeline),
  step = 1 / (timeline.fps ?? 60);

const suspects = [];
for (const [index, window] of windows.entries()) {
  const scene = timeline.scenes[index];
  for (let frame = 0, time = window.from; time < window.to; time = window.from + ++frame * step) {
    const local = time - window.from;
    const edge =
      local < SCENE_START ||
      scene.duration - local <= SCENE_END ||
      scene.beats.some(
        (beat) =>
          Math.abs(local - beat.start) <= BEAT_EDGE || Math.abs(local - beat.until) <= BEAT_EDGE,
      );
    if (!edge && !clearlyHasContent(await frameAt(compiled, time)))
      suspects.push({ scene: window.id, time });
  }
}

const directory = await mkdtemp(join(tmpdir(), 'stage-blank-'));
let blank;
try {
  blank = await paintedBlank(
    compiled,
    suspects.map((suspect) => suspect.time),
    directory,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}

const spans = [];
let open = null;
for (const { scene, time } of suspects) {
  if (!blank.has(time)) continue;
  if (open?.scene === scene && time - open.to < step * 1.5) open.to = time;
  else spans.push((open = { scene, from: time, to: time }));
}
console.log(`${id}: painted ${suspects.length} frames without a clearly visible mark`);
for (const span of spans)
  console.log(
    `${span.scene}: blank at film time ${span.from.toFixed(2)} to ${span.to.toFixed(2)} s`,
  );
console.log(`${id}: ${spans.length} blank span(s) inside scenes`);
process.exit(spans.length ? 1 : 0);
