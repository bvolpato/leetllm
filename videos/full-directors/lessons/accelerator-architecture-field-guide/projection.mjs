import assert from 'node:assert/strict';
import {
  projection,
  product2x2State,
} from '../../../films/accelerator-architecture-field-guide/arithmetic.mjs';
import { C, arrow, base, box, chip, clamp, cue, dot, foot, lerp, num, path, txt } from './drawing.mjs';

const prompts = 8,
  length = 4096,
  weights = 86;
const shapes = [prompts * length, prompts];
const modes = ['Prefill', 'Decode'];
const fmt = (ms) => (ms >= 1 ? ms.toFixed(2) + ' ms' : (ms * 1000).toFixed(1) + ' µs');
function matrix(g, x, y, w, h) {
  chip(g, x, y, w, h, C.paleGold, C.brass);
  for (let i = 0; i < 17; i++)
    for (let j = 0; j < 6; j++) {
      const v = (i * 11 + j * 7) % 8;
      box(
        g,
        x + 12 + (i * (w - 24)) / 17,
        y + 12 + (j * (h - 24)) / 6,
        (w - 24) / 17 - 3,
        (h - 24) / 6 - 3,
        v < 3 ? C.gold : v < 5 ? C.brass : '#d8914c',
      );
    }
  box(g, x + w / 2 - 66, y + h / 2 - 23, 132, 46, C.white);
  txt(g, 'W', x + w / 2, y + h / 2, 38, C.brass, 'center', 'Mono', 600);
}
function axisX(ms) {
  return 420 + Math.log10(ms * 1000) * 301;
}
export function roof(g, k) {
  const i = k.beat.beatIndex;
  const active = i === 0 ? 0 : 1;
  const feed =
    i < 2 ? cue(k, k.beat.id, i === 0 ? 'Watch the code assistant' : 'Now the assistant', 2.3) : 1;
  const entered = i > 0 || cue(k, 'prompt', 'Seven other prompts', 0) > 0;
  const drawSecond = i > 1 || cue(k, 'token', 'Those eight rows', 0) > 0;
  const rate = lerp(200, 400, cue(k, 'upgrade', 'Double the arithmetic rate', 1.4));
  const pred = i === 2 && k.reveal('Keep bandwidth fixed', 0);
  base(g, 'Assistant   /   projection', 'Which finish can faster arithmetic move?');
  txt(
    g,
    active ? 'Latest token   “return”' : 'Prompt   “Explain this function…”',
    85,
    245,
    36,
    C.ink,
    'left',
    'Serif',
  );
  for (let j = 0; j < (entered ? 8 : 1); j++) {
    const yy = 289 + j * 15;
    box(g, 90, yy, active ? 52 : 300, 9, j === 0 ? C.blue : C.line);
    if (j === 0) dot(g, active ? 149 : 396, yy + 4, 6, C.blue);
  }
  txt(g, active ? '1 new row per request' : '4,096 positions per prompt', 86, 455, 32, C.blue);
  arrow(g, 442, 344, 782, 344, C.blue, 4);
  for (let n = 0; n < 4; n++) {
    const t = Math.max(0, Math.min(1, feed * 1.25 - n * 0.08));
    if (t > 0 && t < 1) box(g, lerp(460, 760, t) - 12, 332, 24, 24, C.blue);
  }
  matrix(g, 806, 271, 293, 143);
  txt(g, weights + ' MiB', 952, 456, 30, C.brass, 'center', 'Mono');
  arrow(g, 1121, 344, 1369, 344, C.dim);
  txt(g, 'Output features', 1397, 274, 39, C.ink, 'left', 'Serif');
  const outputRows = entered ? 8 : 1;
  for (let j = 0; j < outputRows; j++)
    for (let c = 0; c < 12; c++) {
      box(g, 1398 + c * 32, 303 + j * 14, 29, 10, (c + j) % 3 ? C.paleBlue : C.blue);
    }
  txt(g, '11,008 per row', 1397, 451, 32, C.blue);
  txt(g, 'Finish time', 80, 510, 32, C.dim);
  txt(g, 'Log scale', 82, 548, 25, C.dim);
  const baselineY = 576;
  path(
    g,
    [
      [axisX(0.001), baselineY],
      [axisX(25), baselineY],
    ],
    C.dim,
  );
  for (const [v, s] of [
    [0.001, '1 µs'],
    [0.01, '10 µs'],
    [0.1, '100 µs'],
    [1, '1 ms'],
    [10, '10 ms'],
  ]) {
    const x = axisX(v);
    path(
      g,
      [
        [x, 566],
        [x, 800],
      ],
      C.line,
      1.5,
    );
    txt(g, s, x, 537, 26, C.dim, 'center', 'Mono');
  }
  for (let row = 0; row < (drawSecond ? 2 : entered ? 1 : 0); row++) {
    const y = 633 + row * 126,
      d = projection(shapes[row], rate * 1e12);
    txt(g, modes[row], 82, y - 4, 43, C.ink, 'left', 'Serif');
    txt(g, num(shapes[row]) + ' rows', 84, y + 33, 26, C.dim);
    const vals = [
      [d.computeMs, C.blue, false],
      [d.memoryMs, C.brass, true],
    ];
    for (const [ms, col, diamond] of vals) {
      const xx = axisX(ms),
        yy = y + (diamond ? 18 : -15);
      path(
        g,
        [
          [axisX(0.001), yy],
          [xx, yy],
        ],
        col,
        3,
      );
      if (i === 3 && !diamond) dot(g, axisX(projection(shapes[row]).computeMs), yy, 8, C.line);
      dot(g, xx, yy, 13, col, diamond);
      txt(g, fmt(ms), xx + 20, yy + (diamond ? 11 : -8), 28, col, 'left', 'Mono', 600);
    }
  }
  if (i === 3)
    foot(
      g,
      'Compute ceiling   ' + Math.round(rate) + ' TFLOP/s      •      Bandwidth   1 TB/s',
      'Perfect overlap • Later finish sets the floor for this isolated projection.',
    );
  else
    foot(
      g,
      pred
        ? 'Double arithmetic speed. Which later finish moves?'
        : 'Blue circle   arithmetic finish       •       Copper diamond   last byte',
      'Exercise ceilings     200 TFLOP/s  ·  1 TB/s     /     ideal overlap',
    );
}

