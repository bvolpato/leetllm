#!/usr/bin/env node
// Find long moments where a stage film leaves much of the frame empty. It samples the film every
// half second on a 16 by 9 grid and measures the largest empty rectangle. It needs a preview's
// timeline.json, so it uses measured speech timing.
//
//   node videos/audit-stage-space.mjs --lesson ID --input /tmp/stage/previews/ID [--limit 0.4] [--seconds 2]
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLesson } from './lib/lesson.mjs';
import { compileStageLesson, sceneWindows } from './lib/stage-lesson.mjs';

const COLUMNS = 16,
  ROWS = 9,
  CELL = 20,
  FOREGROUND = 40,
  MIN_PIXELS = 2;

/** The largest rectangle of empty cells, as a share of the whole grid. */
export function largestEmptyShare(occupied, columns = COLUMNS, rows = ROWS) {
  const heights = new Array(columns).fill(0);
  let best = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) heights[x] = occupied[y * columns + x] ? 0 : heights[x] + 1;
    for (let x = 0; x < columns; x++) {
      let height = heights[x];
      for (let end = x; end < columns && heights[end]; end++) {
        height = Math.min(height, heights[end]);
        best = Math.max(best, height * (end - x + 1));
      }
    }
  }
  return best / (columns * rows);
}

function emptyShareAt(compiled, time) {
  const image = new Resvg(compiled.svg(time), {
    fitTo: { mode: 'width', value: COLUMNS * CELL },
    font: { loadSystemFonts: false },
  }).render();
  // Read `pixels` once, because each read copies the whole image.
  const pixels = image.pixels,
    counts = new Array(COLUMNS * ROWS).fill(0);
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const gray = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      if (gray >= FOREGROUND)
        counts[
          Math.min(ROWS - 1, Math.floor(y / CELL)) * COLUMNS +
            Math.min(COLUMNS - 1, Math.floor(x / CELL))
        ]++;
    }
  return largestEmptyShare(counts.map((count) => count >= MIN_PIXELS));
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = (flag, fallback) => {
    const i = process.argv.indexOf(flag);
    return i < 0 ? fallback : process.argv[i + 1];
  };
  const id = value('--lesson'),
    input = value('--input');
  if (!id || !input)
    throw new Error(
      'Usage: audit-stage-space.mjs --lesson ID --input PREVIEW_DIRECTORY [--limit 0.4] [--seconds 2]',
    );
  const limit = Number(value('--limit', 0.4)),
    seconds = Number(value('--seconds', 2));
  const lesson = await readLesson(
    join(here, 'stage-lessons', `${id}.lesson.yaml`),
    resolve(here, '..'),
  );
  const { default: film } = await import(
    pathToFileURL(join(here, 'stage-lessons', `${id}.film.mjs`)).href
  );
  const timeline = JSON.parse(await readFile(join(resolve(input), 'timeline.json'), 'utf8'));
  const { compiled } = await compileStageLesson(film, lesson, timeline);
  let found = 0;
  for (const window of sceneWindows(timeline)) {
    let run = null;
    const flush = () => {
      if (run && run.to - run.from >= seconds) {
        found++;
        console.log(
          `${id}/${window.id} ${(run.from - window.from).toFixed(1)}..${(run.to - window.from).toFixed(1)}s: up to ${(run.peak * 100).toFixed(0)}% empty`,
        );
      }
      run = null;
    };
    for (let time = window.from + 0.6; time < window.to - 0.6; time += 0.5) {
      const share = emptyShareAt(compiled, time);
      if (share <= limit) flush();
      else if (run) {
        run.to = time;
        run.peak = Math.max(run.peak, share);
      } else run = { from: time, to: time, peak: share };
    }
    flush();
  }
  console.log(
    `${id}: ${found} span(s) over ${(limit * 100).toFixed(0)}% empty for ${seconds} s or more`,
  );
  if (found) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
