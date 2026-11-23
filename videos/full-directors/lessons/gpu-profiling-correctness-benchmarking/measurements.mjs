import assert from 'node:assert/strict';
import { regimes } from '../../../films/gpu-profiling-correctness-benchmarking/fixtures.mjs';
import {
  rotationPool,
  rooflineFixture,
} from '../../../films/gpu-profiling-correctness-benchmarking/model.mjs';
import { C, text, mono, box, line, path, dot, page, note, cue, f } from './instruments.mjs';

const pick = 3,
  labels = ['First use', 'Warm • same buffers', 'Warm • rotating buffers'];
const colors = [C.amber, C.mint, C.blue];
const reuseSlots = regimes[1].map(() => 0);
const rotatingSlots = regimes[2].map((_, index) => index);
function runState(c) {
  const focus = cue(c, 1, 'Follow launch four');
  const reuseKnown = cue(c, 2, 'Slot zero again');
  const rotationKnown = cue(c, 2, 'Slot three');
  return {
    focus,
    policyShown: cue(c, 1, 'six distinct slots'),
    timesShown: cue(c, 2, 'The event times'),
    slots: [reuseSlots, rotatingSlots].map((slots, row) =>
      slots.slice(0, pick + 1).map((value, i) =>
        i === pick && !(row === 0 ? reuseKnown : rotationKnown) ? '?' : value,
      ),
    ),
  };
}
export function drawRuns(g, c) {
  const cold = cue(c, 0, 'Follow it to the sixth launch', 2.2);
  const warm = cue(c, 1, 'One run reuses', 2);
  const { focus, policyShown, timesShown, slots } = runState(c);
  page(g, focus ? 'Which history belongs to launch four?' : 'How does the event time change?',
    'event samples   /   constructed runs', true);
  const xx = (i) => 595 + i * 217;
  mono(g, 'Completed launch', 82, 273, 30, C.faint);
  mono(g, 'Event time (µs)', 84, 316, 25, C.faint);
  for (let i = 0; i < 6; i++) mono(g, i + 1, xx(i), 271, 32, C.faint, 'center');
  if (focus) box(g, xx(pick) - 68, 299, 136, 513, '#28484c', null, 12);
  regimes.forEach((values, row) => {
    const base = 458 + row * 165,
      visible = row === 0 ? 1 + Math.floor(5 * cold) : Math.floor(6 * warm);
    const pts = values.slice(0, visible).map((v, i) => [xx(i), base - 2 * v]);
    line(g, xx(0) - 50, base, xx(5) + 55, base, C.gridDark);
    text(g, labels[row], 85, base - 48, 37, colors[row]);
    if (pts.length) path(g, pts, colors[row], 4);
    pts.forEach(([x, y], i) => {
      dot(g, x, y, 10, colors[row]);
      mono(g, values[i], x, y - 33, 32, colors[row], 'center');
    });
    if (focus && row > 0) {
      for (let j = 0; j <= pick; j++) {
        mono(g, 'slot ' + slots[row - 1][j], xx(j), base + 25, 27, C.light, 'center');
      }
    }
  });
  note(
    g,
    timesShown
      ? `Launch 4   ·   ${regimes[1][pick]} µs in slot ${slots[0][pick]}   /   ${regimes[2][pick]} µs in slot ${slots[1][pick]}`
      : policyShown
        ? `Rotation starts at slot 0 and advances by one through ${rotatingSlots.length} distinct slots.`
        : 'One event interval per completed launch',
    true,
  );
}

const n = 1000003,
  l2 = 50331648,
  free = 14884405248;
const pool = rotationPool(n, l2, free),
  mb = (v) => f(v / 1e6, 2) + ' MB';
