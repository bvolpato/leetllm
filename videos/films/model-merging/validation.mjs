import {
  average,
  connectedBasin,
  doubleWell,
  evaluateNeurons,
  taskArithmetic,
} from './arithmetic.mjs';
import {
  VECTOR_A,
  VECTOR_B,
  adapterMergeExample,
  dareMaskExample,
  independentDropOutcomes,
  passthroughFixture,
  permutationExample,
  precisionMergeExample,
  soupSelectionFixture,
  sphereMidpoints,
  tiesExample,
} from './fixtures.mjs';
import {
  alignmentSnapshot,
  averageSnapshot,
  earnedTransferSnapshot,
  pathSnapshot,
  taskArithmeticSnapshot,
  tiesSnapshot,
} from './model.mjs';
import assert from 'node:assert/strict';
import { electedColumn, samples, scoreReport } from './decisions.mjs';
export function validateBaselineModel() {
  assert.deepEqual(average(VECTOR_A, VECTOR_B), [2, 2]);
  assert.equal(doubleWell(0), 0);
  assert.equal(doubleWell(4), 0);
  assert.equal(doubleWell(2), 64);
  assert.deepEqual(
    taskArithmetic(
      [0, 0],
      [
        {
          scale: 0.8,
          vector: [1, 0],
        },
        {
          scale: 0.6,
          vector: [0, 1],
        },
      ],
    ),
    [0.8, 0.6],
  );
  assert.deepEqual(taskArithmeticSnapshot(0, 0).subtraction, [0, 0]);
  assert.deepEqual(taskArithmeticSnapshot(0, 1).deltas, [
    [1, 0],
    [0, 1],
  ]);
  assert.equal(taskArithmeticSnapshot(1, 7 / 12.262).complete, false);
  assert.deepEqual(taskArithmeticSnapshot(1, 9 / 12.262).weighted, [
    [0.8, 0],
    [0, 0],
  ]);
  assert.deepEqual(taskArithmeticSnapshot(1, 1).partial, [0.8, 0.6]);
  assert.deepEqual(taskArithmeticSnapshot(1, 1).partial, taskArithmeticSnapshot(2, 0).partial);
  const ties = tiesExample();
  assert.deepEqual(ties.trimmed, [
    [1, 0],
    [-0.3, 0],
    [-0.3, 0],
  ]);
  assert.deepEqual(ties.electedSigns, [1, 0]);
  assert.deepEqual(ties.merged, [1, 0]);
  assert.equal(
    Math.sign(ties.trimmed[0][0]) + Math.sign(ties.trimmed[1][0]) + Math.sign(ties.trimmed[2][0]),
    -1,
  );
  assert(Math.sign(ties.trimmed.reduce((sum, row) => sum + row[0], 0)) > 0);
  const sphere = sphereMidpoints();
  assert(Math.abs(sphere.linearNorm - Math.sqrt(0.75)) < 1e-12);
  assert(Math.abs(sphere.sphericalNorm - 1) < 1e-12);
  assert(Math.abs(connectedBasin(0)) < 1e-12 && Math.abs(connectedBasin(4)) < 1e-12);
  assert(Math.abs(connectedBasin(2) - 0.15) < 1e-12 && connectedBasin(2) < doubleWell(2));
  const neurons = permutationExample();
  assert.deepEqual(neurons.naive.input, [0, 0]);
  assert.deepEqual(neurons.aligned, neurons.a);
  for (let i = -20; i <= 20; i++) {
    const x = i / 10;
    assert.equal(evaluateNeurons(neurons.a, x), evaluateNeurons(neurons.b, x));
    assert.equal(evaluateNeurons(neurons.naive, x), 0);
    assert.equal(evaluateNeurons(neurons.aligned, x), evaluateNeurons(neurons.a, x));
  }
  assert.deepEqual(
    [-1, 1].map((x) => evaluateNeurons(neurons.a, x)),
    [1, 2],
  );
  assert.notEqual(
    evaluateNeurons(
      {
        input: neurons.alignedB.input,
        output: neurons.b.output,
      },
      1,
    ),
    evaluateNeurons(neurons.a, 1),
  );
  for (let i = 0; i <= 1000; i++) {
    const state = alignmentSnapshot(1, i / 1000);
    assert.deepEqual(state.outputs, [1, 2]);
    assert.deepEqual(
      state.pairs.map((pair) => [pair.input, pair.output]),
      [
        [-1, 1],
        [1, 2],
      ],
    );
    const [a, b] = state.pairs;
    assert(
      Math.abs(a.x - b.x) >= 258 || Math.abs(a.y - b.y) >= 72,
      'Moving neuron groups remain disjoint',
    );
    for (const pair of state.pairs) {
      assert(pair.x - 125 >= 1052 && pair.x + 125 <= 1778);
      assert(pair.y - 32 >= 362 && pair.y + 32 <= 743);
    }
    assert.equal(state.alignedAverage !== null, state.reorder === 1);
  }
  assert.deepEqual(alignmentSnapshot(1, 0.99).alignedAverage, neurons.a);
  assert.deepEqual(alignmentSnapshot(2, 0.01).alignedAverage, neurons.a);
  assert.equal(averageSnapshot(1, 4.78 / 10.27).ready, false);
  for (const elapsed of [4.8, 5.1875, 5.3875, 5.7125, 10.27])
    assert.deepEqual(averageSnapshot(1, elapsed / 10.27).merged, [2, 2]);
  assert.deepEqual(averageSnapshot(2, 0).merged, [2, 2]);
  assert.equal(pathSnapshot(0, 1).w, 2);
  for (const elapsed of [0, 0.275, 0.8, 2.2, 2.8375, 3.6375, 9.502]) {
    const state = pathSnapshot(1, elapsed / 9.502);
    assert.deepEqual([state.w, state.ridgeLoss, state.valleyLoss], [2, 64, 0.15]);
  }
  assert.equal(pathSnapshot(2, 0).w, 2);
  assert.equal(pathSnapshot(2, 1).w, 4);
  assert.equal(tiesSnapshot(1, 16.09 / 22.51).signedSums, null);
  for (const elapsed of [16.125, 16.7375, 18.975, 22.51]) {
    const state = tiesSnapshot(1, elapsed / 22.51);
    assert.equal(state.trimOpacity, 1);
    assert(Math.abs(state.signedSums[0] - 0.4) < 1e-12);
    assert.deepEqual(state.electedSigns, [1, 0]);
    assert.deepEqual(state.surviving, [
      [true, false],
      [false, false],
      [false, false],
    ]);
  }
  assert.equal(tiesSnapshot(1, 20.94 / 22.51).currentMerge, null);
  for (const elapsed of [20.9625, 21.3, 21.5875, 22.51])
    assert.deepEqual(tiesSnapshot(1, elapsed / 22.51).currentMerge, [1, 0]);
  assert.deepEqual(tiesSnapshot(2, 0).currentMerge, [1, 0]);
  for (const beat of [0, 1, 2])
    for (let i = 0; i <= 1000; i++) {
      const state = pathSnapshot(beat, i / 1000);
      assert(state.w >= 0 && state.w <= 4);
      assert.equal(state.ridgeLoss, doubleWell(state.w));
      assert.equal(state.valleyLoss, connectedBasin(state.w));
    }
  return true;
}
export function validateModel() {
  validateBaselineModel();
  assert.deepEqual(
    samples.filter((row) => row.pass).map((row) => row.alpha),
    [0, 0.25, 0.75, 1],
  );
  assert.equal(samples[2].barrier.toFixed(3), '0.425');
  const second = electedColumn(1),
    fourth = electedColumn(3);
  assert.deepEqual(second.aligned, [1.1]);
  assert.equal(second.sum.toFixed(2), '0.20');
  assert.deepEqual(fourth.aligned, [0.8, 0.7]);
  assert.equal(fourth.sum.toFixed(2), '0.90');
  assert.equal(fourth.mean, 0.75);
  const original = scoreReport(),
    retry = scoreReport(86.4),
    boundary = scoreReport(87);
  assert.equal(original.macro.toFixed(1), '87.2');
  assert.deepEqual(
    original.rows.map((row) => row.pass),
    [true, false, true],
  );
  assert(retry.rows[1].score >= retry.rows[1].floor && !retry.clear);
  assert(boundary.clear && boundary.rows[1].retained === boundary.rows[1].score);
  const adapter = adapterMergeExample();
  assert.deepEqual(adapter.desired, [
    [0.5, 0],
    [0, 0.5],
  ]);
  assert.deepEqual(adapter.wrong, [
    [0.25, 0.25],
    [0.25, 0.25],
  ]);
  const dare = dareMaskExample();
  assert.deepEqual(dare.masked, [0, -0, 0.2, 1.2]);
  dare.expectations.forEach((v, i) => assert(Math.abs(v - dare.delta[i]) < 1e-12));
  assert(Math.abs(dare.overlap - 1 / 19) < 1e-12);
  const outcomes = independentDropOutcomes();
  assert.deepEqual(
    [outcomes.both, outcomes.exactlyOne, outcomes.neither, outcomes.active],
    [1, 18, 81, 19],
  );
  assert.equal(outcomes.conditional, 1 / 19);
  const soup = soupSelectionFixture();
  assert.deepEqual(
    soup.steps.map((s) => s.accepted),
    [true, false],
  );
  assert(Math.abs(soup.steps[0].loss - 0.0025) < 1e-12);
  assert(soup.untouchedLoss > soup.steps[0].loss);
  assert.deepEqual(
    passthroughFixture().probes.map((p) => p.output),
    [
      [16, 0],
      [0, 1],
    ],
  );
  assert.equal(
    earnedTransferSnapshot({
      beat: 0,
      cues: {
        'earned-result': {
          phase: 'before',
        },
      },
    }).result,
    null,
  );
  assert(
    Math.abs(
      earnedTransferSnapshot({
        beat: 0,
        cues: {
          'earned-result': {
            phase: 'after',
          },
        },
      }).result - 2.1,
    ) < 1e-12,
  );
  const precision = precisionMergeExample();
  assert.equal(precision.step, 0.0078125);
  assert.equal(precision.roundedInput, 1);
  assert.equal(precision.roundedOutput, 1);
  assert(Math.abs(precision.wide - 1.001) < 1e-12);
  assert(
    Math.abs(
      taskArithmetic(
        [2],
        [
          {
            scale: 0.7,
            vector: [0.4],
          },
          {
            scale: 0.5,
            vector: [-0.2],
          },
        ],
      )[0] - 2.18,
    ) < 1e-12,
  );
  return true;
}
