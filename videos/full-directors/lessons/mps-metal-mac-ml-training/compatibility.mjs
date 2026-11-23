import assert from 'node:assert/strict';
import {
  serialMpsSchedule,
  float32Neighbors,
  autocastExample,
  precisionDecision,
} from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';
import {
  board,
  box,
  chip,
  ticket,
  grid,
  arrow,
  line,
  dot,
  text,
  mono,
  serif,
  note,
  cue,
  mix,
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
  axis,
} from './bench.mjs';

export function fallback(c, k) {
  board(c, 'Where can operation U run?', 'OPERATOR DISPATCH   /   A → U → B');
  const missing = cue(k, 0, 'no MPS kernel', 0.65, 'This build has'),
    enabled = cue(k, 1, 'enable the flag');
  const out = cue(k, 1, 'detours through the CPU', 1.7, 'The ticket detours'),
    back = cue(k, 1, 'returns to MPS', 1.7, false);
  mono(c, 'MPS', 72, 258, 26, gpu);
  mono(c, 'CPU', 72, 444, 26, cpu);
  line(c, 179, 258, 1075, 258, '#afc6b9', 8);
  line(c, 388, 444, 826, 444, '#c4b294', 6);
  chip(c, 180, 210, 177, 96, 'A');
  chip(c, 524, 210, 177, 96, 'U', missing ? red : gpu);
  chip(c, 891, 210, 177, 96, 'B');
  if (missing) mono(c, 'kernel missing', 612, 180, 20, red, 'center');
  if (enabled) {
    line(c, 368, 262, 454, 444, cpu, 5);
    line(c, 762, 444, 875, 262, gpu, 5);
    chip(c, 525, 396, 177, 96, 'U', cpu);
  }
  let x = 378,
    y = 257;
  if (out) {
    x = mix(368, 454, Math.min(1, 2 * out)) + 158 * Math.max(0, 2 * out - 1);
    y = mix(262, 444, Math.min(1, 2 * out));
  }
  if (back) {
    x = mix(612, 762, Math.min(1, 2 * back)) + 113 * Math.max(0, 2 * back - 1);
    y = mix(444, 262, Math.max(0, 2 * back - 1));
  }
  dot(c, x, y, 12, gold);
  dot(c, x, y, 5, ink);
  note(
    c,
    enabled
      ? 'Before import     PYTORCH_ENABLE_MPS_FALLBACK=1'
      : 'The operands already agree. This build needs an implementation of U.',
  );
}
const fast = serialMpsSchedule(false),
  slow = serialMpsSchedule(true);
