import assert from 'node:assert/strict';
import { ACTUAL_LAB_RUN as lab } from '../../../films/gpu-profiling-correctness-benchmarking/fixtures.mjs';
import {
  parseSampleArtifact,
  receiptFixture,
  replayMemory,
  sampleDigest,
  serialPayoff,
} from '../../../films/gpu-profiling-correctness-benchmarking/model.mjs';
import {
  C,
  text,
  mono,
  box,
  line,
  path,
  dot,
  bracket,
  page,
  note,
  cue,
  after,
  phraseProgress,
  lerp,
  f,
} from './instruments.mjs';

const replay = replayMemory(),
  receipt = receiptFixture();
const editedCsv = receipt.csv.B.replace(/82\n$/, '82.0\n');
function origin(g, c) {
  const detail = cue(c, 0, 'If a kernel owns');
  page(
    g,
    'Where does the request spend its time?',
    'profiler selection   /   constructed serial trace',
    true,
  );
  const bars = [
    ['CPU preparation', 535, C.blue],
    ['Copy', 180, C.amber],
    ['Kernel', 610, C.mint],
  ];
  let px = 186;
  for (const [name, width, col] of bars) {
    box(g, px, 477, width, 132, col, null, 4);
    text(g, name, px + width / 2, 544, 42, C.scope, 'center');
    px += width + 4;
  }
  bracket(g, 186, px - 4, 400, 'Nsight Systems  ·  request dependencies', C.faint);
  if (detail) bracket(g, px - 614, px - 4, 651, 'Nsight Compute  ·  kernel', C.mint, true);
  note(
    g,
    'Trace the request first. Inspect resources and memory traffic inside its critical kernel.',
    true,
  );
}
export function replayState(c) {
  const ran = cue(c, 1, 'Only Y changes'),
    restored = cue(c, 2, 'The untouched inputs');
  const blocked = cue(c, 2, 'The passing reference');
  return {
    live: restored ? replay.restored : ran ? replay.afterPass : replay.initial,
    ran,
    restored,
    blocked,
  };
}
export function drawReplay(g, c) {
  if (!cue(c, 0, 'Some counters need multiple passes')) return origin(g, c);
  const s = replayState(c);
  if (s.blocked) {
    page(
      g,
      'What did the lab actually establish?',
      'course lab   /   ' + lab.device + '   /   shared device',
    );
    const results = [
      ['Elementwise reference', 'Passed on exercised cases', C.teal],
      ['memcheck', '0 errors on repaired build', C.teal],
      ['Device-memory counters', 'Access denied', C.b],
    ];
    results.forEach(([label, value, color], i) => {
      const y = 340 + i * 177;
      line(g, 121, y + 76, 1780, y + 76, C.grid);
      text(g, label, 124, y, 46);
      text(g, value, 1776, y, 45, color, 'right', 'Serif');
    });
    mono(g, lab.counterError, 1776, 801, 38, C.b, 'right');
    note(
      g,
      'Keep the clean timing. Collect permitted counters before placing a measured roofline point.',
    );
    return;
  }
  page(
    g,
    'Which bytes come back for the second pass?',
    'Nsight Compute   /   two-pass kernel replay',
  );
  const keys = ['X', 'Z', 'Y'],
    layout = [225, 977];
  text(g, 'Saved before pass one', layout[0], 288, 42, C.muted, 'left', 'Serif');
  text(
    g,
    s.restored ? 'Live before pass two' : s.ran ? 'Live after pass one' : 'Live before pass one',
    layout[1],
    288,
    42,
    C.ink,
    'left',
    'Serif',
  );
  keys.forEach((key, i) => {
    const y = 372 + i * 147;
    for (let j = 0; j < 2; j++) {
      const x = layout[j],
        data = (j === 0 ? replay.saved : s.live)[key];
      mono(g, key, x - 98, y + 53, 53, key === 'Y' ? C.b : C.teal);
      data.forEach((v, k) => {
        box(
          g,
          x + k * 234,
          y,
          216,
          106,
          key === 'Y' && j === 1 && s.ran && !s.restored ? '#f4dace' : C.white,
          C.grid,
          10,
        );
        mono(g, v, x + k * 234 + 108, y + 53, 46, C.ink, 'center');
      });
    }
    if (key === 'Y' && s.restored) {
      path(
        g,
        [
          [689, y + 55],
          [851, y + 55],
          [833, y + 40],
        ],
        C.b,
        5,
      );
      mono(g, 'restore', 768, y + 14, 25, C.b, 'center');
    }
  });
  note(
    g,
    s.restored
      ? 'Only Y was written. Restore its saved bytes before another pass.'
      : s.ran
        ? 'Pass one wrote Y = 1.25 × X + Z. The saved image still holds the starting state.'
        : 'Accessible memory at the start of this kernel replay   ·   X, Z and Y.',
  );
}

