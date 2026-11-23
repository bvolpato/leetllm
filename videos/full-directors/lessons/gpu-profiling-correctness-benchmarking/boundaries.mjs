import assert from 'node:assert/strict';
import { trace } from '../../../films/gpu-profiling-correctness-benchmarking/trace.mjs';
import { launchContract } from '../../../films/gpu-profiling-correctness-benchmarking/model.mjs';
import {
  C,
  text,
  mono,
  box,
  path,
  line,
  dot,
  hatch,
  bracket,
  page,
  note,
  cue,
  after,
  phraseProgress,
  lerp,
  f,
} from './instruments.mjs';

function pulse(g, x, y, start, end, t, color) {
  const right = Math.min(end, t);
  line(g, x(0), y, x(80), y, C.gridDark, 3);
  if (right <= start) return;
  box(g, x(start), y - 46, x(right) - x(start), 46, color);
  if (t >= end) line(g, x(end), y - 50, x(end), y + 7, color, 4);
}

export function traceState(c) {
  const t = trace;
  const sweepPhrase = 'Follow the pulse. Both kernels start at ten and finish at seventy-five';
  const closing = phraseProgress(c, 1, sweepPhrase, 'Both kernels start');
  const waitPhrase = 'The CPU learns the work is complete when its wait returns at seventy-eight';
  const waiting = phraseProgress(c, 1, waitPhrase, waitPhrase);
  const time =
    c.beat.beatIndex === 0
      ? Math.min(t.hostB, c.elapsed * 6)
      : waiting
        ? lerp(t.stop, t.wait, waiting)
        : lerp(t.hostB, t.stop, closing);
  return {
    time,
    host: Math.min(t.hostB, time),
    baseline: after(c, 0, 'five point four'),
    ratio: after(c, 0, 'one point eight times faster'),
    wait: waiting === 1,
    events: after(c, 2, 'The first event executed at five'),
    gap: cue(c, 2, 'Count the gap from five to ten'),
    result: after(c, 2, 'Seventy microseconds between events', 'Seventy microseconds between events'),
    callRatio: t.hostA / t.hostB,
    eventTime: t.stop - t.start,
    kernelTime: t.stop - t.kernelStart,
  };
}
export function drawTrace(g, c) {
  const s = traceState(c),
    t = trace,
    x = (v) => 367 + v * 17.6;
  page(g, 'Where would you stop the clock?', 'triad_f32   /   constructed trace', true);
  mono(g, 'PATCH  /  LAUNCH CLOCK', 90, 274, 29, C.faint);
  mono(g, f(s.host, 1) + ' µs', 90, 370, 78, C.mint);
  if (s.baseline) {
    mono(g, 'BASELINE  /  LAUNCH CLOCK', 650, 274, 29, C.faint);
    mono(g, f(t.hostA) + ' µs', 650, 370, 78, C.blue);
    if (s.ratio) mono(g, f(s.callRatio) + '×  launch only', 1820, 351, 49, C.amber, 'right');
  }
  for (let us = 0; us <= 80; us += 10) {
    line(g, x(us), 461, x(us), 808, '#35565a', 2);
    mono(g, us, x(us), 838, 26, C.faint, 'center');
  }
  text(g, 'CPU launch', 86, 520, 39, C.light);
  text(g, 'GPU kernel', 86, 665, 39, C.light);
  text(g, 'Time  (µs)', 86, 838, 30, C.faint);
  pulse(g, x, 551, 0, t.hostB, s.time, C.mint);
  pulse(g, x, 701, t.kernelStart, t.stop, s.time, C.salmon);
  if (s.host === t.hostB && s.time < t.kernelStart)
    text(g, 'Kernel still ahead', x(t.kernelStart) + 35, 675, 35, C.salmon);
  line(g, x(s.time), 532, x(s.time), 811, s.wait ? C.amber : C.light, 3, [9, 8]);
  if (s.host === t.hostB) {
    dot(g, x(t.hostB), 551, 8, C.mint);
    text(g, 'call returns', x(t.hostB) + 32, 510, 29, C.mint);
  }
  if (s.time >= t.stop) {
    mono(
      g,
      `Both kernels  ·  ${t.kernelStart} to ${t.stop} µs`,
      x((t.kernelStart + t.stop) / 2),
      678,
      32,
      C.scope,
      'center',
    );
  }
  if (s.wait) {
    dot(g, x(t.wait), 551, 9, C.amber);
    text(g, 'Host wait returns', x(t.wait) - 22, 510, 32, C.amber, 'right');
    bracket(g, x(0), x(t.wait), 796, `Synchronized request  ·  ${t.wait} µs for each run`, C.amber);
  }
  if (s.events) {
    bracket(
      g,
      x(t.start),
      x(t.stop),
      606,
      s.result ? s.eventTime + ' µs between events' : 'same-stream timing events',
      C.blue,
      true,
    );
    if (s.gap) hatch(g, x(t.start), 655, x(t.kernelStart) - x(t.start), 46, C.blue, 11);
  }
  const footer = s.result
    ? `Event interval = ${t.kernelStart - t.start} µs before execution + ${s.kernelTime} µs in the kernel`
    : s.events
      ? `Start event at ${t.start} µs   ·   Stop event at ${t.stop} µs`
      : s.wait
        ? 'The request clock includes the wait for completion.'
        : s.time >= t.stop
          ? 'The kernels have finished. The host is still waiting.'
          : s.host === t.hostB
            ? `The host launch clock stops at ${t.hostB} µs.`
            : 'Host timer running';
  note(g, footer, true, 911);
}