function elapsed(k, beat, phrases, parts) {
  return parts.reduce((n, p, i) => n + p.duration * cue(k, beat, phrases[i], 0.9), 0);
}
export function schedule(c, k) {
  board(c, 'Read the right edge of B', 'SERIAL DEPENDENCIES   /   ILLUSTRATIVE MILLISECONDS', true);
  const x = 236,
    w = 850,
    scale = w / 15;
  const a = elapsed(k, 0, ['Run A', 'U for two', 'then B'], fast.intervals);
  const b = elapsed(
    k,
    1,
    ['Replay A', 'Cross to the CPU', 'Run U there', 'Spend one more', 'Now B gets'],
    slow.intervals,
  );
  const cost = cue(k, 2, 'six milliseconds later');
  mono(c, 'A → U → B', x, 174, 21, mint);
  mono(c, 'Same ticket · serial operations', 1103, 174, 18, '#c4d3c4', 'right');
  for (const [row, run, time] of [
    [0, fast, a],
    [1, slow, b],
  ]) {
    const y = 228 + row * 165;
    text(c, row ? 'CPU detour' : 'MPS kernel', 72, y + 38, 23, pale);
    line(c, x, y + 76, x + w, y + 76, '#698682', 1, [4, 7]);
    for (const part of run.intervals) {
      const d = Math.min(part.duration, Math.max(0, time - part.start));
      if (!d) continue;
      const cross = part.device === 'boundary';
      const color = cross ? rose : part.device === 'cpu' ? gold : mint;
      box(c, x + part.start * scale, y, d * scale - 2, 76, color, 3);
      if (d * scale > 31)
        mono(c, cross ? '↔' : part.id, x + (part.start + d / 2) * scale, y + 38, 27, ink, 'center');
    }
    if (time === run.total) {
      line(c, x + time * scale, y - 15, x + time * scale, y + 84, pale, 2);
      mono(c, time + ' ms', x + time * scale, y - 29, 22, pale, 'center');
    }
  }
  axis(c, x, 489, w, 15, 3, '#c4d3c4', ' ms');
  note(
    c,
    cost
      ? 'Extra time    (6 − 2) ms for U  +  1 ms out  +  1 ms back  =  6 ms'
      : 'Host tokenization finishes before this clock starts.',
    ink,
    mint,
  );
}
export function dtype(c, k) {
  board(c, 'Can the allocation hold the feature pair?', 'NUMPY → PYTORCH   /   DTYPE AT PLACEMENT');
  const bad = cue(k, 0, 'MPS rejects float64'),
    cast = cue(k, 1, 'convert floating features', 0.65, 'Otherwise'),
    label = cue(k, 1, 'class indices', 0.65, 'Keep this classifier’s class indices');
  ticket(c, 76, 218, 465, 238, { name: 'NumPy features', tag: 'float64', color: gold });
  const values = float32Neighbors().input;
  values.forEach((v, i) => mono(c, v.toLocaleString('en-US'), 108, 317 + i * 69, 31));
  arrow(c, 554, 339, 645, 339, cast ? gpu : cpu);
  chip(c, 671, 221, 430, 234, '', cast ? gpu : ink);
  serif(c, cast ? 'float32 allocation' : 'MPS allocation', 887, 269, 32, pale, 'center');
  if (cast) {
    mono(c, '2 features placed', 887, 344, 27, mint, 'center');
  } else if (bad) {
    mono(c, 'float64 rejected', 887, 344, 27, rose, 'center');
  }
  if (label) mono(c, 'labels   torch.long', 888, 411, 21, pale, 'center');
  note(
    c,
    cast
      ? 'The pair fits the device dtype. Did the cast preserve the gap?'
      : bad
        ? 'Allocation fails before an operator can use fallback.'
        : 'torch.from_numpy(features) preserves float64.',
  );
}
const base = 2 ** 24;
export function precision(c, k) {
  board(c, 'Which neighbor wins the tie?', 'CPU CAST   /   ROUND TO NEAREST, TIES TO EVEN');
  const r = cue(k, 3, 'Slide the second input', 1.3),
    second = r === 1 ? base + 3 : base + 1;
  const sample = float32Neighbors(second);
  const snap = r > 0 ? cue(k, 4, 'rounds up', 1.2, false) : cue(k, 1, 'Follow both markers', 1.2);
  const target = sample.cast[1] - base;
  const unit = r > 0 ? mix(1, 3, r) : 1;
  const xpos = (v) => 142 + v * 221;
  mono(c, 'float64 input', 77, 188, 21, muted);
  line(c, 100, 270, 1093, 270, edge, 3);
  for (let i = 0; i < 5; i++) {
    line(c, xpos(i), 259, xpos(i), 283, muted, 2);
    if (i === 0 || i === 1 || i === 3)
      mono(c, (base + i).toLocaleString('en-US'), xpos(i), 232, 19, ink, 'center');
  }
  mono(c, 'float32 grid', 600, 381, 21, muted, 'center');
  line(c, 100, 420, 1093, 420, gpu, 3);
  for (let i = 0; i <= 4; i += 2) {
    const x = xpos(i);
    line(c, x, 404, x, 435, gpu, 4);
    mono(c, (base + i).toLocaleString('en-US'), x, 465, 21, ink, 'center');
    if (cue(k, 2, 'integer significand', 0.65, 'Divide the left tick'))
      mono(
        c,
        ((base + i) / 2).toLocaleString('en-US') + (i === 2 ? ' odd' : ' even'),
        x,
        509,
        17,
        muted,
        'center',
      );
  }
  for (const [start, end, col, dy] of [
    [0, 0, gpu, 0],
    [unit, target, cpu, -9],
  ]) {
    const tx = xpos(start),
      px = mix(tx, xpos(end), snap),
      py = mix(270, 420, snap) + dy;
    if (snap) line(c, tx, 270, px, py, col, 3, [5, 5]);
    dot(c, tx, 270, 5, col);
    dot(c, px, py, 10, col);
  }
  const difference = r > 0
    ? cue(k, 4, 'Converting those rounded values', 0)
    : cue(k, 1, 'The second input started halfway', 0);
  const beforeCast = cue(k, 5, 'subtract on the CPU first', 0);
  const subtract = k.beat.beatIndex === 5 && k.elapsed >= k.speechDuration;
  let msg = 'At 2²⁴, adjacent float32 values are two units apart.';
  if (snap === 1 && difference)
    msg =
      'Difference after cast     ' +
      sample.cast[1].toLocaleString('en-US') +
      ' − ' +
      base.toLocaleString('en-US') +
      ' = ' +
      (sample.cast[1] - base);
  if (beforeCast) msg = 'Subtract on CPU     16,777,219 − 16,777,216     →     cast the difference';
  if (subtract)
    msg = 'Subtract first on CPU     16,777,219 − 16,777,216 = 3     →     float32 stores 3 exactly';
  note(c, msg);
}
export function autocast(c, k) {
  const b = k.beat.beatIndex;
  board(
    c,
    b < 2 ? 'Choose where precision can change' : 'Does this candidate earn a timing run?',
    'AUTOCAST   /   HELD-OUT TICKET ROUTING',
  );
  if (b < 2) {
    mono(c, 'torch.amp.is_autocast_available("mps")', 76, 208, 29);
    const available = b === 1;
    box(c, 72, 246, 1038, 71, available ? mint : gold);
    serif(
      c,
      available
        ? 'Probe true    /    try a scoped forward pass'
        : 'If the probe is false    /    keep float32',
      94,
      282,
      32,
    );
    for (const [i, name] of ['forward', 'loss', 'backward', 'SGD step'].entries()) {
      const x = 85 + i * 267;
      box(c, x, 386, 235, 83, available && i < 2 ? gpu : ink);
      mono(c, name, x + 117, 428, 25, pale, 'center');
    }
    if (available) {
      line(c, 85, 490, 587, 490, gpu, 4);
      mono(c, 'autocast scope', 336, 519, 18, gpu, 'center');
    }
    note(
      c,
      available
        ? 'Inspect the actual operation dtypes. Float16 training can also need gradient scaling.'
        : 'Keep the float32 run as the quality reference.',
    );
    return;
  }
  const reference = cue(k, 2, 'ninety-six percent', 0.65, 'Suppose float32 routes'),
    band = cue(k, 2, 'one percentage point', 0.65, 'We agreed to stay within');
  const low = cue(k, 2, 'ninety-three percent', 0.65, 'Autocast routes ninety-three percent'),
    move = cue(k, 3, 'exactly ninety-five percent', 0.8);
  const result = autocastExample(true, move === 1 ? 9500 : 9300);
  const verdict = move === 0
    ? cue(k, 3, 'Keep the same tickets', 0)
    : cue(k, 4, 'Now compare', 0);
  const pos = (p) => 145 + (p - 92) * 151;
  if (band) box(c, pos(95), 275, pos(97) - pos(95), 151, '#c7deca', 0);
  line(c, pos(92), 389, pos(98), 389, ink, 3);
  for (let i = 92; i <= 98; i++) {
    line(c, pos(i), 378, pos(i), 400, ink, 2);
    mono(c, i + '%', pos(i), 436, 22, muted, 'center');
  }
  if (reference) {
    dot(c, pos(96), 302, 12, gpu);
    mono(c, 'float32', pos(96), 246, 23, gpu, 'center');
  }
  if (low) {
    const val = mix(93, 95, move),
      x = pos(val);
    dot(c, x, 389, 13, verdict ? (result.validation.accepted ? gpu : red) : ink);
    mono(c, 'autocast   ' + (move > 0 && move < 1 ? '…' : val + '%'), x, 488, 23, ink, 'center');
  }
  note(
    c,
    verdict
      ? result.validation.accepted
        ? '95% meets the boundary. Measure completed time and peak memory.'
        : '93% misses the 95–97% band. Keep float32 for this task.'
      : 'Both losses are finite. Compare held-out accuracy with the agreed band.',
  );
}
export function checkCompatibility() {
  assert.deepEqual([fast.total, slow.total, slow.total - fast.total], [9, 15, 6]);
  assert.deepEqual(
    slow.intervals.map((i) => i.start),
    [0, 3, 4, 10, 11],
  );
  assert.deepEqual(float32Neighbors(base + 1).cast, [base, base]);
  assert.deepEqual(float32Neighbors(base + 3).cast, [base, base + 4]);
  assert.equal(Math.fround(base + 3 - base), 3);
  for (const [bp, accepted] of [
    [9300, false],
    [9499, false],
    [9500, true],
    [9700, true],
    [9701, false],
  ])
    assert.equal(autocastExample(true, bp).validation.accepted, accepted);
  assert.equal(
    precisionDecision({ available: true, finite: false, metricDelta: 0, tolerance: 100 }).accepted,
    false,
  );
}
