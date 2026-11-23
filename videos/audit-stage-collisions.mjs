#!/usr/bin/env node
// Find text that lands on other text, or crosses the edge of a shape, in motion. A film check looks
// only at moments of rest, so it misses a sentence that slides across a note, a fade that runs under
// the text arriving next, a bar that slides through a label, or an arrow that sweeps across one.
// This reads every frame of a preview's timeline, so it takes seconds and needs no render.
//
// The scan cannot see that one block replaces another, becomes it, or hides it with an opaque tile.
// So it lists what it finds and always exits 0. A person or a reviewer judges each line.
// It skips grid rules and anything under 25% opacity, so an empty list does not prove a film clean.
//
//   node videos/audit-stage-collisions.mjs --lesson ID --input build/videos/previews/ID
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
  throw new Error('Usage: node videos/audit-stage-collisions.mjs --lesson ID --input PREVIEW_DIR');

// Rule P5 ignores anything fading under 25% opacity, so both sides must reach it to count.
// Overlaps must exceed MIN_OVERLAP units on each axis.
const MIN_ALPHA = 0.25,
  MIN_TEXT_ON_SHAPE = 0.25,
  MIN_OVERLAP = 2;
// Text of a few letters is usually a tile's own label, moving with its tile, so it does not count against
// its shape. Open paths are arcs, arrows, and wires, whose boxes are mostly empty, so they count by their
// line, and any text counts against a line.
// A long level or plumb line is a grid rule or an axis, and a chart's labels may sit on those.
const MIN_SHAPE = 30,
  MAX_SHAPE = 1500,
  MIN_TEXT_LENGTH = 4,
  GRID_RULE_LENGTH = 300,
  CURVE_STEPS = 12;
const ON_A_LINE = 'crosses a line';

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

/** Group a frame's glyphs into text blocks. Only text nodes carry a glyph key. */
function textBlocks(frame) {
  const blocks = new Map();
  for (const op of frame.ops) {
    const parent = op.node?.parent,
      alpha = op.fillAlpha ?? 0;
    if (
      op.kind !== 'path' ||
      op.node?.data?.key === undefined ||
      !parent ||
      alpha < MIN_TEXT_ON_SHAPE
    )
      continue;
    const box = pathBounds(op.path);
    if (!box) continue;
    if (!blocks.has(parent))
      blocks.set(parent, {
        source: (parent.source ?? '').replace(/\n/g, ' / '),
        glyphs: [],
        alpha: 0,
      });
    const block = blocks.get(parent);
    block.glyphs.push(box);
    block.alpha = Math.max(block.alpha, alpha);
  }
  return [...blocks.values()];
}

function closedShapes(frame) {
  const shapes = [];
  for (const op of frame.ops) {
    if (
      op.kind !== 'path' ||
      op.node?.data?.key !== undefined ||
      !op.path.length ||
      !op.path.every((ring) => ring.closed)
    )
      continue;
    const alpha = Math.max(
        op.fill ? (op.fillAlpha ?? 0) : 0,
        op.stroke ? (op.strokeAlpha ?? 0) : 0,
      ),
      box = pathBounds(op.path);
    if (
      box &&
      alpha >= MIN_ALPHA &&
      box.width >= MIN_SHAPE &&
      box.height >= MIN_SHAPE &&
      box.width <= MAX_SHAPE
    )
      shapes.push(box);
  }
  return shapes;
}

/** Flatten the open rings of a frame's stroked paths. Rings hold cubic Beziers: a start, then three points per segment. */
function openLines(frame) {
  const lines = [];
  for (const op of frame.ops) {
    if (
      op.kind !== 'path' ||
      op.node?.data?.key !== undefined ||
      !op.stroke ||
      (op.strokeAlpha ?? 0) < MIN_ALPHA
    )
      continue;
    // A half-drawn path keeps its full outline in path and only the drawn part in strokePath.
    for (const ring of op.strokePath ?? op.path) {
      if (ring.closed || ring.p.length < 8) continue;
      const box = pathBounds([ring]);
      if (
        !box ||
        (Math.min(box.width, box.height) < 2 && Math.max(box.width, box.height) >= GRID_RULE_LENGTH)
      )
        continue;
      const points = [[ring.p[0], ring.p[1]]];
      for (let i = 2; i + 5 < ring.p.length; i += 6) {
        const [x0, y0] = points.at(-1),
          [x1, y1, x2, y2, x3, y3] = ring.p.slice(i, i + 6);
        for (let step = 1; step <= CURVE_STEPS; step++) {
          const t = step / CURVE_STEPS,
            u = 1 - t;
          points.push([
            u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
            u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
          ]);
        }
      }
      lines.push({ box, points });
    }
  }
  return lines;
}

