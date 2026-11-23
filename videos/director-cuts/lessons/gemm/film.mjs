import assert from 'node:assert/strict';
import { cooperativeCell } from '../../../films/gemm/model.mjs';

// These operands are the ones printed in the original movie.
const A = [[1, 2, 3], [4, 5, 6]];
const B = [[1, 2], [0, 1], [2, 0]];
const product = A.map(row => B[0].map((_, j) =>
  row.reduce((sum, a, k) => sum + a * B[k][j], 0)));
const bottomEdge = { a: A.slice(0, 1), b: B, row: 0, col: 1 };
const copied = cooperativeCell(bottomEdge);
const skipped = cooperativeCell(bottomEdge, true);

const beats = [
  { id: 'perforation', say: 'Watch the four. Take the bottom row off matrix A, and a row of answers comes away with it. What happens to the four?', hold: 1.35 },
  { id: 'three-pairs', say: 'Follow the top row of A and the right column of B. Multiply the pairs. Two plus two plus zero. We still expect four in that corner.', hold: 1.2 },
  { id: 'under-the-cut', say: 'Look underneath the cut. In this matrix multiply, four threads work together on a tile. See the one in B? On the first pass, the lower right thread copies that one into shared memory for the thread above.', hold: 1.1 },
  { id: 'skip-the-copy', say: 'Try skipping the copies from both bottom threads. In this replay the shared slots start at zero. Watch the middle pair when the upper thread reads its inputs.', hold: 1.0 },
  { id: 'short-by-two', say: 'The middle product vanished. Two times zero gives zero. The upper thread writes two. Can we get the four back with just one row of answers?', hold: 1.6 },
  { id: 'cross-the-edge', say: 'Follow the one again. Its address in B is still good. Let the lower right thread make its copy. Once the threads synchronize, the upper thread can use it.', hold: 0.85 },
  { id: 'store', say: 'Two times one puts the missing two back. The upper thread stores four. The lower thread skips its store. It had a valid input to copy all along.', hold: 2.6 },
];

