import assert from 'node:assert/strict';
import { patches, E } from '../../../films/vision-transformers/fixtures.mjs';
import { visionProject } from '../../../films/vision-transformers/arithmetic.mjs';
import { labeledId, nativeStrip, nextId, nextStrip } from '../../../films/vision-transformers/incident.mjs';
import lens from './pixel-lens-frames.json' with { type: 'json' };
import {
  C,
  inks,
  rect,
  line,
  disc,
  text,
  mono,
  caption,
  title,
  fmt,
  vec,
  mix,
  range,
  sum,
  dot,
  cue,
  grid,
  cell,
  strip,
} from './canvas.mjs';

const patchShape = (width, height, p, channels, hidden) => ({
  across: width / p,
  down: height / p,
  count: ((width / p) * height) / p,
  raw: p * p * channels,
  hidden,
});
function raster(r, col) {
  if (r < 4) return '#48596b';
  if (r > 7 && r < 17 && col > 2 && col < 28) return col === 3 ? C.red : '#823f4d';
  if (r > 21 && r < 28 && col > 20 && col < 30) return C.blue;
  return C.plate;
}
export function shapes(c, k) {
  const wide = cue(k, 4, 'Try a forty-eight'),
    project = cue(k, 4, 'If the model projects'),
    counted = cue(k, 5, 'Six across and four down');
  const shape = patchShape(wide ? 48 : 32, 32, 8, 3, 256),
    side = 22,
    x = 90,
    y = 228;
  title(c, wide ? 'How many patch rows enter the projection?' : 'How many values fit in one RGB patch?');
  grid(c, x, y, 32, shape.across * 8, side, raster, 0);
  for (let col = 0; col <= shape.across; col++)
    line(c, x + col * 8 * side, y, x + col * 8 * side, y + 32 * side, C.cyan, 3);
  for (let r = 0; r <= 4; r++)
    line(c, x, y + r * 8 * side, x + shape.across * 8 * side, y + r * 8 * side, C.cyan, 3);
  rect(c, x, y, 8 * side, 8 * side, null, C.gold, 7);
  mono(c, (wide ? '48' : '32') + ' × 32 RGB', x, y - 48, 41);
  const rx = 1225;
  caption(c, 'One complete patch', rx, 300);
  mono(c, '8 × 8 × 3', rx, 385, 71, C.gold);
  text(c, shape.raw + ' values', rx, 475, 53);
  line(c, rx, 565, 1810, 565);
  caption(c, 'Patch rows × width', rx, 645);
  const rows = wide && !counted ? '?' : shape.count;
  mono(c, '[' + rows + ', ' + shape.raw + ']', rx, 739, 63, C.cyan);
  if (project) mono(c, '→ [' + rows + ', ' + shape.hidden + ']', rx, 850, 61, C.green);
  if (counted) mono(c, shape.across + ' × ' + shape.down + ' = ' + shape.count + ' patches', x, 994, 44, C.cyan);
}

const channels = [
    [1, 2, 3, 4],
    [10, 20, 30, 40],
  ],
  filters = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
  ];
const fixed = filters.flat(),
  ordered = channels.flat(),
  indices = [0, 4, 1, 5, 2, 6, 3, 7];