export function poolState(c) {
  const ten = cue(c, 1, 'The pool crosses');
  const count = ten ? pool.slots : pool.slots - 1;
  const warmed = cue(c, 1, 'Touch each slot twice', 2.4);
  return { count, bytes: count * pool.slot, steps: Math.floor(warmed * pool.warmup) };
}
export function drawPool(g, c) {
  const s = poolState(c),
    left = 124,
    w = 153,
    x = (bytes) => left + (w * bytes) / pool.slot;
  page(
    g,
    'How many slots reach the rotation target?',
    'buffer rotation   /   whole-slot allocation',
  );
  mono(g, '1 slot = X + Z + Y ≈ ' + mb(pool.slot), 89, 285, 42);
  mono(g, 'L2 ≈ ' + mb(l2), 1815, 285, 38, C.muted, 'right');
  text(g, 'Eight slots', 120, 394, 33, C.muted);
  mono(g, mb(8 * pool.slot), 120, 450, 47);
  text(g, 'Twice L2 plus a slot', 725, 394, 33, C.muted);
  mono(g, mb(2 * l2 + pool.slot), 725, 450, 47);
  const xt = x(pool.target);
  line(g, xt, 515, xt, 775, C.b, 4, [10, 6]);
  mono(g, 'target  ' + mb(pool.target), xt - 12, 528, 29, C.b, 'right');
  for (let i = 0; i < pool.slots; i++) {
    const px = left + i * w,
      active = i < s.count;
    box(g, px + 3, 587, w - 7, 124, active ? C.white : null, active ? C.ink : C.grid, 8);
    if (!active) continue;
    const selected = s.steps > 0 && (s.steps - 1) % s.count === i;
    [C.teal, C.a, C.b].forEach((col, j) => box(g, px + 13, 601 + j * 12, w - 27, 8, col, null, 2));
    mono(g, String(i).padStart(2, '0'), px + w / 2, 676, 32, selected ? C.b : C.ink, 'center');
    if (selected) line(g, px + 15, 701, px + w - 15, 701, C.b, 6);
  }
  mono(g, s.count + ' slots  ×  ' + mb(pool.slot) + '  ≈  ' + mb(s.bytes), 119, 804, 45);
  if (s.steps > 0)
    mono(g, 'warmup  ' + s.steps + ' / ' + pool.warmup, 1800, 802, 35, C.teal, 'right');
  note(g, 'Pool target = max(8 slots, 2 × L2 + 1 slot)   ·   Pool budget = ¼ of free memory.');
}

const transfers = [
  ['load X', C.mint],
  ['load Z', C.blue],
  ['store Y', C.salmon],
];
export function trafficState(c) {
  const interval = cue(c, 1, 'The useful rate climbs') ? 3 : 8;
  const bytes = transfers.length * 4 * n;
  return {
    interval,
    bytes,
    rate: bytes / (interval * 1000),
    counted: cue(c, 0, 'Twelve useful bytes'),
    measured: cue(c, 0, 'About fifteen hundred'),
  };
}
export function drawTraffic(g, c) {
  const s = trafficState(c);
  page(g, 'What does useful bandwidth count?', 'triad_f32   /   useful bandwidth', true);
  transfers.forEach(([name, color], i) => {
    const xx = 144 + i * 570;
    text(g, name, xx, 314, 48, color, 'left', 'Serif');
    for (let j = 0; j < 4; j++) box(g, xx + 86 * j, 375, 79, 94, color, null, 5);
    mono(g, '4 bytes', xx, 510, 35, C.light);
  });
  if (s.counted) {
    mono(g, '12 B × 1,000,003 = ' + s.bytes.toLocaleString('en-US') + ' B', 140, 604, 40, C.light);
    line(g, 140, 649, 1778, 649, C.gridDark);
  }
  if (s.measured) {
    mono(g, s.interval + ' µs', 142, 724, 41, C.faint);
    const left = 443,
      unit = 0.24;
    box(g, left, 699, s.rate * unit, 53, C.mint, null, 4);
    mono(
      g,
      Math.round(s.rate).toLocaleString('en-US') + ' GB/s',
      left + s.rate * unit + 20,
      726,
      43,
      C.mint,
    );
    text(g, 'Useful bytes ÷ event interval', 142, 820, 36, C.light);
  }
  note(g, 'Device-memory traffic requires counters from the same cache and replay policy.', true);
}

const baseRoof = rooflineFixture(),
  extraRoof = rooflineFixture(16);