/** True when the segment from a to b enters the box. This clips the segment to the box's four sides. */
function segmentHitsBox([ax, ay], [bx, by], box) {
  let from = 0,
    to = 1;
  for (const [delta, low, high] of [
    [bx - ax, box.x - ax, box.x + box.width - ax],
    [by - ay, box.y - ay, box.y + box.height - ay],
  ]) {
    if (delta === 0) {
      if (low > 0 || high < 0) return false;
      continue;
    }
    const [near, far] = delta > 0 ? [low / delta, high / delta] : [high / delta, low / delta];
    from = Math.max(from, near);
    to = Math.min(to, far);
    if (from > to) return false;
  }
  return true;
}

const lineCrosses = (block, line) =>
  block.glyphs.some(
    (glyph) =>
      overlapDepth(glyph, line.box) > 0 &&
      line.points.some((point, i) => i > 0 && segmentHitsBox(line.points[i - 1], point, glyph)),
  );

const overlapDepth = (a, b) =>
  Math.min(
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
const touches = (a, b) =>
  a.glyphs.some((g) => b.glyphs.some((h) => overlapDepth(g, h) > MIN_OVERLAP));
const contains = (outer, inner) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;
const boundsOf = (boxes) => {
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
};
/** True when text sits partly in a shape. Text inside its own box, or around a small shape, does not count. */
const crosses = (block, shape) => {
  const box = boundsOf(block.glyphs);
  return (
    !contains(shape, box) &&
    !contains(box, shape) &&
    block.glyphs.some((g) => overlapDepth(g, shape) > MIN_OVERLAP)
  );
};

const lesson = await readLesson(join(here, 'stage-lessons', `${id}.lesson.yaml`), root);
const { default: definition } = await import(
  pathToFileURL(join(here, 'stage-lessons', `${id}.film.mjs`)).href
);
const timeline = JSON.parse(await readFile(join(input, 'timeline.json'), 'utf8'));
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const step = 1 / (timeline.fps ?? 60);

const open = new Map(),
  episodes = [];
const record = (scene, a, b, time) => {
  const key = `${scene}\n${a}\n${b}`,
    last = open.get(key);
  if (last && time - last.to < step * 3) last.to = time;
  else {
    const episode = { scene, a, b, from: time, to: time };
    open.set(key, episode);
    episodes.push(episode);
  }
};
for (const window of sceneWindows(timeline)) {
  for (let frame = 0, time = window.from; time < window.to; time = window.from + ++frame * step) {
    const painted = await frameAt(compiled, time),
      blocks = textBlocks(painted),
      shapes = closedShapes(painted),
      lines = openLines(painted);
    for (let i = 0; i < blocks.length; i++)
      for (let j = i + 1; j < blocks.length; j++) {
        const [a, b] = [blocks[i].source, blocks[j].source].sort();
        if (
          a !== b &&
          Math.min(blocks[i].alpha, blocks[j].alpha) >= MIN_ALPHA &&
          touches(blocks[i], blocks[j])
        )
          record(window.id, a, b, time);
      }
    for (const block of blocks)
      if (block.source.length >= MIN_TEXT_LENGTH && shapes.some((shape) => crosses(block, shape)))
        record(window.id, block.source, null, time);
    for (const block of blocks)
      if (lines.some((line) => lineCrosses(block, line)))
        record(window.id, block.source, ON_A_LINE, time);
  }
}

episodes.sort((p, q) => p.from - q.from);
for (const { scene, a, b, from, to } of episodes)
  console.log(
    `${scene} ${from.toFixed(2)} s for ${(to - from + step).toFixed(2)} s: "${a}" ${b === null ? 'crosses a shape' : b === ON_A_LINE ? ON_A_LINE : `and "${b}"`}`,
  );
console.log(
  `${id}: ${episodes.length} overlap(s). Judge each one: the text must replace, become, or be hidden by what it meets.`,
);