const peak = lab.rotated.reduce((a, b) => (a[2] > b[2] ? a : b));
function labRun(g, c) {
  const seen = cue(c, 0, 'These are two hundred', 1.8),
    spot = cue(c, 0, 'The spike at sample');
  page(
    g,
    'What would a median leave out?',
    'course lab   /   ' + lab.device + '   /   rotating buffers',
    true,
  );
  const x = (i) => 226 + 7.42 * i,
    y = (v) => 759 - v * 1.25;
  for (const us of [0, 100, 200, 300]) {
    line(g, 225, y(us), 1740, y(us), C.gridDark);
    mono(g, us, 196, y(us), 28, C.faint, 'right');
  }
  mono(g, 'Event time (µs)', 104, 287, 30, C.faint);
  const rows = lab.rotated.slice(0, Math.max(1, Math.ceil(seen * lab.rotated.length)));
  path(
    g,
    rows.map(([i, , us]) => [x(i), y(us)]),
    C.mint,
    4,
  );
  if (rows.length === 1) dot(g, x(0), y(rows[0][2]), 7, C.mint);
  for (const i of [0, 50, 100, 150, 199]) mono(g, i, x(i), 811, 30, C.faint, 'center');
  if (spot) {
    dot(g, x(peak[0]), y(peak[2]), 9, C.amber);
    mono(
      g,
      'sample ' + peak[0] + '  ·  ' + f(peak[2], 3) + ' µs',
      x(peak[0]) - 24,
      y(peak[2]) - 31,
      32,
      C.amber,
      'right',
    );
  }
  note(
    g,
    'Sample index in acquisition order   ·   10 rotating slots   ·   one build on a shared GPU',
    true,
  );
}
export function bindingState(c) {
  const edit = cue(c, 1, 'The number is the same'),
    compare = cue(c, 2, 'Stop before computing');
  const csv = edit ? editedCsv : receipt.csv.B;
  return {
    csv,
    last: csv.trimEnd().split('\n').at(-1),
    actual: sampleDigest(csv),
    expected: receipt.digests.B,
    compare,
  };
}
export function drawReceipt(g, c) {
  if (c.beat.beatIndex === 0) return labRun(g, c);
  const s = bindingState(c);
  page(g, 'Can this file support the old receipt?', 'timing receipt   /   synthetic candidate CSV');
  box(g, 106, 292, 761, 555, C.white, C.grid, 12);
  mono(g, 'sample,slot,elapsed_us', 161, 345, 39);
  line(g, 150, 400, 817, 400, C.grid);
  s.csv
    .trim()
    .split('\n')
    .slice(1)
    .forEach((row, i) => {
      if (i === 4) box(g, 139, 426 + i * 76, 694, 69, '#f2e4c7', null, 5);
      mono(g, row, 163, 458 + i * 76, 40);
    });
  const prefix = (v) => v.slice(0, 16) + '…';
  text(g, 'Original receipt', 1004, 348, 43, C.ink, 'left', 'Serif');
  mono(g, prefix(s.expected), 1004, 421, 43);
  text(g, 'Hash of current bytes', 1004, 547, 43, C.ink, 'left', 'Serif');
  mono(g, s.compare ? prefix(s.actual) : '?', 1004, 619, 43, s.compare ? C.b : C.muted);
  if (s.compare)
    text(
      g,
      s.actual === s.expected ? 'Digests match' : 'Digest mismatch',
      1004,
      787,
      58,
      C.b,
      'left',
      'Serif',
    );
  note(
    g,
    s.compare
      ? 'Stop before parsing. Recover the bound file or recollect a matched round.'
      : 'SHA-256 binds the exact bytes, including the newline after the last row. Digest prefixes shown.',
  );
}