const cells = product2x2State(8);
const firstRowProducts = cells.sums[0].map((_, column) =>
  cells.B.map((row, feature) => cells.A[0][feature] * row[column]),
);
function systolic(g, k) {
  const answering = k.beat.id === 'sum';
  const step = answering
    ? 3
    : k.reveal('Send one and two', 1.1) + 2 * k.reveal('Products from the upper cells', 2.5);
  const revealed = ['Nineteen comes out on the left', 'produces twenty-two'].map((phrase) => {
    if (!answering) return false;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  });
  base(
    g,
    'Matrix engine   /   weight-stationary array',
    'What comes out of the first column?',
    'Input row [1, 2]   ×   two weight columns',
  );
  const xs = [775, 1320];
  const rails = [339, 543];
  const inputX = 352;
  const cellOffset = 43;
  const cellHeight = 73;
  const outputsY = 724;
  const [upperY, lowerY] = rails.map((y) => y + cellOffset + cellHeight / 2);

  for (const [row, railY] of rails.entries()) {
    txt(g, 'Feature ' + (row + 1), 90, railY, 36, C.blue);
    arrow(g, inputX, railY, xs[1] + 72, railY, C.blue, 3);
  }
  for (const [column, x] of xs.entries()) {
    txt(g, column === 0 ? 'First column' : 'Second column', x, 283, 31, C.dim, 'center');
    for (const [row, railY] of rails.entries()) {
      arrow(g, x, railY + 6, x, railY + cellOffset - 11, C.blue, 3);
      chip(
        g,
        x - 92,
        railY + cellOffset,
        184,
        cellHeight,
        C.paleGold,
        C.brass,
        '× ' + cells.B[row][column],
      );
    }
    const partialX = x + 170;
    const hasProduct = step >= column + 1;
    const combined = step >= column + 2;
    const color = hasProduct ? C.teal : C.line;
    const [upperProduct, lowerProduct] = firstRowProducts[column];
    path(
      g,
      [
        [x + 94, upperY],
        [partialX, upperY],
        [partialX, lowerY],
      ],
      color,
      3,
    );
    arrow(g, partialX, lowerY, x + 98, lowerY, color, 3);
    if (hasProduct) {
      const transfer = clamp(step - column - 1);
      const partialY = lerp(upperY, lowerY, clamp(transfer / 0.8));
      const arrivalX = lerp(partialX, x + 142, clamp((transfer - 0.8) / 0.2));
      box(g, arrivalX - 32, partialY - 25, 64, 50, C.mint, C.teal);
      txt(g, upperProduct, arrivalX, partialY, 36, C.teal, 'center', 'Mono', 600);
    }
    const outputColor = combined ? C.teal : C.line;
    arrow(g, x, lowerY + cellHeight / 2 + 11, x, outputsY - 8, outputColor, 3);
    box(g, x - 123, outputsY, 345, 68, C.white, outputColor);
    const answerX = x + 170;
    const answerY = outputsY + 34;
    if (combined) {
      const addition = upperProduct + ' + ' + lowerProduct + ' =';
      txt(g, addition, x - 102, answerY, 40, C.ink, 'left', 'Mono');
    }
    box(g, answerX - 45, answerY - 27, 90, 54, revealed[column] ? C.mint : C.paper);
    const answer = revealed[column] ? cells.sums[0][column] : '?';
    txt(g, answer, answerX, answerY, 44, C.teal, 'center', 'Mono', 600);
  }
  // Each feature enters one step after the previous feature.
  for (const [row, railY] of rails.entries()) {
    const advance = clamp(step - row) + clamp(step - row - 1);
    const start = advance < 1 ? inputX : xs[0];
    const end = advance < 1 ? xs[0] : xs[1];
    const x = lerp(start, end, advance < 1 ? advance : advance - 1);
    dot(g, x, railY, 27, C.paleBlue);
    txt(g, cells.A[0][row], x, railY, 33, C.blue, 'center', 'Mono', 600);
  }
  foot(
    g,
    revealed[1]
      ? 'Output row    [ ' + cells.sums[0].join(',  ') + ' ]'
      : step === 3
        ? 'Add the two products in each column.'
        : 'Activations move right. Partial sums move down.',
  );
}
function reuse(g, k) {
  const p = cue(k, 'intensity', 'Increase the row count', 2.2);
  const rows = Math.round(prompts * length ** p);
  const d = projection(rows);
  base(
    g,
    'Matrix projection   /   cold BF16 inputs',
    'How much work do the same weights do?',
    'Each row has 4,096 input features and produces 11,008 output features.',
  );
  const x = 99,
    y = 345,
    w = 353,
    h = 277;
  txt(g, 'Token rows', x, 290, 38, C.blue, 'left', 'Serif');
  for (let j = 0; j < 8; j++) {
    box(g, x, y + j * 35, w, 28, C.paleBlue, C.blue);
    const density = Math.min(6, Math.floor(Math.log2(rows / 8) + 0.01));
    for (let l = 1; l <= density; l++)
      path(
        g,
        [
          [x + 5, y + j * 35 + (l * 28) / (density + 1)],
          [x + w - 5, y + j * 35 + (l * 28) / (density + 1)],
        ],
        C.blue,
        1,
      );
  }
  txt(g, num(rows) + ' rows', x, y + h + 45, 44, C.blue, 'left', 'Mono', 600);
  txt(g, '×', 540, 480, 75, C.dim, 'center');
  matrix(g, 630, 351, 370, 255);
  txt(g, '86 MiB in both passes', 815, 668, 32, C.brass, 'center');
  arrow(g, 1034, 482, 1179, 482, C.dim);
  txt(g, 'Work per byte', 1236, 342, 41, C.ink, 'left', 'Serif');
  txt(
    g,
    d.intensity.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    1230,
    454,
    94,
    C.teal,
    'left',
    'Serif',
  );
  txt(g, 'FLOP / byte', 1237, 549, 37, C.teal, 'left', 'Mono');
  txt(g, 'Eight bands group the token rows.', 90, 748, 31, C.dim);
  foot(
    g,
    'Work   2MKN       ÷       traffic   2(MK + KN + MN)',
    'One BF16 read of X and W, one BF16 write of Y. M counts scheduled rows.',
  );
}
function padding(g, k) {
  base(
    g,
    'Matrix engine   /   padded decode tile',
    'How many rows do useful work?',
    'One hypothetical tile • each stripe represents one row',
  );
  const p = k.reveal('Six and a quarter', 0);
  for (let i = 0; i < 128; i++) {
    const col = Math.floor(i / 32),
      r = i % 32;
    box(g, 100 + col * 415, 322 + r * 13, 374, 10, i < 8 ? C.blue : '#d4d8cd');
  }
  for (let i = 0; i < 4; i++)
    txt(g, 'Rows ' + (i * 32 + 1) + '–' + (i * 32 + 32), 100 + i * 415, 290, 32, C.dim);
  foot(
    g,
    p ? '8 / 128 = ' + (100 * 8) / 128 + '% useful rows' : 'Eight input rows in a 128-row tile',
    'Chip utilization also depends on concurrent work, engine scheduling, and achieved throughput.',
  );
}
export function projectionScene(g, k) {
  if (k.beat.beatIndex < 2) systolic(g, k);
  else if (k.beat.id === 'padding') padding(g, k);
  else reuse(g, k);
}
export function checkProjection() {
  const [pre, dec] = shapes.map((r) => projection(r));
  assert.equal(pre.rows, 32768);
  assert.equal(dec.rows, 8);
  assert.equal((2 * 4096 * 11008) / 2 ** 20, weights);
  assert.deepEqual(
    [pre.intensity, dec.intensity].map((n) => n.toFixed(1)),
    ['2736.0', '8.0'],
  );
  for (const phase of [pre, dec]) {
    const after = projection(phase.rows, 400e12);
    assert.equal(phase.computeMs / 2, after.computeMs);
    assert.equal(phase.memoryMs, after.memoryMs);
    assert(axisX(phase.computeMs) > axisX(after.computeMs));
    assert.equal(after.floorMs, phase === pre ? pre.computeMs / 2 : dec.memoryMs);
  }
  assert.deepEqual(firstRowProducts, [[5, 14], [6, 16]]);
  assert.deepEqual(cells.sums[0], [19, 22]);
}