const interleaved = indices.map((i) => ordered[i]);
const target = sum(channels.map((r, i) => dot(r, filters[i])));
// The larger batch uses the article's input dimensions and a fixed integer filter bank.
const batchChecks = range(2).map((image) =>
  range(6).map((patch) =>
    range(5).map((filter) => {
      const channelFirst = [],
        pixelFirst = [];
      const pixel = (ch, r, col) =>
        image * 72 + ch * 24 + (2 * Math.floor(patch / 3) + r) * 6 + 2 * (patch % 3) + col;
      const weight = (ch, r, col) => (filter + 1) * (1 + ch * 4 + r * 2 + col);
      const w = [];
      let conv = filter;
      for (let ch = 0; ch < 3; ch++)
        for (let r = 0; r < 2; r++)
          for (let col = 0; col < 2; col++) {
            const value = pixel(ch, r, col),
              tap = weight(ch, r, col);
            channelFirst.push(value);
            w.push(tap);
            conv += value * tap;
          }
      for (let r = 0; r < 2; r++)
        for (let col = 0; col < 2; col++)
          for (let ch = 0; ch < 3; ch++) pixelFirst.push(pixel(ch, r, col));
      return { conv, correct: dot(channelFirst, w) + filter, wrong: dot(pixelFirst, w) + filter };
    }),
  ),
);
function batchComparison(c, k) {
  const wrong = cue(k, 6, 'Both input orders');
  title(c, 'Compare every coordinate with the convolution');
  caption(
    c,
    'Two RGB images     •     4 × 6 pixels     •     2 × 2 patches     •     five fixed filters',
    110,
    207,
  );
  batchChecks.forEach((image, i) => {
    const x = 154 + i * 910;
    text(c, 'Image ' + (i + 1), x, 305, 47, C.ink);
    image.forEach((row, r) =>
      row.forEach((d, j) => {
        const match = (wrong ? d.wrong : d.correct) === d.conv;
        const px = x + j * 103,
          py = 379 + r * 79;
        rect(c, px, py, 97, 72, match ? '#285045' : '#603b45');
        mono(c, match ? '=' : '≠', px + 48, py + 36, 49, match ? C.green : C.red, 'center');
      }),
    );
    caption(c, '6 patches × 5 outputs', x, 907);
  });
  const first = batchChecks[0][0][0];
  mono(
    c,
    (wrong ? 'Interleaved' : 'Channel-first') +
      '   ' +
      (wrong ? first.wrong : first.correct) +
      '   ' +
      (wrong ? '≠' : '=') +
      '   ' +
      first.conv +
      '   (first coordinate)',
    150,
    1003,
    40,
    wrong ? C.red : C.green,
  );
}
export function convolution(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 6) return batchComparison(c, k);
  title(c, b === 1 ? 'One filter spans both channels' : 'Which pixel meets the second weight?');
  if (b === 1) {
    channels.forEach((row, i) => {
      const x = 140 + i * 890,
        color = inks[i];
      text(c, 'Channel ' + (i + 1), x, 245, 53, color);
      ['Pixels', 'Weights'].forEach((s, j) => {
        const px = x + j * 340;
        caption(c, s, px, 350);
        (j ? filters[i] : row).forEach((v, t) =>
          cell(c, px + (t % 2) * 121, 408 + Math.floor(t / 2) * 121, 113, 113, v, color, 57),
        );
      });
      if (cue(k, 1, i ? 'contributes seven hundred' : "That's thirty"))
        mono(c, 'sum = ' + dot(row, filters[i]), x, 747, 55, color);
    });
    if (cue(k, 1, 'Together they make'))
      mono(c, '30 + 700 + 0 bias = ' + target, 960, 913, 62, C.green, 'center');
    return;
  }
  const t = cue(k, 4, 'Interleave the two channels', 1.2);
  caption(c, 'Input', 105, 307);
  caption(c, 'Filter', 105, 573);
  ordered.forEach((v, i) => {
    const start = 305 + i * 181,
      end = 305 + indices.indexOf(i) * 181;
    const y = 260 + Math.sin(Math.PI * t) * (i < 4 ? -75 : 75);
    cell(c, mix(start, end, t), y, 152, 108, v, i < 4 ? C.cyan : C.gold, 56);
    cell(c, start, 516, 152, 108, fixed[i], C.sub, 56);
  });
  const resolved = b < 4 || cue(k, 5, 'six hundred fifty');
  text(c, 'Convolution', 117, 784, 42);
  mono(c, target, 458, 784, 61, C.green);
  text(c, 'Dot product', 809, 784, 42);
  mono(
    c,
    resolved ? dot(t === 1 ? interleaved : ordered, fixed) : '?',
    1285,
    784,
    65,
    resolved ? (t === 1 ? C.red : C.green) : C.gold,
  );
  if (b === 3)
    caption(c, 'Kernel = stride = patch width     •     no padding     •     same bias', 120, 932);
}
const partial = (n) => range(2).map((j) => sum(patches[0].slice(0, n).map((v, i) => v * E[i][j])));
const glyphPatch = range(4).map((i) => {
  const row = Math.floor(i / 2);
  const col = i % 2;
  return {
    address: row * lens.detail.size + col,
    value: nativeStrip[lens.detail.row + row][lens.detail.column + col],
  };
});
function glyphSamples(c) {
  title(c, 'Read the four marked pixels on the f');
  const x = 148, y = 217, unit = 34;
  strip(c, nativeStrip, x, y, unit);
  const left = x + lens.detail.column * unit;
  const top = y + lens.detail.row * unit;
  rect(c, left, top, lens.detail.size * unit, lens.detail.size * unit, null, C.sub, 3);
  rect(c, left, top, 2 * unit, 2 * unit, null, C.cyan, 8);
  text(c, 'Location in 4 × 4 crop', x, 659, 49);
  text(c, 'Glyph value', x, 809, 49);
  caption(c, 'Dark = 0     Light = 1', x, 896);
  glyphPatch.forEach(({ address, value }, i) => {
    const px = 775 + i * 228;
    cell(c, px, 609, 168, 100, address, C.cyan);
    rect(c, px, 758, 168, 100, value ? '#e0e3e8' : '#273344', C.rim);
    mono(c, value, px + 84, 808, 52, value ? C.deep : C.ink, 'center');
  });
}
export function projection(c, k) {
  const b = k.beat.beatIndex + 1;
  if (!cue(k, 1, 'Now switch to an invented grayscale image')) return glyphSamples(c);
  title(c, 'Two measurements on a synthetic grayscale patch');
  const count = sum([
    cue(k, 3, 'Zero adds'),
    cue(k, 3, 'One adds'),
    cue(k, 3, 'Four is'),
    cue(k, 4, 'It adds'),
  ]);
  const x = 140,
    y = 275;
  const headings = ['Brightness', 'Mean weight', 'Contrast weight', 'Contribution'];
  [x, 405, 795, 1320].forEach((px, i) => caption(c, headings[i], px, y - 64));
  patches[0].forEach((v, i) => {
    const yy = y + i * 122,
      lit = i < count;
    cell(c, x, yy, 152, 97, v, C.cyan, 55);
    const gray = 17 * v;
    rect(c, x + 174, yy + 17, 63, 63, 'rgb(' + gray + ',' + gray + ',' + gray + ')', C.rim);
    mono(c, fmt(E[i][0]), 435, yy + 49, 55, C.gold);
    mono(c, fmt(E[i][1]), 850, yy + 49, 55, C.gold);
    if (lit) mono(c, vec(E[i].map((w) => w * v)), 1320, yy + 49, 56, C.ink);
  });
  line(c, 110, 800, 1800, 800);
  text(c, 'Sum so far', 120, 875, 48);
  mono(c, count ? vec(partial(count)) : '[  ,  ]', 1300, 875, 60, C.green);
  if (b === 5)
    caption(
      c,
      'Same weights on all four patches. Means in raster order     ' +
        patches.map((row) => fmt(visionProject(row)[0])).join('     '),
      120,
      990,
    );
}