const paper = '#f5f1e5';
const ink = '#201d33';
const blue = '#263b9c';
const plum = '#6b426b';
const red = '#aa3025';
const xs = [1230, 1470, 1710];
const tile = { x: 86, y: 176, w: 730, h: 300 };
const smooth = v => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function type(c, value, x, y, size, color = ink, face = 'Sans', align = 'left', weight = 400) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "Lesson ${face}"`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(value), x, y);
}
function line(c, ax, ay, bx, by, color, w = 2) {
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(bx, by);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
function circle(c, x, y, radius, fill, stroke, width = 2) {
  c.beginPath();
  c.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
}
function opacity(c, a, paint) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  paint();
  c.restore();
}

// One screen print over a second plate. The broken edge is shared by the two prints.
const tooth = Array.from({ length: 74 }, (_, i) =>
  i === 0 || i === 73 ? 0 : Math.sin(i * 2.5) * 1.1 + (i % 4 === 1 ? 3.6 : 0));
function seam(c, backwards) {
  for (let step = 0; step < tooth.length; step++) {
    const i = backwards ? tooth.length - 1 - step : step;
    c.lineTo(tile.x + i * 10, tile.y + tile.h + tooth[i]);
  }
}
function sheetPath(c, row) {
  const { x, y, w, h } = tile;
  c.beginPath();
  if (row === 0) {
    c.moveTo(x, y);
    c.lineTo(x + w, y);
    seam(c, true);
  } else {
    c.moveTo(x, y + h);
    seam(c, false);
    c.lineTo(x + w, y + 2 * h);
    c.lineTo(x, y + 2 * h);
  }
  c.closePath();
}

function paperBed(c) {
  const g = c.createLinearGradient(0, 0, 1600, 1080);
  g.addColorStop(0, '#faf6e9');
  g.addColorStop(0.65, paper);
  g.addColorStop(1, '#e9e4dc');
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
  // The faint ruled field is visible through the area beyond the output.
  for (let x = 22; x < 855; x += 28) {
    for (let y = 140; y < 866; y += 28) {
      c.fillStyle = '#645b7b28';
      c.fillRect(x, y, 2, 2);
    }
  }
}
function title(c, text, x, y) { type(c, text, x, y, 49, ink, 'Serif'); }

function outputRow(c, row, upperRight, closeup) {
  const { x, y, w, h } = tile;
  const top = y + row * h;
  sheetPath(c, row);
  c.save();
  c.clip();
  const grad = c.createLinearGradient(x, y, x + w, y + 2 * h);
  grad.addColorStop(0, '#3943aa');
  grad.addColorStop(0.6, blue);
  grad.addColorStop(1, '#1a307e');
  c.fillStyle = grad;
  c.fillRect(x, top - 5, w, h + 11);
  // Small variations in the ink follow the paper when the bottom strip moves.
  for (let yy = top + 2; yy < top + h; yy += 6) {
    const start = Math.abs(Math.sin(yy * 0.7)) * 275;
    line(c, x + start, yy, x + w, yy - 1.4, '#f3e9ff0b', 1);
  }
  line(c, x + w / 2, top + 4, x + w / 2, top + h - 4, '#eceaff70');
  for (let j = 0; j < 2; j++) {
    const left = x + j * w / 2;
    const target = row === 0 && j === 1;
    opacity(c, j === 0 ? 1 - closeup : 1, () => {
      type(c, `C[${row},${j}]`, left + 27, top + 38, 34, '#e2e3ff', 'Mono');
      const value = target ? upperRight : product[row][j];
      type(c, value, left + w / 4, top + h * 0.555, 164,
        target ? '#fff2bb' : '#f2f0ed', 'Serif', 'center');
    });
    if (target) {
      line(c, left + w / 4 - 52, top + h - 37, left + w / 4 + 52, top + h - 37, '#ffe58c', 7);
    }
  }
  c.restore();
}

function underprint(c, focus, omit, closeup) {
  const { x, y, w, h } = tile;
  c.save();
  c.beginPath();
  c.rect(x, y, w, 2 * h);
  c.clip();
  c.fillStyle = '#eacac3';
  c.fillRect(x, y, w, 2 * h);
  for (let d = -2 * h; d < w; d += 12) {
    line(c, x + d, y + 2 * h, x + d + 2 * h, y, '#b07b7b41', 2);
  }
  const top = y + h;
  for (let j = 0; j < 2; j++) {
    const left = x + w * j / 2;
    const mid = left + w / 4;
    const live = j === 1 && !omit;
    const color = live ? red : plum;
    // Ink traces meet the operand pad. These mark copy ownership in this block.
    for (let i = 0; i < 6; i++) {
      const offset = i * 10;
      c.beginPath();
      c.moveTo(left - 12, top + 234 + offset);
      c.lineTo(left + 63 - i * 3, top + 234 + offset);
      c.lineTo(mid - 38, top + 159 + offset * 0.35);
      c.lineTo(mid - 19, top + 159 + offset * 0.35);
      c.strokeStyle = '#a15d675c';
      c.lineWidth = 3;
      c.stroke();
    }
    opacity(c, j === 0 ? 1 - closeup : 1, () => {
      type(c, j ? 'Lower right thread' : 'Lower left thread', left + 25, top + 44, 34,
        '#56314f', 'Sans', 'left', 600);
      circle(c, mid, top + 151, 52, '#f5e0cf', color, 3);
      type(c, B[1][j], mid, top + 153, 62, color, 'Mono', 'center');
      type(c, `B[1,${j}]`, mid, top + 244, 35, '#674350', 'Mono', 'center');
      opacity(c, focus, () => {
        if (j === 1) circle(c, mid, top + 151, 61, null, color, 3);
      });
    });
  }
  line(c, x + w / 2, top, x + w / 2, top + h, '#a77483', 2);
  c.restore();
}

function stateAt(clock) {
  const { index, elapsed } = clock;
  const cue = (phrase, duration) => smooth(clock.reveal(phrase, duration));
  const crop = index === 0 ? smooth(0.055 + elapsed / 2.65) : 1;
  const aligned = index < 1 ? 0 : index === 1 ? cue('Follow the top row', 1.7) : 1;
  const terms = index < 1 ? 0 : index === 1 ? cue('Multiply the pairs', 0.7) : 1;
  const focus = index < 2 ? 0 : index === 2 ? cue('Look underneath', 0.65) : 1;
  const tracing = index > 2 || (index === 2 && clock.reveal('On the first pass') > 0);
  let closeup = 0;
  if (index === 2) closeup = cue('Look underneath the cut', 1.75);
  if (index === 3) closeup = 1 - cue('Watch the middle pair', 1.45);
  if (index === 5) closeup = cue('Follow the one again', 1.4) *
    (1 - cue('Once the threads synchronize', 1.7));
  const badCopy = index === 3 && clock.reveal('the shared slots start at zero', 0.25) === 1;
  const omit = (index === 3 && clock.reveal('Try skipping', 0.65) === 1) || index === 4;
  const flight = index === 2 ? cue('the lower right thread', 1.8)
    : index === 5 ? cue('Let the lower right thread', 1.8) : 0;
  const missing = badCopy || index === 4 || (index === 5 && flight < 1);
  const failedTerm = (index === 3 && clock.reveal('Watch the middle pair', 0.55) === 1)
    || index === 4 || (index === 5 && clock.reveal('Once the threads synchronize', 0.55) < 1);
  const failedOutput = (index === 3 && clock.reveal('Watch the middle pair', 1.05) === 1)
    || index === 4 || (index === 5 && clock.reveal('Once the threads synchronize', 1.2) < 1);
  const empty = index === 2 && tracing && flight < 1;
  return { crop, aligned, terms, focus, tracing, closeup, omit, flight, missing, failedTerm, failedOutput, empty };
}

function operands(c, s) {
  const t = s.aligned;
  const labelX = 902;
  title(c, 'A', labelX, 291);
  opacity(c, s.crop, () => type(c, 'top row', labelX, 345, 31, plum));
  A[0].forEach((value, k) => opacity(c, k === 1 ? 1 : 1 - s.closeup, () =>
    type(c, value, xs[k], 293, 91, ink, 'Serif', 'center')));
  opacity(c, 1 - s.crop, () => {
    A[1].forEach((value, k) =>
      type(c, value, xs[k], 403 + s.crop * 85, 90, ink, 'Serif', 'center'));
  });
  const bY = mix(647, 463, t);
  if (!s.tracing) {
    title(c, 'B', labelX, bY);
    opacity(c, t, () => type(c, 'right column', labelX, bY + 53, 31, plum));
  } else {
    type(c, 'Reads of B', labelX, bY, 47, ink, 'Serif');
    type(c, 'via shared memory', labelX, bY + 45, 29, plum);
  }
  const column = s.missing ? skipped.steps : copied.steps;
  B.forEach(([left], k) => {
    const oldY = 546 + 102 * k;
    opacity(c, 1 - Math.min(1, 4 * t), () => type(c, left, 1300, oldY, 82, ink, 'Serif', 'center'));
    const x = mix(1564, xs[k], t);
    const y = mix(oldY, 463, t);
    if (k === 1) opacity(c, s.focus, () => {
      circle(c, x, y, 61, s.missing ? '#eee1db' : '#f4d7c5', s.missing ? plum : red, 3);
    });
    opacity(c, k === 1 ? Number(!s.empty) : 1 - s.closeup, () =>
      type(c, column[k].b, x, y, 85, k === 1 && s.focus ? (s.missing ? plum : red) : ink,
        'Serif', 'center'));
  });
  opacity(c, t, () => {
    xs.forEach((x, k) => opacity(c, k === 1 ? 1 : 1 - s.closeup, () =>
      type(c, '×', x, 378, 37, '#777080', 'Sans', 'center')));
  });
  opacity(c, s.terms, () => {
    type(c, 'Products', labelX, 682, 43, ink, 'Serif');
    const steps = s.failedTerm ? skipped.steps : copied.steps;
    steps.forEach(({ product: term }, k) => {
      opacity(c, k === 1 ? Number(!s.empty) : 1 - s.closeup, () => {
        line(c, xs[k] - 68, 604, xs[k] + 68, 604, '#a9a0a5', 3);
        type(c, term, xs[k], 678, 86, k === 1 && s.focus ? (s.failedTerm ? plum : red) : ink,
          'Serif', 'center');
      });
      if (k < 2) opacity(c, 1 - s.closeup, () =>
        type(c, '+', (xs[k] + xs[k + 1]) / 2, 678, 42, '#777080', 'Sans', 'center'));
    });
  });
}

const route = [[696, 627], [747, 627], [829, 564], [1419, 564], [1451, 521]];
const lengths = route.slice(1).map(([x, y], i) => Math.hypot(x - route[i][0], y - route[i][1]));
const routeLength = lengths.reduce((a, b) => a + b);
function copyRoute(c, progress, omit) {
  c.save();
  if (omit) {
    line(c, 696, 627, 746, 627, plum, 5);
    line(c, 746, 627, 792, 592, plum, 5);
    line(c, 797, 565, 823, 591, red, 7);
    line(c, 823, 565, 797, 591, red, 7);
  } else {
    c.beginPath();
    route.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = '#a65b57';
    c.lineWidth = 4;
    c.setLineDash([10, 8]);
    c.stroke();
    c.setLineDash([]);
  }
  c.restore();
  if (progress <= 0 || progress >= 1) return;
  let distance = progress * routeLength;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const ratio = distance / lengths[i];
      const x = mix(route[i][0], route[i + 1][0], ratio);
      const y = mix(route[i][1], route[i + 1][1], ratio);
      circle(c, x, y, 28, red, paper, 4);
      type(c, copied.panels[0].right[1][1], x, y, 36, '#fff6e9', 'Mono', 'center');
      break;
    }
    distance -= lengths[i];
  }
}

function draw(c, clock) {
  const s = stateAt(clock);
  c.save();
  const magnification = 1 + 0.5 * s.closeup;
  c.scale(magnification, magnification);
  c.translate(-345 * s.closeup, -141 * s.closeup);
  paperBed(c);
  opacity(c, 1 - s.closeup, () => title(c, 'Output C', tile.x, 100));
  underprint(c, s.focus, s.omit, s.closeup);
  outputRow(c, 0, s.failedOutput ? skipped.sum : copied.sum, s.closeup);
  const edge = c.createLinearGradient(0, tile.y + tile.h, 0, tile.y + tile.h + 12);
  edge.addColorStop(0, '#473a5f32');
  edge.addColorStop(1, '#473a5f00');
  c.fillStyle = edge;
  c.fillRect(tile.x, tile.y + tile.h, tile.w, 12);
  if (s.crop < 1) {
    c.save();
    c.translate(-64 * s.crop, 399 * s.crop);
    c.translate(tile.x, tile.y + tile.h);
    c.rotate(0.115 * s.crop);
    c.translate(-tile.x, -tile.y - tile.h);
    c.globalAlpha = Math.min(1, (1 - s.crop) * 3.6);
    c.shadowColor = '#432a5540';
    c.shadowBlur = 14 * s.crop;
    c.shadowOffsetY = 7 * s.crop;
    outputRow(c, 1, copied.sum, 0);
    c.restore();
  }
  const { x, y, w, h } = tile;
  if (s.crop < 0.4) opacity(c, 1 - s.crop / 0.4, () => {
    c.setLineDash([7, 10]);
    line(c, x, y + h, x + w, y + h, '#f7eac4', 2);
    c.setLineDash([]);
  });
  operands(c, s);
  if (s.tracing) {
    copyRoute(c, s.flight, s.omit);
    opacity(c, 1 - s.closeup, () => {
      let label = 'First panel · bottom threads';
      if (s.omit) label = 'Bottom copies skipped';
      if (clock.index === 6) label = 'No bottom-row stores';
      type(c, label, tile.x, 837, 36, s.omit ? red : plum);
    });
  }
  c.restore();
}

function check() {
  assert.deepEqual(product, [[7, 4], [16, 13]]);
  assert.deepEqual(copied.steps.map(({ a, b }) => [a, b]), [[1, 2], [2, 1], [3, 0]]);
  assert.deepEqual(skipped.steps.map(s => s.product), [2, 0, 0]);
  assert.deepEqual(copied.steps.map(s => s.product), [2, 2, 0]);
  assert.equal(skipped.panels[0].right[1][1], 0);
  assert.equal(copied.panels[0].right[1][1], B[1][1]);
  assert.equal(skipped.sum, 2);
  assert.equal(copied.sum, product[0][1]);
  assert.equal(cooperativeCell({ ...bottomEdge, col: 0 }, true).sum, product[0][0]);
  return true;
}

export default { title: 'GEMM at the bottom edge', beats, draw, check };
