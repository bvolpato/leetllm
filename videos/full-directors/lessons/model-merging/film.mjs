import assert from 'node:assert/strict';
import { rect, paper } from './drawing.mjs';
import {
  opening,
  alignment,
  soup,
  path,
  sphere,
  vector,
  weightsGB,
  uniform,
  probeNet,
  interpolation,
  scaledVectors,
  vectorSum,
} from './geometry.mjs';
import {
  scalar,
  adapters,
  ties,
  drop,
  originalWeight,
  practiceWeight,
  visibleSourceRows,
  joined,
  crossed,
  dare,
  outcomes,
  variance,
  survivor,
} from './updates.mjs';
import {
  recipe,
  rounding,
  evaluate,
  transfer,
  soupTrial,
  splice,
  precision,
  sourcesFor,
  practiceReleaseState,
  sphericalCode,
} from './trials.mjs';
import { permutationExample, adapterMergeExample } from '../../../films/model-merging/fixtures.mjs';
import {
  samples,
  trimmedRows,
  electedColumn,
  scoreReport,
} from '../../../films/model-merging/decisions.mjs';

const scenes = [
  opening,
  alignment,
  soup,
  path,
  sphere,
  vector,
  scalar,
  adapters,
  ties,
  drop,
  recipe,
  rounding,
  evaluate,
  transfer,
];
function draw(ctx, clock) {
  rect(ctx, 0, 0, 1920, 1080, paper);
  scenes[clock.beat.chapterIndex](ctx, clock);
}
function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, actual + ' differs from ' + expected);
}
function check() {
  assert.equal(weightsGB, 16);
  assert.equal(3 * weightsGB, 48);
  const neurons = permutationExample();
  for (const n of [neurons.a, neurons.b, neurons.aligned]) assert.deepEqual(probeNet(n), [1, 2]);
  assert.deepEqual(probeNet(neurons.naive), [0, 0]);
  assert.deepEqual(uniform, [2, 2]);
  assert.deepEqual(
    samples.filter((s) => s.pass).map((s) => s.alpha),
    [0, 0.25, 0.75, 1],
  );
  near(samples[2].barrier, 0.425);
  near(samples[2].low, 0.09);
  near(Math.hypot(...interpolation(0.5, false)), Math.sqrt(0.75));
  for (const t of [0, 0.25, 0.5, 1]) near(Math.hypot(...interpolation(t, true)), 1);
  assert.deepEqual(scaledVectors, [
    [0.8, 0],
    [0, 0.6],
  ]);
  assert.deepEqual(vectorSum, [0.8, 0.6]);
  near(originalWeight.first, 2.28);
  near(originalWeight.direct, 2.58);
  near(originalWeight.correction, -0.4);
  near(originalWeight.result, originalWeight.direct + originalWeight.correction);
  near(originalWeight.result, 2.18);
  near(originalWeight.base - (originalWeight.ends[0] - originalWeight.base), 1.6);
  near(practiceWeight.first, 2.3);
  near(practiceWeight.result, 2.1);
  assert.deepEqual(visibleSourceRows(false, false), [[null, null], [null, null]]);
  assert.deepEqual(visibleSourceRows(true, false), [[1, 0], [null, null]]);
  assert.deepEqual(visibleSourceRows(true, true), [[1, 0], [0, 1]]);
  assert.deepEqual(joined, adapterMergeExample().desired);
  assert.deepEqual(crossed, [
    [0.25, 0.25],
    [0.25, 0.25],
  ]);
  assert.deepEqual(joined, [
    [0.5, 0],
    [0, 0.5],
  ]);
  near(3 + crossed[0][1], 3.25);
  near(3 + joined[0][1], 3);
  near(joined[0][0] * joined[1][1] - joined[0][1] * joined[1][0], 0.25);
  assert.deepEqual(trimmedRows, [
    [0, -0.5, 0, 0.8],
    [0, 1.1, 0, -0.6],
    [0, -0.4, 0, 0.7],
  ]);
  for (const [idx, sum, aligned, mean] of [
    [1, 0.2, [1.1], 1.1],
    [3, 0.9, [0.8, 0.7], 0.75],
  ]) {
    const s = electedColumn(idx);
    near(s.sum, sum);
    assert.deepEqual(s.aligned, aligned);
    near(s.mean, mean);
  }
  dare.masked.forEach((v, i) => near(v, [0, 0, 0.2, 1.2][i]));
  dare.expectations.forEach((v, i) => near(v, dare.delta[i]));
  near(survivor, -0.8);
  near(variance, 0.16);
  assert.equal(outcomes.active, 19);
  assert.equal(outcomes.both, 1);
  near(outcomes.conditional, 1 / 19);
  assert.deepEqual(
    sourcesFor('return').map((r) => r.id),
    [417, 92],
  );
  assert.deepEqual(
    sourcesFor('<fim_prefix>').map((r) => r.model),
    ['Code'],
  );
  assert.deepEqual(
    soupTrial.steps.map((s) => s.accepted),
    [true, false],
  );
  near(soupTrial.seedLoss, 0.04);
  near(soupTrial.steps[0].loss, 0.0025);
  near(soupTrial.untouchedPredictions[0], 2);
  near(soupTrial.untouchedLoss, 0.905);
  assert.deepEqual(
    splice.probes.map((p) => p.output),
    [
      [16, 0],
      [0, 1],
    ],
  );
  near(precision.step, 1 / 128);
  near(precision.wide, 1.001);
  near(precision.roundedInput, 1);
  near(precision.roundedOutput, 1);
  near(sphericalCode.floor - sphericalCode.score, 1);
  assert.equal(scoreReport().macro.toFixed(1), '87.2');
  const practiceClock = (beatIndex, progress) => ({
    beat: { beatIndex },
    wordCue: () => ({ start: 1, end: 2 }),
    reveal: progress,
  });
  const measured = (p) => practiceReleaseState(practiceClock(2, () => p)).measured;
  assert.equal(measured(0.5), false);
  assert.equal(measured(1), true);
  for (const p of [0, 0.5, 1]) {
    const state = practiceReleaseState(
      practiceClock(3, (phrase) => (phrase.startsWith('Slide') ? p : 1)),
    );
    near(state.scorePosition, 86.4 + 0.6 * p);
    assert.deepEqual(
      state.report.rows.map((r) => r.score),
      [92.4, p === 1 ? 87 : 86.4, 87],
    );
    assert.deepEqual(
      state.report.rows.map((r) => r.retained),
      [92, 87, 86.5],
    );
    assert.deepEqual(
      state.report.rows.map((r) => r.pass),
      [true, p === 1, true],
    );
    assert.equal(state.decision, p === 0 ? 'hold' : '');
  }
  const deciding = practiceReleaseState(practiceClock(4, () => 0));
  assert.equal(deciding.report.clear, true);
  assert.equal(deciding.decision, '');
  assert.equal(practiceReleaseState(practiceClock(4, () => 1)).decision, 'pass');
}
export default { title: 'Moving Between Learned Models', draw, check };
