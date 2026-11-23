import assert from 'node:assert/strict';
import {
  featureBytes,
  allocatorCase,
  mpsWatermarkExample,
} from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';
import { largerBatch } from '../../../films/mps-metal-mac-ml-training/fixtures.mjs';
import {
  board,
  box,
  grid,
  line,
  text,
  mono,
  serif,
  note,
  cue,
  print,
  ink,
  muted,
  pale,
  gpu,
  mint,
  cpu,
  gold,
  edge,
  red,
  rose,
} from './bench.mjs';

const bytes = (n) => featureBytes({ ...largerBatch, batch: n });
const MiB = 1024 ** 2,
  mark = mpsWatermarkExample();
export function budget(c, k) {
  board(c, 'How much room does the input need?', 'TRAINING ALLOCATIONS   /   FLOAT32 FEATURES');
  const half = cue(k, 1, 'Halve the batch', 1.2),
    n = half === 1 ? 16 : 32;
  for (let i = 0; i < 32; i++) {
    const x = 70 + (i % 8) * 68,
      y = 212 + Math.floor(i / 8) * 78;
    box(c, x, y, 58, 66, i < 16 ? gpu : half === 1 ? '#d9dbcc' : gpu, 5);
    if (i < 16 || half !== 1) {
      c.save();
      c.globalAlpha = i < 16 ? 1 : 1 - half;
      for (let j = 0; j < 3; j++) line(c, x + 9, y + 21 + j * 10, x + 48, y + 21 + j * 10, mint, 3);
      c.restore();
    }
  }
  mono(c, 'ONE TILE = ONE TICKET', 71, 523, 18, muted);
  serif(c, 'Raw input', 681, 226, 33);
  mono(c, bytes(n) / MiB + ' MiB', 678, 324, 59, gpu);
  mono(c, n + ' × 128 × 768 × 4 B', 682, 416, 27);
  note(c, 'Also budget for weights, activations, gradients, temporaries and any optimizer state.');
}
function segments(c, y, segments, x, scale) {
  let used = 0;
  for (const [name, v, col, inside] of segments) {
    if (v <= 0) continue;
    const xx = x + scale * used,
      w = scale * v;
    box(c, xx, y, w - 1, 74, col, 3);
    if (w > 50) {
      text(c, name, xx + w / 2, y + 24, 18, inside, 'Sans', 'center');
      mono(c, Number(v.toFixed(0)), xx + w / 2, y + 52, 22, inside, 'center');
    }
    used += v;
  }
}
export function allocator(c, k) {
  board(c, 'Will the next activation fit?', 'METAL PROCESS LEDGER   /   ILLUSTRATIVE MiB');
  const release = cue(k, 1, 'Empty cache releases', 1.2);
  const outline = cue(k, 1, 'Watch the outlined block', 0);
  const request = cue(k, 1, 'next activation request', 1.2);
  const half = cue(k, 2, 'Try half the batch', 1);
  const now = allocatorCase(half === 1 ? 2 : release === 1 ? 1 : 0),
    cache = 16 * (1 - release);
  const x = 87,
    s = 16.9;
  mono(c, 'Allocated before the request', x, 201, 23, muted);
  function parts(cache) {
    return [
      ['input', now.input, mint, ink],
      ['state', now.state, gpu, pale],
      ['driver', now.other, gold, ink],
      ['cache', cache, '#939a8e', ink],
    ];
  }
  segments(c, 235, parts(cache), x, s);
  const live = now.input + now.state,
    driver = live + now.other + cache;
  mono(c, 'live tensors   ' + live + ' MiB', x, 340, 22, gpu);
  mono(c, 'Metal process   ' + Math.round(driver) + ' MiB', 465, 340, 22, muted);
  const limit = x + 48 * s;
  line(c, limit, 195, limit, 503, red, 3, [8, 5]);
  mono(c, '48 MiB limit', limit + 10, 184, 20, red, 'center');
  if (outline && release === 1) {
    const left = x + driver * s;
    const width = now.requested * s;
    const color = now.accepted ? gpu : red;
    segments(c, 408, parts(cache), x, s);
    box(c, left, 408, width, 74, '#eeeadd', 3, muted);
    box(c, left, 408, width * request, 74, now.accepted ? mint : rose, 3);
    text(c, 'activation request', left + width / 2, 432, 18, ink, 'Sans', 'center');
    mono(c, now.requested + ' MiB', left + width / 2, 460, 22, ink, 'center');
    if (request === 1)
      mono(c, (now.accepted ? 'After allocation   ' : 'Projected peak   ') + now.peak + ' MiB', x, 512, 23, color);
    if (half === 1) mono(c, 'Full batch needed 56 MiB', 1094, 512, 20, muted, 'right');
  } else if (release === 1) {
    mono(c, 'Room left   ' + (now.budget - driver) + ' MiB', x, 438, 30, gpu);
  } else {
    serif(c, 'Which blocks can empty_cache() release?', x, 438, 34);
  }
  note(
    c,
    half === 1
      ? 'Fixed state and driver extras still occupy 20 MiB.'
      : release === 1
        ? 'Releasing the empty cache leaves all live tensors in place.'
        : 'Metal process = live tensors + unused cache + driver extras.',
  );
}
const q = [0.5, 1, -0.5, -1],
  keys = [1, -1, 2, 0],
  values = [1, 3, 2, 4];
