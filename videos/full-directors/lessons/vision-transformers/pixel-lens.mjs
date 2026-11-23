import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { smoothstep } from 'vizmatic';
import {
  incidentScreen,
  labeledId,
  nativeStrip,
  nextId,
  nextStrip,
  proposedId,
  resizedStrip,
} from '../../../films/vision-transformers/incident.mjs';

const frames = JSON.parse(
  readFileSync(new URL('./pixel-lens-frames.json', import.meta.url), 'utf8'),
);
const { frame, strip, detail } = frames;
const lastGlyphColumn = (labeledId.length - 1) * 6;
const cyan = '#79dbed';
const paper = '#273344',
  ink = '#e0e3e8',
  amber = '#ffc664',
  matte = '#101b26';
const colors = { ink: '#f2efe6', muted: '#a5a7ad', red: '#ff6b6b', blue: '#7fa8ff', yellow: amber };

function fill(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function line(c, points, color, width) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function outline(c, x, y, w, h, color, width = 3) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.strokeRect(x, y, w, h);
}
function type(c, text, x, y, size, color, family = 'Lesson Sans', align = 'left') {
  c.font = '500 ' + size + 'px "' + family + '"';
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.textAlign = align;
  c.fillText(text, x, y);
}
const screenApi = {
  C: colors,
  rect(c, x, y, w, h, color, stroke) {
    fill(c, x, y, w, h, color);
    if (stroke) outline(c, x, y, w, h, stroke, 1);
  },
  text(c, label, x, y, size, color) {
    type(c, label, x, y, size, color);
  },
};
function source(c, clock) {
  const opening = clock.beat.id === 'c01-b01';
  const t = opening ? smoothstep(clock.reveal('Here are two possible readings', 0.9)) : 1;
  const scale = 2.56 + (frame.scale - 2.56) * t;
  const y0 = 56 + (frame.y - 56) * t;
  incidentScreen(c, screenApi, frame.x, y0, scale);
  const x = frame.x + strip.x * scale,
    y = y0 + strip.y * scale;
  if (!opening || clock.reveal('Look just left', 0))
    outline(c, x - 5, y - 5, strip.columns * scale + 10, strip.rows * scale + 10, amber);
  return { x: x + (strip.columns * scale) / 2, y: y + strip.rows * scale + 6 };
}

const rgba = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const light = rgba(ink),
  dark = rgba(paper);
const tones = Array.from(
  { length: 10 },
  (_, level) =>
    'rgb(' + light.map((v, i) => Math.round(dark[i] + ((v - dark[i]) * level) / 9)).join(',') + ')',
);
const crop = nativeStrip
  .slice(detail.row, detail.row + detail.size)
  .map((row) => row.slice(detail.column, detail.column + detail.size));
const pick = (track, progress) => track[Math.round(progress * (track.length - 1))];
const final = frames.open.at(-1);
const accent = '#aedf9f';