function moved(row, from, to) {
  return row.map((v, i) => v + (i === to ? 1 : 0) - (i === from ? 1 : 0));
}
function cobble(c, x, y, slot, v, color, omitLast = false) {
  const xx = x + (slot % 2) * 202,
    yy = y + Math.floor(slot / 2) * 183;
  rect(c, xx, yy, 195, 177, C.plate, color, 3);
  mono(c, v, xx + 96, yy + 60, 66, C.ink, 'center');
  range(v - (omitLast ? 1 : 0)).forEach((i) =>
    disc(c, xx + 35 + (i % 5) * 31, yy + 113 + Math.floor(i / 5) * 30, 10, color),
  );
}
function chamber(c, x, row, name, color, opt) {
  const y = 306;
  text(c, name, x, 215, 51, color);
  let traveller;
  if (opt.t > 0 && opt.t <= 1) {
    const dotAt = (i, idx) => [
      x + (i % 2) * 202 + 35 + (idx % 5) * 31,
      y + Math.floor(i / 2) * 183 + 113 + Math.floor(idx / 5) * 30,
    ];
    const a = dotAt(opt.from, row[opt.from] - 1),
      z = dotAt(0, row[0]);
    const tx = mix(a[0], z[0], opt.t),
      ty = mix(a[1], z[1], opt.t);
    const landed = opt.from === 2 ? ty < y + 180 : tx < x + 198;
    if (landed) row = moved(row, opt.from, 0);
    if (opt.t < 1) traveller = { x: tx, y: ty, owner: landed ? 0 : opt.from };
  }
  row.forEach((v, i) => cobble(c, x, y, i, v, color, i === traveller?.owner));
  if (traveller) disc(c, traveller.x, traveller.y, 12, C.gold);
  const results = visionProject(row, true);
  const totals = [row[0] + row[2], row[1] + row[3]];
  mono(c, totals[0], x + 98, 732, 49, color, 'center');
  mono(c, totals[1], x + 301, 732, 49, color, 'center');
  text(c, 'column sums', x + 200, 796, 32, C.sub, 'center');
  caption(c, 'Mean', x + 460, 365);
  caption(c, 'Contrast', x + 460, 522);
  mono(c, opt.known ? fmt(results[0]) : '?', x + 460, 435, 69, opt.known ? C.green : C.gold);
  mono(c, opt.known ? fmt(results[1]) : '?', x + 460, 592, 69, opt.known ? C.green : C.gold);
  if (opt.extra) {
    line(c, x, 871, x + 690, 871, C.rim);
    mono(c, row[0] + ' − ' + row[2] + ' = ' + fmt(results[2]), x + 15, 951, 64, C.gold);
  }
}
function comparison(c, k, fresh) {
  const b = k.beat.beatIndex + 1,
    ref = patches[fresh ? 1 : 0],
    reset = !fresh && b >= 3;
  const from = reset ? 1 : 2;
  const t = reset ? cue(k, 3, 'move one unit', 1.35) : cue(k, 1, 'move one unit', 1.35);
  const extra = fresh && cue(k, 3, 'In the reference');
  const known = reset
    ? cue(k, 4, 'The contrast falls')
    : cue(k, 2, fresh ? 'Both tokens read' : 'Neither one moves');
  title(
    c,
    extra
      ? 'One more reading from the left column'
      : reset
        ? 'Move a unit across the top row'
        : 'Move a unit up the left column',
  );
  chamber(c, 128, ref, 'Reference grayscale patch', C.cyan, { known: true, extra, t: 0 });
  chamber(c, 1050, ref, 'Edited copy', C.gold, {
    known,
    extra: extra && cue(k, 3, 'In the edited patch'),
    from,
    t,
  });
  if (!extra)
    text(
      c,
      fresh && b === 2 && known
        ? 'Same position + identical token → same bridge input'
        : known
          ? reset
            ? 'Same mean. New contrast.'
            : 'Pixel change  [+1, 0, −1, 0]       Token change  [0, 0]'
          : 'Which token coordinates will change?',
      960,
      939,
      47,
      C.ink,
      'center',
    );
}
export const rank = (c, k) => comparison(c, k, false);
export function practice(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 3) return comparison(c, k, true);
  title(c, 'A second failed deployment');
  caption(c, 'Native glyphs beside Retry', 125, 229);
  strip(c, nextStrip, 125, 290, 34);
  text(c, 'Reference label', 125, 700, 41, C.sub);
  mono(c, nextId, 125, 799, 72, C.ink);
  const wrong = cue(k, 5, 'has a three'),
    matched = cue(k, 5, 'The lower reading matches');
  [labeledId, nextId].forEach((id, i) => {
    const y = 690 + i * 135;
    mono(c, id, 990, y, 76, i ? (matched ? C.green : C.ink) : wrong ? C.red : C.ink);
    if ((!i && wrong) || (i && matched))
      text(c, i ? 'exact match' : '3 ≠ 8', 1510, y, 48, i ? C.green : C.red);
  });
  if (b === 6) text(c, 'Unreadable characters leave the lookup unresolved.', 701, 228, 43, C.sub);
}
export function checkPatches() {
  assert.deepEqual(glyphPatch.map(pixel => pixel.address), [0, 1, 4, 5]);
  assert.deepEqual(glyphPatch.map(pixel => pixel.value), [0, 1, 1, 1]);
  assert.deepEqual(patchShape(48, 32, 8, 3, 256), {
    across: 6,
    down: 4,
    count: 24,
    raw: 192,
    hidden: 256,
  });
  for (const d of batchChecks.flat(2)) {
    assert.equal(d.correct, d.conv);
    assert.notEqual(d.wrong, d.conv);
  }
  assert.equal(target, 730);
  assert.equal(dot(interleaved, fixed), 650);
  assert.deepEqual(partial(3), [1.25, -1.5]);
  assert.deepEqual(partial(4), [2.5, 1]);
  assert.deepEqual(visionProject(moved(patches[0], 2, 0)), [2.5, 1]);
  assert.deepEqual(visionProject(moved(patches[0], 1, 0)), [2.5, 0]);
  assert.deepEqual(visionProject(patches[1], true), [4.5, 1, -4]);
  assert.deepEqual(visionProject(moved(patches[1], 2, 0), true), [4.5, 1, -2]);
  assert.deepEqual(
    [...nextId].flatMap((v, i) => (v === labeledId[i] ? [] : [i])),
    [6],
  );
}