function tileState(count) {
  const sums = [0, 0, 0, 0],
    den = [0, 0, 0, 0],
    scores = [];
  for (let tile = 0; tile < count; tile++) {
    const qr = tile < 2 ? 0 : 2,
      kc = 2 * (tile % 2);
    scores.length = 0;
    for (let i = qr; i < qr + 2; i++)
      for (let j = kc; j < kc + 2; j++) {
        const score = q[i] * keys[j],
          a = Math.exp(score);
        scores.push(score);
        sums[i] += a * values[j];
        den[i] += a;
      }
  }
  return { scores, sums, den, outputs: sums.map((v, i) => (den[i] ? v / den[i] : null)) };
}
export function limits(c, k) {
  const b = k.beat.beatIndex;
  const count = Math.floor(
    cue(k, 4, 'first two queries and the first two keys', 0.65, 'Start with the first two queries') +
    cue(k, 5, 'Move to the other two keys') +
    cue(k, 5, 'For the last two queries') +
    cue(k, 6, 'Finish with the last two keys'),
  );
  board(
    c,
    b < 2
      ? 'Which memory number sets the limit?'
      : b === 2
        ? 'Halve the number of tickets'
        : count === 0
          ? 'Halve the length of each ticket'
          : 'Reuse four score slots',
    'WORKING SET   /   BATCH AND SEQUENCE LENGTH',
  );
  if (b < 2) {
    const limit = cue(k, 0, 'hard limit is ten', 0.65, 'In this example the hard limit');
    serif(c, 'Recommended working set', 77, 219, 29);
    mono(c, mark.recommendedGiB + ' GiB', 76, 305, 55, gpu);
    text(c, '×', 359, 304, 52, muted);
    mono(c, mark.ratio, 455, 305, 52);
    text(c, 'high ratio', 458, 371, 21, muted);
    text(c, '=', 662, 304, 52, muted);
    mono(c, limit ? mark.limitGiB.toFixed(1) + ' GiB' : '?', 762, 305, 54, red);
    line(c, 77, 423, 1095, 423, edge, 2);
    text(
      c,
      b === 0
        ? 'Metal supplies the recommendation for this machine.'
        : 'The low watermark triggers more aggressive cleanup and command-buffer commits.',
      77,
      475,
      23,
    );
    note(
      c,
      b === 0
        ? 'Use the recommended working set in this multiplication.'
        : 'A high ratio of zero disables the hard limit. Shrink the live workload first.',
    );
  } else if (b === 2) {
    const half = cue(k, 2, 'Halving batch size') && !cue(k, 2, 'Put all four tickets back');
    grid(c, 91, 218, 8, 4, 507, 268, gpu, (i) => (half && i >= 2 ? '#d4d7c9' : gpu));
    mono(c, 'one row per ticket', 95, 520, 21, muted);
    serif(c, 'Batch dimension', 658, 229, 31);
    mono(c, half ? '2 × 8 × 16' : '4 × 8 × 16', 658, 323, 39, gpu);
    text(c, '8 positions per ticket', 659, 426, 25);
    note(c, 'An encoder that materializes full attention has another allocation to consider.');
  } else {
    const short = cue(k, 4, 'Four queries meet four keys') > 0;
    const n = short ? 4 : 8;
    const { scores } = tileState(count);
    mono(c, 'One ticket · one head', 77, 192, 20, muted);
    const side = 286,
      cell = side / 8;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const valid = i < n && j < n,
          id = Math.floor(i / 2) * 2 + Math.floor(j / 2);
        let fill = valid ? gpu : '#dbddcf';
        if (count && valid) fill = id === count - 1 ? cpu : id < count ? mint : gpu;
        box(c, 87 + j * cell, 221 + i * cell, cell - 3, cell - 3, fill, 2);
      }
    mono(c, n + ' × ' + n + ' = ' + n * n + (count ? ' pairs' : ' scores'), 87, 525, 24);
    if (count) {
      mono(c, 'REUSABLE SCORE TILE', 491, 222, 22, muted);
      scores.forEach((v, i) => {
        const x = 499 + (i % 2) * 108,
          y = 267 + Math.floor(i / 2) * 90;
        box(c, x, y, 99, 79, gold);
        mono(c, print(v, 1), x + 50, y + 40, 24, ink, 'center');
      });
      mono(c, count * 4 + ' / 16 pairs', 498, 485, 23, cpu);
      const st = tileState(count);
      serif(c, 'Running result', 805, 245, 28);
      const index = count > 2 ? 2 : 0;
      mono(c, 'query ' + (index + 1), 808, 306, 22, muted);
      mono(c, 'Σ exp(s)·v  ' + st.sums[index].toFixed(2), 806, 361, 20);
      mono(c, 'Σ exp(s)    ' + st.den[index].toFixed(2), 806, 410, 20);
      if (count % 2 === 0) mono(c, 'output     ' + st.outputs[index].toFixed(2), 806, 471, 20, gpu);
    } else {
      serif(c, 'Each query meets every key.', 480, 266, 34);
      mono(c, 'queries × keys', 481, 352, 26, muted);
      text(
        c,
        short
          ? 'The shorter square occupies one quarter of the cells.'
          : 'How many cells survive when both axes halve?',
        479,
        417,
        23,
      );
    }
    note(
      c,
      count
        ? 'Each tile replaces the previous scores. Per-query running totals survive the replacement.'
        : 'Here the full score matrix is stored. Other kernels can tile this calculation.',
    );
  }
}
export function checkMemory() {
  assert.equal(bytes(32) / MiB, 12);
  assert.equal(bytes(16) / MiB, 6);
  for (const i of [0, 1, 2]) {
    const a = allocatorCase(i);
    assert.equal(a.peak, a.input + a.state + a.other + a.cached + a.requested);
    assert.equal(a.accepted, a.peak <= a.budget);
  }
  assert.equal(mark.limitGiB.toFixed(1), '10.2');
  assert.equal(mpsWatermarkExample(6, 0).limitDisabled, true);
  const tiled = tileState(4);
  assert.equal(tiled.scores.length, 4);
  q.forEach((qi, i) => {
    const weights = keys.map((k) => Math.exp(qi * k)),
      den = weights.reduce((a, b) => a + b);
    const dense = values.reduce((total, v, j) => total + (v * weights[j]) / den, 0);
    assert(Math.abs(tiled.outputs[i] - dense) < 1e-12);
  });
}