const valid = 5,
  cells = 8,
  scale = 1.25;
const inputX = Array.from({ length: cells }, (_, i) => 4 * i);
const inputZ = Array(cells).fill(1);
const reference = inputX.slice(0, valid).map((v, i) => scale * v + inputZ[i]);
export function tailState(c) {
  const tried = cue(c, 1, 'Five is outside'),
    tight = cue(c, 1, 'Now the sixth store');
  const fixed = cue(c, 2, 'The sixth thread skips'),
    poisoned = cue(c, 2, 'fill the output with NaNs');
  const replayCount = Math.floor(5 * cue(c, 2, 'Suppose thread two skips its own store', 1.5));
  const omitted = poisoned && replayCount === valid;
  const compared = cue(c, 0, 'Compare the five results', 1.3);
  const validWrites = poisoned
    ? replayCount
    : Math.floor(valid * cue(c, 0, 'Five threads each own', 1.3));
  const admitted = launchContract(valid, 4, !fixed, tight ? valid : cells);
  const values = Array(tight ? valid : cells).fill(NaN);
  for (const i of admitted.writes) {
    if ((i < validWrites || (i === valid && tried)) && i < values.length && !(poisoned && i === 2))
      values[i] = scale * inputX[i] + inputZ[i];
  }
  return {
    values,
    admitted,
    tried,
    tight,
    fixed,
    omitted,
    compared,
    poisoned,
    matched: reference.filter((v, i) => values[i] === v).length,
  };
}
function lastBlock(g, c) {
  const a = launchContract(),
    writers = a.n % a.threads,
    shown = cue(c, 3, 'Test empty');
  page(g, 'Who owns the last block?', 'triad_f32   /   full-length launch');
  for (let i = 0; i < a.threads; i++) {
    const x = 115 + (i % 16) * 31,
      y = 272 + Math.floor(i / 16) * 31;
    box(g, x, y, 25, 25, i < writers ? C.teal : '#dadcd1', null, 4);
  }
  text(g, 'Last block of 256', 115, 821, 34);
  mono(g, '1,000,003 outputs', 725, 330, 54);
  text(g, '3,906 full blocks + 1 partial block', 725, 414, 43, C.muted);
  text(g, writers + ' writers', 723, 560, 64, C.teal, 'left', 'Serif');
  text(g, a.excluded + ' threads skip the store', 725, 650, 44);
  if (shown) mono(g, 'Test n = 0, 1, 255, 256, 257', 725, 777, 36);
  note(g, 'Valid output indices run from zero through n − 1.');
}
export function drawTail(g, c) {
  if (c.beat.beatIndex === 3) return lastBlock(g, c);
  const s = tailState(c),
    x = (i) => 220 + i * 149,
    edge = x(5) - 13;
  page(g, 'Which thread changed the spare cell?', 'triad_f32   /   output memory');
  mono(g, 'Y = 1.25 × X + Z', 89, 276, 40);
  mono(g, s.fixed ? 'if (i < 5)' : 'if (i ≤ 5)', 1810, 276, 44, s.fixed ? C.teal : C.b, 'right');
  for (let i = 0; i < cells; i++) {
    const px = x(i);
    mono(g, i, px + 56, 366, 30, C.muted, 'center');
    const inside = i < s.values.length,
      value = s.values[i];
    const color =
      i === 5 && s.tried && !s.fixed ? C.b : i < valid && Number.isFinite(value) ? C.teal : C.muted;
    if (inside) {
      box(g, px, 399, 112, 95, i < 5 ? '#e0eadc' : '#eae4d8', color, 9);
      mono(g, Number.isFinite(value) ? value : 'NaN', px + 56, 447, 36, color, 'center');
    } else {
      hatch(g, px, 399, 112, 95, '#c3beb0', 15);
      if (i === 5 && !s.fixed) text(g, '×', px + 56, 444, 68, C.b, 'center');
    }
    if (i < Math.ceil(valid * s.compared))
      mono(g, reference[i], px + 56, 551, 30, C.muted, 'center');
  }
  mono(g, 'index', 84, 366, 27, C.muted);
  mono(g, 'Y', 84, 450, 37);
  mono(g, 'ref.', 84, 551, 28, C.muted);
  line(g, edge, 344, edge, 585, C.b, 4);
  bracket(g, x(0), x(4) + 112, 595, '5 requested outputs', C.teal, true);
  if (s.compared === 1 && (!s.poisoned || s.omitted))
    mono(
      g,
      s.matched + ' / ' + valid + ' match',
      1580,
      455,
      41,
      s.matched === valid ? C.teal : C.b,
      'center',
    );
  const pt = x(5) + 56;
  path(
    g,
    [
      [pt, 501],
      [pt, 630],
      [1135, 685],
    ],
    C.b,
    3,
  );
  box(g, 890, 675, 886, 165, C.white, '#b4ab97', 18);
  box(g, 906, 688, 230, 138, s.tight ? '#e2dacc' : '#eae4d8', s.tried ? C.b : C.muted, 8);
  if (s.tight) hatch(g, 910, 691, 222, 131, '#b4aa9c', 18);
  if (!s.tight)
    mono(
      g,
      Number.isNaN(s.values[5]) ? 'NaN' : s.values[5],
      1021,
      758,
      63,
      s.tried ? C.b : C.ink,
      'center',
    );
  else if (!s.fixed) text(g, '×', 1021, 758, 87, C.b, 'center');
  text(g, 'Address 5', 1165, 718, 35);
  const detail = s.fixed
    ? 'Store skipped'
    : s.tight
      ? 'Store out of bounds'
      : s.tried
        ? 'Extra store landed'
        : 'Spare cell';
  text(g, detail, 1165, 784, 42, s.fixed ? C.teal : s.tried ? C.b : C.muted);

  if (!s.tight) mono(g, 'X[5] = 20    Z[5] = 1', 85, 770, 33);
  else if (s.omitted) mono(g, 'Y[2] still holds NaN', 85, 770, 33, C.b);
  note(
    g,
    s.poisoned
      ? 'Fresh test   ·   poison each output before running the kernel again.'
      : s.fixed
        ? 'Correct guard   ·   zero through four own an output.'
        : s.tight
          ? 'Same inputs and launch   ·   output allocation reduced to five floats.'
          : 'Two blocks of four threads   ·   eight floats allocated in each buffer.',
  );
}

