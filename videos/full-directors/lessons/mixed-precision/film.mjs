import assert from 'node:assert/strict';
import { bf16, fp16 } from '../../../films/mixed-precision/arithmetic.mjs';
import { comparisonRuns, passesGates } from '../../../films/mixed-precision/fixtures.mjs';
import { C } from './drawing.mjs';
import {
  boundary,
  formats,
  history,
  neighbors,
  opening,
  range,
  rangeExamples,
  S,
  spacings,
  sub,
  tiny,
  transfer,
  writes,
} from './grids.mjs';
import {
  adamState,
  buffer,
  clipPath,
  controller,
  counts,
  memory,
  memoryBytes,
  ordering,
  token,
  totalLoss,
  trial,
  twoOptimizers,
} from './optimizer.mjs';
import {
  communication,
  comparison,
  fp8,
  partials,
  policy,
  regroup,
  sample,
  saturation,
  spikes,
  sums,
} from './comparison.mjs';

const painters = [
  opening,
  neighbors,
  formats,
  range,
  spacings,
  writes,
  controller,
  ordering,
  memory,
  transfer,
  communication,
  policy,
  fp8,
  comparison,
];
function check() {
  const next = 1 - 2 ** -11;
  assert.equal(boundary.storedWeight, 1);
  assert.equal(Math.fround(boundary.requested).toFixed(8), '0.99989998');
  assert.equal((1 - next) / 2 ** -24, 8192);
  for (const delta of [0.0003, 0.0004]) {
    assert.equal(fp16(1 - delta), next);
    assert.equal(fp16(1 + delta), 1);
  }
  assert.equal(fp16(1 - 2 ** -12), 1);
  assert.equal(bf16(1 + 2 ** -8), 1);
  assert.deepEqual(rangeExamples.map(fp16), [0, Infinity]);
  assert(bf16(rangeExamples[0]) > 0);
  assert.equal(bf16(rangeExamples[1]), 99840);
  assert.equal(fp16(tiny), 0);
  assert.equal(tiny / sub, 1 / 4);
  const scaled = tiny * S;
  assert.equal(scaled / sub, 64);
  assert(scaled < 2 ** -14);
  assert.equal(fp16(scaled), scaled);
  assert.equal(Math.fround(Math.fround(fp16(scaled)) / S), tiny);
  assert.equal(boundary.roundedInput, 1);
  assert(history.every((r) => r.direct === 1));
  assert.deepEqual(
    history.map((r) => r.copy * 2048),
    [2048, 2048, 2048, 2047, 2047, 2047, 2047],
  );
  assert.deepEqual(trial(256), {
    gradient: 300,
    scale: 256,
    scaled: 76800,
    stored: Infinity,
    skip: true,
  });
  assert.deepEqual(trial(64), {
    gradient: 300,
    scale: 64,
    scaled: 19200,
    stored: 19200,
    skip: false,
  });
  assert.deepEqual(adamState(trial(256).stored, true), { w: 1, m: 0.2, v: 0.04 });
  assert.deepEqual(adamState(trial(256).stored, false), { w: 1, m: Infinity, v: Infinity });
  assert.deepEqual(twoOptimizers(), [0.9, 1]);
  assert.equal(clipPath(false).out, 1 / 1024);
  assert.equal(clipPath(true).out, 0.02);
  assert.deepEqual([0, 1, 2, 3].map(buffer), [
    [0, 0],
    [128, 0],
    [128, 64],
    [192, 128],
  ]);
  assert.deepEqual(
    buffer(3).map((v) => v / 256),
    [0.75, 0.5],
  );
  assert(Math.hypot(...buffer(3)) / 256 < 1);
  assert.equal(totalLoss / counts.reduce((a, v) => a + v, 0), 5 / 6);
  assert.deepEqual([token.mean, token.meanOfMeans], [-1, 0]);
  assert.deepEqual(memoryBytes(4).segments, [0.4, 0.4, 0.8, 3.2]);
  assert.deepEqual(memoryBytes(2).segments, [0.4, 0.4, 0.8, 1.6]);
  assert.equal(memoryBytes(4).total.toFixed(1), '4.8');
  assert.equal(memoryBytes(2).total.toFixed(1), '3.2');
  assert.deepEqual(sums.bf16, [256, 256, 0]);
  assert.deepEqual(sums.fp32, [256, 257, 1]);
  assert.equal(regroup, 1);
  assert.deepEqual(sample.rounded, [1, 1]);
  assert(sample.wideProbability < sample.uniform && sample.uniform < sample.roundedProbability);
  assert.deepEqual([sample.wideAction, sample.roundedAction], [1, 0]);
  assert.deepEqual(
    spikes.map((r) => [r.amax, r.encoded, r.restored]),
    [
      [512, 448, 512],
      [8, 448, 8],
    ],
  );
  assert.deepEqual(saturation, { input: 500, maximum: 448, stored: 448, error: 52 });
  assert.deepEqual(partials(fp16), [0, 40000, Infinity, Infinity]);
  assert.deepEqual(partials(Math.fround), [0, 40000, 80000, 40000]);
  const eligible = (policy) =>
    comparisonRuns(policy)
      .filter(passesGates)
      .sort((a, b) => b.speed - a.speed)
      .map((r) => r.name);
  assert.deepEqual(eligible(0.92), ['B']);
  assert.deepEqual(eligible(0.93), ['A', 'B']);
  assert.equal(passesGates({ ...comparisonRuns()[1], sameGpu: false }), false);
  return true;
}
export default {
  title: 'Training Between Floating-Point Grids',
  draw(ctx, clock) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, 1920, 1080);
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
