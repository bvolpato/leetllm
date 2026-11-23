import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { nativeStrip, resizedStrip } from '../../../films/vision-transformers/incident.mjs';

// The reference frames were generated with Vizmatic at 5f38748becc3fa18b6b33a7db243110459f4ad52.
// The output digest below also verifies compatible local builds.
if (!process.argv[2]) throw new Error('Pass the directory of the built Vizmatic package.');
const root = resolve(process.argv[2]);
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json')));
const { createTeachingCanvas, interpolateCamera, projectWorldPoint, smoothstep } = await import(
  pathToFileURL(resolve(root, manifest.exports['.'].import.default))
);
const frame = { x: 104, y: 76, scale: 1.2 };
const strip = { x: 504, y: 276, columns: nativeStrip[0].length, rows: nativeStrip.length };
const id = {
  x: frame.x + (strip.x + strip.columns / 2) * frame.scale,
  y: frame.y + (strip.y + strip.rows / 2) * frame.scale,
  unit: frame.scale,
};
const hero = { x: 960, y: 792, unit: 36 };
const detail = { column: 30, row: 2, size: 4 };
const crop = nativeStrip
  .slice(detail.row, detail.row + detail.size)
  .map((row) => row.slice(detail.column, detail.column + detail.size));

// Each frame stores the shared cell edges returned by the public pixel painter.
// The course replays them against its own source samples on either package version.
function travel(values, from, to, steps) {
  const rows = values.length,
    columns = values[0].length;
  const samples = values.flat();
  const middle = { x: columns / 2, y: rows / 2 };
  return Array.from({ length: steps + 1 }, (_, step) => {
    const p = step / steps,
      mix = smoothstep(p);
    const cx = from.x + (to.x - from.x) * mix,
      cy = from.y + (to.y - from.y) * mix;
    const camera = interpolateCamera(
      { ...middle, zoom: from.unit },
      { ...middle, zoom: to.unit },
      p,
    );
    const origin = projectWorldPoint({ x: 0, y: 0 }, camera, { width: 2 * cx, height: 2 * cy });
    const xs = [],
      ys = [];
    let cell = 0;
    const canvas = createTeachingCanvas({
      rect(x, y, w, h) {
        assert([x, y, w, h].every(Number.isInteger), 'Build the pinned pixel-aligned raster wipe.');
        const row = Math.floor(cell / columns),
          column = cell % columns;
        if (row === 0) {
          xs[column] = x;
          xs[column + 1] = x + w;
        }
        if (column === 0) {
          ys[row] = y;
          ys[row + 1] = y + h;
        }
        cell++;
      },
    });
    canvas.rasterWipe({
      ...origin,
      width: columns * camera.zoom,
      height: rows * camera.zoom,
      rows,
      columns,
      left: samples,
      right: samples,
      split: 1,
      snapToPixels: true,
      color: String,
    });
    assert.equal(cell, samples.length);
    return { xs, ys };
  });
}

const frames = {
  frame,
  strip,
  detail,
  open: travel(nativeStrip, id, hero, 42),
  average: travel(
    resizedStrip,
    { ...hero, unit: 3 * hero.unit },
    { x: 1360, y: 315, unit: 36 },
    45,
  ),
  lift: travel(
    crop,
    {
      x: hero.x + (detail.column + 2 - strip.columns / 2) * hero.unit,
      y: hero.y + (detail.row + 2 - strip.rows / 2) * hero.unit,
      unit: hero.unit,
    },
    { x: 1166, y: 312, unit: 84 },
    40,
  ),
};
const output =
  process.argv[3] ?? fileURLToPath(new URL('./pixel-lens-frames.json', import.meta.url));
const json = JSON.stringify(frames) + '\n';
assert.equal(
  createHash('sha256').update(json).digest('hex'),
  '85736b157a76ef9b307a8948eea2d4f8b657f903e031cb1cb3901f71c1a007d5',
);
writeFileSync(output, json);