function bounds({ xs, ys }) {
  return { x: xs[0], y: ys[0], w: xs.at(-1) - xs[0], h: ys.at(-1) - ys[0] };
}
function box(c, plate, color, pad = 5, weight = 3) {
  const { x, y, w, h } = bounds(plate);
  outline(c, x - pad, y - pad, w + 2 * pad, h + 2 * pad, color, weight);
}
function raster(c, values, { xs, ys }) {
  for (const [row, bits] of values.entries()) {
    for (let col = 0; col < bits.length;) {
      const start = col++;
      while (col < bits.length && bits[col] === bits[start]) col++;
      fill(
        c,
        xs[start],
        ys[row],
        xs[col] - xs[start],
        ys[row + 1] - ys[row],
        tones[Math.round(bits[start] * 9)],
      );
    }
  }
}
function joinLens(c, at, plate, amount) {
  const { x, y, w } = bounds(plate);
  const cx = x + w / 2;
  const shoulder = Math.max(at.y, y - 42 * amount);
  line(
    c,
    [
      [at.x, at.y],
      [at.x, shoulder - 25 * amount],
      [cx, shoulder],
      [cx, y],
    ],
    amber,
    3,
  );
}
function drawNative(c, at, travel) {
  const plate = pick(frames.open, travel);
  if (travel > 0.1) joinLens(c, at, plate, travel);
  const { x, y, w, h } = bounds(plate);
  const pad = Math.round(3 + 15 * travel);
  fill(c, x - pad, y - pad, w + 2 * pad, h + 2 * pad, paper);
  raster(c, nativeStrip, plate);
  box(c, plate, amber, pad + 1);
  return plate;
}
function markGlyph(c, plate, start, opacity) {
  if (!opacity) return;
  c.save();
  c.globalAlpha *= opacity;
  const y = plate.ys.at(-1) + 28;
  line(
    c,
    [
      [plate.xs[start], y],
      [plate.xs[start + 5], y],
    ],
    amber,
    8,
  );
  c.restore();
}
function readings(c, show, match) {
  if (!show) return;
  c.save();
  c.globalAlpha *= show;
  type(c, 'Possible readings', 1040, 176, 49, '#c6d2da');
  type(c, labeledId, 1040, 330, 108, match > 0 ? accent : ink, 'Lesson Mono');
  type(c, proposedId, 1040, 466, 108, match > 0 ? '#a3b0bf' : ink, 'Lesson Mono');
  if (match > 0) {
    c.globalAlpha *= match;
    line(
      c,
      [
        [972, 285],
        [991, 304],
        [1020, 266],
      ],
      accent,
      8,
    );
  }
  c.restore();
}
function compareStrokes(c) {
  const step = 40;
  for (const [x, title, stripRows, column] of [
    [1000, 'After the 7', nativeStrip, detail.column],
    [1320, 'If it were 8', nextStrip, nextId.indexOf('8') * 6],
    [1640, 'At the end', nativeStrip, lastGlyphColumn],
  ]) {
    type(c, title, x - 12, 152, 52, ink);
    const values = stripRows.slice(0, 7).map((row) => row.slice(column, column + 5));
    const xs = Array.from({ length: 6 }, (_, i) => x + i * step);
    const ys = Array.from({ length: 8 }, (_, i) => 198 + i * step);
    raster(c, values, { xs, ys });
    outline(c, x - 3, ys[detail.row] - 3, 2 * step + 6, 2 * step + 6, cyan, 6);
  }
}
function intro(c, clock, at) {
  const id = clock.beat.id,
    cue = clock.reveal;
  const locating = id === 'c01-b01';
  const guessing = id === 'c01-b02';
  const compare = id === 'c01-b03' && cue("There's an F after the seven", 0);
  if (compare) compareStrokes(c);
  else
    readings(
      c,
      locating ? Math.max(0, 2 * cue('Here are two possible readings', 1.15) - 1) : 1,
      id === 'c01-b03' ? cue('The top reading matches', 0.3) : 0,
    );
  if (locating && !cue('Look just left', 0)) return;
  const p = locating
    ? 0.55 * cue('Look just left', 0.9)
    : guessing
      ? 0.55 + 0.45 * cue('Enlarge those same pixels', 1.4)
      : 1;
  const plate = drawNative(c, at, p);
  if (!locating) {
    markGlyph(c, plate, detail.column, guessing ? cue('After the seven', 0.3) : 1);
    markGlyph(c, plate, lastGlyphColumn, guessing ? cue('Check the last character', 0.3) : 1);
  }
  if (compare) {
    const y = plate.ys[detail.row];
    for (const column of [detail.column, lastGlyphColumn]) {
      const x = plate.xs[column];
      outline(
        c,
        x - 2,
        y - 2,
        plate.xs[column + 2] - x + 4,
        plate.ys[detail.row + 2] - y + 4,
        cyan,
        5,
      );
    }
  }
}