export function toleranceState(c) {
  const towardZero = cue(c, 1, 'Move the reference toward zero', 1.5);
  const error = Number(lerp(1, 5, cue(c, 2, 'Move the error to five millionths', 1.3)).toFixed(2));
  const ref = Number(lerp(0.1, 0, towardZero).toFixed(3)),
    abs = 2,
    relative = 20 * Math.abs(ref),
    limit = abs + relative;
  return {
    error,
    ref,
    abs,
    relative,
    limit,
    pass: error <= limit,
    result: cue(c, 1, 'The measured error'),
  };
}
export function drawTolerance(g, c) {
  const s = toleranceState(c),
    xx = (v) => 156 + v * 263;
  page(g, 'How far can one answer move?', 'triad_f32   /   bounded float32 inputs');
  mono(g, '|output − reference| ≤ atol + rtol × |reference|', 90, 271, 39);
  text(g, 'Reference', 105, 384, 32, C.muted);
  mono(g, f(s.ref, 4), 105, 439, 55);
  text(g, 'Absolute tolerance', 695, 384, 32, C.muted);
  mono(g, '0.000002', 695, 439, 48);
  text(g, 'Relative tolerance', 1300, 384, 32, C.muted);
  mono(g, '0.000020', 1300, 439, 48);
  text(g, 'Absolute error, in millionths', 155, 522, 34);
  for (let i = 0; i <= 6; i++) {
    line(g, xx(i), 578, xx(i), 739, C.grid);
    mono(g, i, xx(i), 774, 33, C.muted, 'center');
  }
  box(g, xx(0), 631, xx(2) - xx(0), 41, '#a9cebc');
  if (s.result) {
    box(g, xx(2), 631, xx(s.limit) - xx(2), 41, '#e7b776');
    line(g, xx(s.limit), 580, xx(s.limit), 726, C.b, 5);
    mono(g, 'limit ' + f(s.limit, 2), xx(s.limit), 556, 33, C.b, 'center');
    dot(g, xx(s.error), 654, 21, C.ink, C.white);
    mono(g, 'error ' + f(s.error, 2), xx(s.error), 711, 30, C.ink, 'center');
  }
  mono(
    g,
    s.result
      ? '2 + ' + f(s.relative, 2) + ' = ' + f(s.limit, 2) + ' millionths'
      : '2 + 20 × |0.1| = ?',
    135,
    841,
    40,
  );
  if (s.result)
    text(
      g,
      s.pass ? 'Within allowance' : 'Outside allowance',
      1800,
      838,
      44,
      s.pass ? C.teal : C.b,
      'right',
      'Serif',
    );
  note(g, 'Use this allowance for finite outputs of the bounded triad.');
}

