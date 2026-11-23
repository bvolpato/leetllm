#!/usr/bin/env node
// Review a stage lesson at full quality without rendering a movie. It samples the measured
// timeline from an earlier --preview run, including bloom, and writes a contact grid.
//   node videos/stage-review.mjs --lesson ID --input build/previews/ID --output /tmp/review [--per-scene 6] [--times 1,2.5]
import { readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { renderFilmFrames } from 'vizmatic/stage/export';
import { readLesson } from './lib/lesson.mjs';
import { compileStageLesson, sceneWindows } from './lib/stage-lesson.mjs';

const here = fileURLToPath(new URL('.', import.meta.url)),
  root = resolve(here, '..');
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const id = value('--lesson'),
  input = value('--input'),
  output = resolve(value('--output', '/tmp/stage-review'));
if (!id || !input)
  throw new Error(
    'Usage: node videos/stage-review.mjs --lesson ID --input PREVIEW_DIR [--output DIR] [--per-scene 6] [--scene ID] [--times a,b]',
  );
const lesson = await readLesson(join(here, 'stage-lessons', `${id}.lesson.yaml`), root);
const { default: definition } = await import(
  pathToFileURL(join(here, 'stage-lessons', `${id}.film.mjs`)).href
);
const timeline = JSON.parse(await readFile(join(input, 'timeline.json'), 'utf8'));
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const windows = sceneWindows(timeline),
  perScene = Number(value('--per-scene', 6)),
  only = value('--scene');
const explicit = value('--times')?.split(',').map(Number);
const times =
  explicit ??
  windows
    .filter((window) => !only || window.id === only)
    .flatMap((window) =>
      Array.from(
        { length: perScene },
        (_, i) => window.from + ((window.to - window.from) * (i + 0.5)) / perScene,
      ),
    );
await mkdir(output, { recursive: true });
const files = await renderFilmFrames(compiled, times, join(output, 'frame-'), {
  width: 1920,
  workers: 4,
});
const columns = Number(value('--columns', 2)),
  tileWidth = Number(value('--tile', 960)),
  tileHeight = Math.round((tileWidth * 9) / 16);
const sheet = createCanvas(
  columns * tileWidth + (columns - 1) * 6,
  Math.ceil(files.length / columns) * (tileHeight + 6) - 6,
);
const context = sheet.getContext('2d');
context.fillStyle = '#505050';
context.fillRect(0, 0, sheet.width, sheet.height);
for (const [i, file] of files.entries()) {
  const image = await loadImage(file),
    x = (i % columns) * (tileWidth + 6),
    y = Math.floor(i / columns) * (tileHeight + 6);
  context.drawImage(image, x, y, tileWidth, tileHeight);
  context.fillStyle = '#ffd75e';
  context.font = '18px sans-serif';
  context.fillText(`${times[i].toFixed(2)}s`, x + 8, y + 22);
}
const out = join(output, value('--name', `${id}-${only ?? 'all'}.png`));
await (await import('node:fs/promises')).writeFile(out, await sheet.encode('png'));
console.log(out, `${compiled.duration.toFixed(1)}s`);