const baseline = serialPayoff(80, 20, 2);
const measuredCpu = 90;
const fasterKernel = baseline.kernel / baseline.factor;
const measuredStop = measuredCpu + fasterKernel;
export function requestState(c) {
  const predictedStopPhrase = 'Ninety milliseconds';
  const measuredStopPhrase = 'Now the clean request timer comes back at a hundred';
  const cpuPhrase = 'Preparation grew to ninety milliseconds';
  const findingCpu = phraseProgress(c, 2, cpuPhrase, cpuPhrase);
  return {
    predicted: after(c, 1, predictedStopPhrase, predictedStopPhrase),
    predictionRatio: after(c, 1, 'one point one one times'),
    measured: after(c, 1, measuredStopPhrase, measuredStopPhrase),
    findingCpu,
    cpuKnown: findingCpu === 1,
    accounted: after(c, 2, 'The ten in the kernel still holds'),
    aligned: after(c, 2, 'The two requests finish together'),
  };
}
export function drawRequest(g, c) {
  const s = requestState(c),
    x = (t) => 361 + 13.2 * t,
    baselineY = 364,
    predictedY = 520,
    traceY = 678,
    height = 82;
  page(g, 'When will the user get the answer?', 'request latency   /   two serial stages', true);
  box(g, x(0), 247, 24, 24, C.blue);
  text(g, 'CPU preparation', x(0) + 40, 259, 32, C.light);
  box(g, x(0) + 370, 247, 24, 24, C.salmon);
  text(g, 'GPU kernel', x(0) + 410, 259, 32, C.light);
  for (let ms = 0; ms <= baseline.before; ms += 10) {
    line(g, x(ms), 342, x(ms), 781, C.gridDark);
    mono(g, ms, x(ms), 821, 30, C.faint, 'center');
  }
  mono(g, 'Elapsed time (ms)', 87, 821, 27, C.faint);
  const stage = (y, start, end, color, label, size = 35) => {
    box(g, x(start), y, x(end) - x(start), height, color);
    if (label) mono(g, label, x((start + end) / 2), y + height / 2, size, C.scope, 'center');
  };
  text(g, 'Baseline', 92, baselineY + height / 2, 39, C.light);
  stage(baselineY, 0, baseline.cpu, C.blue, baseline.cpu + ' ms');
  stage(baselineY, baseline.cpu, baseline.before, C.salmon, baseline.kernel + ' ms');

  text(g, 'Prediction', 92, predictedY + height / 2, 39, C.light);
  stage(predictedY, 0, baseline.cpu, C.blue, baseline.cpu + ' ms');
  if (s.predicted) {
    stage(predictedY, baseline.cpu, baseline.after, C.salmon, fasterKernel + ' ms', 31);
    dot(g, x(baseline.after), predictedY + height, 7, C.salmon);
    mono(g, baseline.after + ' ms', x(baseline.after), predictedY + height + 34, 32, C.salmon, 'center');
  } else {
    const middle = predictedY + height / 2;
    line(g, x(baseline.cpu), middle, x(baseline.before), middle, C.salmon, 3, [8, 9]);
    mono(g, baseline.factor + '× kernel speed', x(baseline.before), predictedY - 19, 29, C.salmon, 'right');
  }

  if (s.measured) {
    const middle = traceY + height / 2;
    const stopX = x(measuredStop);
    if (!s.cpuKnown) {
      const left = x(baseline.after);
      const y = traceY - 20;
      g.save();
      g.globalAlpha *= 1 - s.findingCpu;
      line(g, left, y - 8, left, y + 8, C.amber, 3);
      line(g, left, y, stopX, y, C.amber, 3);
      mono(g, '+' + (measuredStop - baseline.after) + ' ms unexplained', left - 26, y, 28, C.amber, 'right');
      g.restore();
    }
    text(g, 'Measured', 92, middle, 39, C.light);
    if (!s.accounted)
      line(g, x(0), middle, stopX, middle, C.faint, 2, [8, 9]);
    if (s.findingCpu) {
      const cpuEnd = lerp(baseline.cpu, measuredCpu, s.findingCpu);
      stage(traceY, 0, baseline.cpu, C.blue, s.cpuKnown ? baseline.cpu + ' ms' : '');
      const extra = s.cpuKnown ? '+' + (measuredCpu - baseline.cpu) + ' ms' : '';
      stage(traceY, baseline.cpu, cpuEnd, '#c4d9ff', extra, 27);
    }
    if (s.accounted)
      stage(traceY, measuredCpu, measuredStop, C.salmon, fasterKernel + ' ms', 31);
    line(g, stopX, traceY - 19, stopX, traceY + height + 14, C.amber, 4);
    dot(g, stopX, traceY + height, 8, C.amber);
    if (s.aligned) {
      line(g, stopX, 342, stopX, traceY - 19, C.amber, 4, [7, 6]);
      dot(g, x(baseline.before), baselineY + height, 8, C.amber);
      mono(g, 'Same request stop  ·  ' + measuredStop + ' ms', stopX, 311, 32, C.amber, 'right');
    } else {
      mono(g, measuredStop + ' ms', stopX + 24, middle, 32, C.amber);
    }
  }
  const msg = s.accounted
    ? `Measured request   ·   ${measuredCpu} + ${fasterKernel} = ${measuredStop} ms`
    : s.predicted
      ? `Predicted request   ·   ${baseline.cpu} + ${fasterKernel} = ${baseline.after} ms` +
        (s.predictionRatio ? `   ·   ${baseline.before} ÷ ${baseline.after} ≈ ${f(baseline.speedup)}×` : '')
      : `Baseline request   ·   ${baseline.cpu} + ${baseline.kernel} = ${baseline.before} ms`;
  text(g, msg, 86, 868, 34, C.faint);
}