const profiledUs = 8;
export function roofState(c) {
  const proposed = cue(c, 1, 'sixteen bytes per element');
  const changed = cue(c, 2, 'Three eighths of a teraflop');
  const input = proposed ? extraRoof : baseRoof;
  const timeUs = cue(c, 3, 'eight microseconds') ? profiledUs : null;
  const work = cue(c, 3, 'two million and six') ? input.operations : null;
  const achieved = cue(c, 4, 'About a quarter') && timeUs && work ? work / (timeUs * 1e6) : null;
  return {
    input,
    changed,
    waiting: proposed && !changed,
    placed: cue(c, 0, 'Half a teraflop'),
    zoom: cue(c, 3, 'Zoom in'),
    timeUs,
    work,
    achieved,
  };
}
function drawFullRoof(g, { input, placed, changed, waiting }) {
  const x = (i) => 198 + (Math.log2(i) + 4) * 117,
    y = (perf) => 744 - (Math.log2(perf) + 3) * 46;
  text(g, 'Compute rate  (TFLOP/s, log scale)', 100, 251, 32, C.muted);
  const roof = (i) => Math.min(baseRoof.peak / 1e12, (i * baseRoof.bandwidth) / 1e12);
  for (const v of [0.25, 1, 4, 16, 64]) {
    line(g, x(1 / 16), y(v), x(64), y(v), C.grid, 2);
    mono(g, v, x(1 / 16) - 20, y(v), 25, C.muted, 'right');
  }
  for (const i of [0.125, 0.5, 2, 8, 32]) {
    line(g, x(i), y(0.125), x(i), y(64), C.grid, 2);
    mono(g, i, x(i), 789, 26, C.muted, 'center');
  }
  path(
    g,
    [
      [x(1 / 16), y(roof(1 / 16))],
      [x(input.ridge), y(roof(input.ridge))],
      [x(64), y(roof(64))],
    ],
    C.teal,
    7,
  );
  mono(g, '60 TFLOP/s', x(44), y(60) - 32, 27, C.teal, 'center');
  text(g, 'Intensity at device memory  (FLOP/B, log scale)', 119, 849, 31);
  for (const model of placed ? (changed ? [baseRoof, extraRoof] : [baseRoof]) : []) {
    const px = x(model.intensity), py = y(model.roof / 1e12);
    const old = changed && model === baseRoof;
    const color = old ? C.muted : C.b;
    const labelY = py + (model === extraRoof ? 49 : 0);
    dot(g, px, py, 13, old ? C.paper : color, old ? color : C.white);
    path(g, [[px + 15, py], [px + 87, labelY], [545, labelY]], color, 3);
    mono(g, model.bytesPerElement + ' B ceiling · ' + f(model.roof / 1e12, 3) + ' TFLOP/s',
      564, labelY, 28, color);
  }
  const left = 1435;
  text(g, 'For each output', left, 333, 37, C.ink, 'left', 'Serif');
  mono(g, '2 FLOPs', left, 405, 46, C.ink);
  mono(g, input.bytesPerElement + ' HBM bytes', left, 470, 36, C.b);
  line(g, left, 520, 1810, 520, C.grid);
  text(g, 'Memory roof', left, 572, 32, C.muted);
  mono(g, '3 TB/s × 2/' + input.bytesPerElement, left, 628, 32);
  if (placed)
    mono(g, waiting ? '? TFLOP/s' : f(input.roof / 1e12, 3) + ' TFLOP/s', left, 707, 41, C.teal);
  note(g, 'At this memory level   ·   roof = min(float compute peak, bandwidth × intensity).');
}