function screenCrop(c, region, color) {
  const [x, y, w, h] = region,
    s = frame.scale;
  outline(c, frame.x + x * s, frame.y + y * s, w * s, h * s, color, 3);
}
function comparison(c, clock, at) {
  const id = clock.beat.id,
    cue = clock.reveal;
  if (id === 'c02-b01') {
    type(c, '672 px wide', 1040, 186, 68, ink);
    const shrink = cue('Shrink the full screenshot', 0.4);
    if (shrink) type(c, '→ 224 px', 1480, 186, 68, amber);
    const average = cue('we average each square', 1.5);
    if (!average) {
      drawNative(c, at, 1);
      if (shrink) {
        for (let i = 0; i <= 48; i += 3)
          line(
            c,
            [
              [final.xs[i], final.ys[0]],
              [final.xs[i], final.ys.at(-1)],
            ],
            '#7f9db8',
            2,
          );
        for (let i = 0; i <= 9; i += 3)
          line(
            c,
            [
              [final.xs[0], final.ys[i]],
              [final.xs.at(-1), final.ys[i]],
            ],
            '#7f9db8',
            2,
          );
      }
      return;
    }
    const plate = pick(frames.average, average);
    raster(c, resizedStrip, plate);
    box(c, plate, cyan);
    if (average === 1) type(c, '3 rows', 1072, 473, 66, cyan);
    return;
  }
  const lift = id === 'c02-b04' ? cue("Now let's give four pixels numbers", 40 / 30) : 0;
  const settled = frames.average.at(-1);
  if (!lift) {
    type(c, 'Full image at 224 px', 1016, 190, 58, ink);
    raster(c, resizedStrip, settled);
    box(c, settled, cyan);
    type(c, '3 rows', 1072, 475, 62, cyan);
  }
  const open = id === 'c02-b02' ? cue('Take a native crop', 1.4) : 1;
  screenCrop(c, [448, 154, 224, 224], amber);
  const plate = drawNative(c, at, open);
  if (open === 1 && !lift) type(c, '224 px crop   ·   9 rows', 106, 590, 48, ink);
  if (id === 'c02-b03' && cue('center crop', 0) && !cue('Stretching the image', 0))
    screenCrop(c, [147, 0, 378, 378], cyan);
  if (lift) patchView(c, clock, lift, plate);
}
function selected(c, plate) {
  const { column: col, row, size } = detail;
  const x = plate.xs[col],
    y = plate.ys[row];
  const w = plate.xs[col + size] - x,
    h = plate.ys[row + size] - y;
  outline(c, x - 2, y - 2, w + 4, h + 4, '#b8c8d2', 3);
  outline(c, x - 2, y - 2, w / 2 + 4, h / 2 + 4, cyan, 7);
  return { x: x + w / 2, y };
}
function patchCell(c, x, y, side, index, color, number) {
  const on = crop[Math.floor(index / 4)][index % 4];
  fill(c, x, y, side, side, on ? ink : paper);
  outline(c, x + 1.5, y + 1.5, side - 3, side - 3, color, 3);
  if (number)
    type(
      c,
      String(index),
      x + side / 2,
      y + side * 0.7,
      side * 0.65,
      on ? matte : ink,
      'Lesson Mono',
      'center',
    );
}
const patchColors = [cyan, '#f3c872', '#dfa2c0', '#acd4a1'];
const patchIndices = [
  [0, 1, 4, 5],
  [2, 3, 6, 7],
  [8, 9, 12, 13],
  [10, 11, 14, 15],
];
export function checkPixelLens() {
  assert.equal(labeledId, 'req_7f3a');
  assert.equal(proposedId, 'req_7838');
  assert.deepEqual([nativeStrip[0].length, nativeStrip.length], [strip.columns, strip.rows]);
  assert.deepEqual(crop, [
    [0, 1, 0, 0],
    [1, 1, 1, 1],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ]);
  const eight = nextId.indexOf('8') * 6;
  assert.deepEqual(
    nextStrip.slice(2, 4).map((row) => row.slice(eight, eight + 2)),
    [
      [1, 0],
      [0, 1],
    ],
  );
  for (const [i, indices] of patchIndices.entries()) {
    const topLeft = 8 * Math.floor(i / 2) + 2 * (i % 2);
    assert.deepEqual(indices, [topLeft, topLeft + 1, topLeft + 4, topLeft + 5]);
  }
  assert.deepEqual(
    frames.lift[0].xs,
    final.xs.slice(detail.column, detail.column + detail.size + 1),
  );
  assert.deepEqual(frames.lift[0].ys, final.ys.slice(detail.row, detail.row + detail.size + 1));
}
function patchView(c, clock, lift, native) {
  const anchor = selected(c, native);
  const plate = pick(frames.lift, lift),
    square = bounds(plate);
  const cx = square.x + square.w / 2;
  line(
    c,
    [
      [anchor.x, anchor.y],
      [anchor.x, anchor.y - 38 * lift],
      [cx, square.y + square.h + 38 * lift],
      [cx, square.y + square.h],
    ],
    cyan,
    3,
  );
  raster(c, crop, plate);
  box(c, plate, '#b8c8d2', 2, 3);
  line(
    c,
    [
      [square.x - 5, plate.ys[2]],
      [square.x - 5, square.y - 5],
      [plate.xs[2], square.y - 5],
    ],
    cyan,
    8,
  );
  if (lift !== 1) return;
  type(c, '4 × 4 crop', square.x, 98, 52, ink);
  const numbers =
    clock.beat.id === 'c03-b02' ||
    (clock.beat.id === 'c03-b01' && clock.reveal('its own number', 0));
  if (!numbers) return;
  const nextBeat = clock.beat.id === 'c03-b02';
  const ready = nextBeat || clock.reveal('Unfold that square', 0);
  const first = nextBeat
    ? 1
    : (clock.reveal('Read across the top', 1) + clock.reveal('then across the bottom', 1.15)) / 2;
  const rest = clock.beat.id === 'c03-b02' ? clock.reveal('Unfold the other three', 4.4) : 0;
  const side = square.w / 4,
    target = 1460;
  for (const [i, indices] of patchIndices.entries()) {
    for (const index of indices)
      patchCell(
        c,
        plate.xs[index % 4],
        plate.ys[Math.floor(index / 4)],
        side,
        index,
        i === 0 || rest > 0 ? patchColors[i] : '#7c8994',
        true,
      );
  }
  outline(c, square.x + 2, square.y + 2, 2 * side - 4, 2 * side - 4, cyan, 7);
  if (ready) {
    type(c, 'Patch rows', target, 98, 52, ink);
    for (let j = 0; j < 4; j++) outline(c, target + j * side, square.y, side, side, '#697f90', 3);
  }
  for (const [i, indices] of patchIndices.entries()) {
    const progress = i === 0 ? first : Math.min(1, Math.max(0, 3 * rest - (i - 1)));
    for (const [j, index] of indices.entries()) {
      const t = smoothstep(Math.min(1, Math.max(0, 4 * progress - j)));
      if (!t) continue;
      const x = plate.xs[index % 4],
        y = plate.ys[Math.floor(index / 4)];
      patchCell(
        c,
        Math.round(x + (target + j * side - x) * t),
        Math.round(y + (square.y + i * side - y) * t),
        side,
        index,
        patchColors[i],
        true,
      );
    }
  }
}

export function drawPixelLens(c, clock) {
  const id = clock.beat.id;
  if (
    ![
      'c01-b01',
      'c01-b02',
      'c01-b03',
      'c02-b01',
      'c02-b02',
      'c02-b03',
      'c02-b04',
      'c03-b01',
      'c03-b02',
    ].includes(id)
  )
    return false;
  c.save();
  try {
    fill(c, 0, 0, 1920, 1080, matte);
    const at = source(c, clock);
    if (id.startsWith('c01-')) intro(c, clock, at);
    else if (id.startsWith('c02-')) comparison(c, clock, at);
    else {
      screenCrop(c, [448, 154, 224, 224], amber);
      const plate = drawNative(c, at, 1);
      patchView(c, clock, 1, plate);
    }
  } finally {
    c.restore();
  }
  return true;
}