export function checkEvidence(clock) {
  const first = replayState(clock(0, 1)),
    after = replayState(clock(1, 1)),
    again = replayState(clock(2, 1));
  assert.deepEqual(first.live.Y, [-1, -1]);
  assert.deepEqual(after.live.Y, [4.25, 6.5]);
  assert.deepEqual(again.live, first.live);
  assert.deepEqual(after.live.X, first.live.X);
  assert.deepEqual(after.live.Z, first.live.Z);
  assert.equal(lab.rotated.length, 200);
  assert.deepEqual(peak, [189, 9, 318.143994]);
  const raw = bindingState(clock(1, 0)),
    edited = bindingState(clock(2, 1));
  assert.equal(raw.expected, raw.actual);
  assert.notEqual(edited.expected, edited.actual);
  assert.equal(edited.last, '4,0,82.0');
  assert.equal(parseSampleArtifact(raw.csv, raw.expected, receipt.conditions).median, 82);
  assert.throws(
    () => parseSampleArtifact(edited.csv, edited.expected, receipt.conditions),
    /artifact changed/,
  );
  assert.deepEqual([baseline.before, baseline.after, baseline.speedup], [100, 90, 100 / 90]);
  assert.deepEqual([measuredCpu, fasterKernel, measuredStop], [90, 10, 100]);
  assert.equal(measuredCpu - baseline.cpu, baseline.kernel - fasterKernel);
  assert(!requestState(clock(0, 1)).predicted);
  const mismatch = requestState(clock(1, 1));
  assert(mismatch.predicted && mismatch.predictionRatio && mismatch.measured);
  assert(!mismatch.findingCpu && !mismatch.cpuKnown && !mismatch.accounted && !mismatch.aligned);
  const actual = requestState(clock(2, 1));
  assert(actual.cpuKnown && actual.accounted && actual.aligned);
}