export function checkBoundaries(clock) {
  const start = traceState(clock(0, 0)),
    question = traceState(clock(0, 1)),
    kernelDone = traceState(clock(1, (phrase) => Number(phrase.startsWith('Follow the pulse')))),
    stop = traceState(clock(1, 1));
  assert.equal(start.host, trace.hostB);
  assert.equal(question.time, trace.hostB);
  assert(!question.wait && !question.events);
  assert.equal(kernelDone.time, trace.stop);
  assert(!kernelDone.wait);
  assert.equal(stop.host, 3);
  assert.equal(stop.time, 78);
  assert.deepEqual([stop.callRatio, stop.eventTime, stop.kernelTime], [1.8, 70, 65]);
  const spare = tailState(clock(1, (phrase) => Number(phrase === 'Five is outside')));
  assert.deepEqual(spare.values.slice(0, 6), [1, 6, 11, 16, 21, 26]);
  assert.equal(spare.matched, 5);
  assert(!spare.admitted.allocationOverrun);
  const exact = tailState(clock(1, 1));
  assert(exact.admitted.allocationOverrun);
  assert.equal(exact.values.length, 5);
  const repaired = tailState(clock(2, (phrase) => Number(phrase === 'The sixth thread skips')));
  assert.equal(repaired.admitted.lastWrite, 4);
  assert.equal(repaired.matched, 5);
  const reset = tailState(
    clock(2, (phrase) => Number(phrase !== 'Suppose thread two skips its own store')),
  );
  assert(reset.values.every(Number.isNaN));
  const missed = tailState(clock(2, 1));
  assert.equal(missed.matched, 4);
  assert(Number.isNaN(missed.values[2]));
  assert.equal(launchContract().excluded, 189);
  for (let i = 0; i <= 20; i++) {
    const p = i / 20,
      s = toleranceState(clock(1, p)),
      e = toleranceState(clock(2, p));
    assert.equal(s.error, 1);
    assert.equal(s.limit, 2 + 20 * Math.abs(s.ref));
    assert(s.pass);
    assert.equal(e.pass, e.error <= 2);
    assert.equal(e.ref, 0);
  }
}