function drawProfileDetail(g, { input, timeUs, work, achieved }) {
  const x = (i) => 198 + (i - 0.1) * 13400;
  const y = (rate) => 744 - rate * 770;
  text(g, 'Compute rate  (TFLOP/s)', 100, 251, 32, C.muted);
  for (const v of [0, 0.125, 0.25, 0.375, 0.5]) {
    line(g, x(0.1), y(v), x(0.18), y(v), C.grid, 2);
    mono(g, v, x(0.1) - 18, y(v), 25, C.muted, 'right');
  }
  for (const i of [0.10, 0.125, 0.15, 0.175]) {
    line(g, x(i), y(0), x(i), y(0.55), C.grid, 2);
    mono(g, i, x(i), 788, 26, C.muted, 'center');
  }
  text(g, 'Intensity at device memory  (FLOP/B)', 119, 849, 31);
  const ceiling = (i) => i * input.bandwidth / 1e12;
  line(g, x(0.10), y(ceiling(0.10)), x(0.18), y(ceiling(0.18)), C.teal, 7);
  const px = x(input.intensity);
  if (achieved !== null)
    line(g, px, y(input.roof / 1e12), px, y(achieved), C.a, 4, [6, 5]);
  for (const model of [baseRoof, input]) {
    const color = model === baseRoof ? C.muted : C.b;
    const mx = x(model.intensity), my = y(model.roof / 1e12);
    dot(g, mx, my, 13, model === baseRoof ? C.paper : color, model === baseRoof ? color : C.white);
    mono(g, model.bytesPerElement + ' B ceiling · ' + f(model.roof / 1e12, 3),
      mx - 19, my - 33, 27, color, 'right');
  }
  if (achieved !== null) {
    const py = y(achieved);
    g.save();
    g.translate(px, py);
    g.rotate(Math.PI / 4);
    box(g, -12, -12, 24, 24, C.a, C.white);
    g.restore();
    line(g, px + 18, py, px + 60, py, C.a);
    mono(g, 'Achieved ≈ ' + f(achieved) + ' TFLOP/s', px + 72, py, 33, C.a);
  }
  const left = 1370;
  text(g, 'Same kernel profile', left, 318, 39, C.ink, 'left', 'Serif');
  mono(g, '2 FLOPs / ' + input.bytesPerElement + ' B', left, 389, 35);
  mono(g, '= ' + f(input.intensity, 3) + ' FLOP/B', left, 445, 35);
  line(g, left, 505, 1830, 505, C.grid);
  if (timeUs !== null) mono(g, timeUs + ' µs duration', left, 571, 35, C.a);
  if (work !== null) {
    mono(g, work.toLocaleString('en-US') + ' FLOPs', left, 634, 35, C.a);
    text(g, 'Work ÷ duration', left, 722, 32, C.muted);
    mono(g, achieved === null ? '? TFLOP/s' : '≈ ' + f(achieved) + ' TFLOP/s', left, 782, 40, C.a);
  }
  note(g, 'Zoom on the bandwidth ceiling   ·   3 TB/s at device memory   ·   linear axes');
}
export function drawRoof(g, c) {
  const state = roofState(c);
  page(g, state.zoom ? 'Where does the profiled run land?' : 'How much work can device memory feed?',
    'roofline   /   invented GPU');
  if (state.zoom) drawProfileDetail(g, state);
  else drawFullRoof(g, state);
}

export function checkMeasurements(clock) {
  assert.deepEqual(
    regimes.map((v) => v[pick]),
    [20, 12, 20],
  );
  assert.deepEqual(rotatingSlots, [0, 1, 2, 3, 4, 5]);
  const waiting = runState(clock(1, 1));
  assert(waiting.focus && waiting.policyShown && !waiting.timesShown);
  assert.deepEqual(waiting.slots, [[0, 0, 0, '?'], [0, 1, 2, '?']]);
  assert.deepEqual(runState(clock(2, (phrase) => Number(phrase === 'Slot zero again'))).slots,
    [[0, 0, 0, 0], [0, 1, 2, '?']]);
  const answers = runState(clock(2, 1));
  assert.deepEqual(answers.slots, [[0, 0, 0, 0], [0, 1, 2, 3]]);
  assert(answers.timesShown);
  const nine = poolState(clock(0, 1)),
    ten = poolState(clock(1, 1));
  assert(nine.bytes < pool.target && ten.bytes >= pool.target);
  assert.equal(ten.count, 10);
  assert.equal(ten.steps, 20);
  assert(ten.bytes <= free / 4);
  for (const [c, us] of [
    [clock(0, 1), 8],
    [clock(1, 1), 3],
  ]) {
    const s = trafficState(c);
    assert.equal(s.bytes, 12000036);
    assert.equal(s.interval, us);
    assert.equal(s.rate * us * 1000, s.bytes);
  }
  assert.equal(roofState(clock(0, 1)).input.roof, 5e11);
  const proposed = roofState(clock(1, 1));
  assert(proposed.waiting && proposed.placed && !proposed.changed);
  assert.equal(proposed.input.bytesPerElement, 16);
  const ceiling = roofState(clock(2, 1));
  assert.equal(ceiling.input.intensity, 1 / 8);
  assert.equal(ceiling.input.roof, 3.75e11);
  assert.equal(ceiling.timeUs, null);
  const predictRate = roofState(clock(3, 1));
  assert.equal(predictRate.work, 2000006);
  assert.equal(predictRate.timeUs, 8);
  assert.equal(predictRate.achieved, null);
  const run = roofState(clock(4, 1));
  assert.equal(run.input.traffic, 16000048);
  assert.equal(run.work / run.input.traffic, run.input.intensity);
  assert.equal(run.achieved, 0.25000075);
  assert.equal(Math.round(100 * run.achieved / (run.input.roof / 1e12)), 67);
}
