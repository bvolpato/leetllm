import { candidates, code, dictionary, steeringBaseline, target } from './fixtures.mjs';
import {
  ablationState,
  selectionHistory,
  steeringState,
  topKSelectionState,
} from './construction.mjs';
import { coverageFixture, denseLoss, encoderFixture, sparseLoss, topK } from './model.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export function validateModel() {
  const ablationAt = (seconds) =>
    ablationState({
      beat: 1,
      t: 20.728 + seconds,
    });
  for (const seconds of [0, 7.2, 9, 10.8, 11.224]) {
    assert.deepEqual(ablationAt(seconds).values, [1, 0.1]);
    assert.equal(ablationAt(seconds).applied, false);
    assert.equal(ablationAt(seconds).score, 10);
  }
  assert.deepEqual(ablationAt(11.225).values, [0, 0.1]);
  assert.equal(ablationAt(11.225).score, 10);
  assert.equal(ablationAt(12.9625).prediction, false);
  assert.deepEqual(
    ablationState({
      beat: 2,
      t: 40.082 + 2.9,
    }).values,
    [0, 0.1],
  );
  assert.deepEqual(
    ablationState({
      beat: 2,
      t: 40.082 + 6.7,
    }).values,
    [0, 0],
  );
  for (let i = 0; i <= 100; i++) {
    const current = ablationState({
      beat: 2,
      t: 40.082 + i / 10,
    });
    assert.equal(current.score, 100 * current.values[1]);
    assert.equal(current.values[0], 0);
  }
  assert.ok(target.every((v, i) => Math.abs(v - [2.3, 0.6][i]) < 1e-12));
  assert.deepEqual(topK(candidates, 2), [0, 2.4, 0, 1.7, 0]);
  assert.ok(denseLoss(0.02) < sparseLoss(0.02));
  assert.ok(sparseLoss(0.2) < denseLoss(0.2));
  for (const l of [0, 0.4, 1, 3]) {
    const z = Math.max(0, 1 - l / 2),
      obj = (v) => (1 - v) ** 2 + l * v;
    assert.ok([0, z, 1, 2].every((v) => obj(z) <= obj(v) + 1e-12));
  }
  assert.equal(100 * [1, 0.1][1], 10);
  assert.equal(100 * [0, 0.1][1], 10);
  assert.equal(100 * [0, 0][1], 0);
  assert.ok(dictionary.every((v) => Math.abs(dotProduct(v, v) - 1) < 1e-12));
  const atGrow = (seconds) =>
    steeringState({
      beat: 1,
      t: 20.128 + seconds,
    });
  assert.deepEqual(atGrow(0.1).activation, steeringBaseline);
  assert.ok(Math.abs(atGrow(0.1625).alpha) < 1e-12);
  assert.ok(Math.abs(atGrow((0.1625 + 6.175) / 2).alpha - 1) < 1e-12);
  assert.equal(atGrow(6.175).alpha, 2);
  assert.equal(atGrow(19).alpha, 2);
  assert.equal(
    steeringState({
      beat: 0,
      t: 0.5,
    }).alpha,
    -1,
  );
  assert.equal(
    steeringState({
      beat: 0,
      t: 19.6,
    }).alpha,
    0,
  );
  assert.equal(
    steeringState({
      beat: 2,
      beatP: 0,
    }).alpha,
    2,
  );
  for (let i = 0; i <= 40; i++) {
    const state = atGrow((6.175 * i) / 40),
      [candidate, orthogonal, overlapping] = state.readouts;
    assert.equal(candidate, state.activation[1]);
    assert.equal(orthogonal, 0.2);
    assert.ok(Math.abs(overlapping - (0.2 + 0.8 * state.alpha)) < 1e-12);
    assert.deepEqual(state.delta, [0, state.alpha]);
    if (i) assert.ok(state.alpha >= atGrow((6.175 * (i - 1)) / 40).alpha);
  }
  assert.deepEqual(
    steeringState({
      beat: 2,
      beatP: 0,
    }).readouts,
    atGrow(19).readouts,
  );
  const atSelectionCue = (seconds) =>
    topKSelectionState({
      beat: 0,
      t: 0.4 + seconds,
    });
  assert.deepEqual(atSelectionCue(5.5).values, candidates);
  assert.equal(atSelectionCue(5.5).active, 5);
  for (const seconds of [5.5875, 7.275, 8.6, 9.3875, 18]) {
    const current = atSelectionCue(seconds);
    assert.equal(current.applied, true);
    assert.equal(current.active, 2);
    assert.deepEqual(current.values, [0, 2.4, 0, 1.7, 0]);
  }
  assert.deepEqual(
    topKSelectionState({
      beat: 0,
      beatP: 7.275 / 18.528,
    }).values,
    topK(candidates, 2),
  );
  assert.deepEqual(topK([-1, 2, 0], 2), [0, 2, 0]);
  const estimate = encoderFixture();
  assert.deepEqual(
    estimate.estimated.map((value) => Number(value.toFixed(10))),
    code,
  );
  estimate.reconstructed.forEach((value, i) => assert(Math.abs(value - target[i]) < 1e-12));
  assert.notDeepEqual(estimate.weights[0], dictionary[0]);
  const beforeRare = selectionHistory({
      'selection-rare-context': {
        phase: 'before',
      },
      'selection-auxiliary-signal': {
        phase: 'before',
      },
    }),
    afterRare = selectionHistory({
      'selection-rare-context': {
        phase: 'after',
      },
      'selection-auxiliary-signal': {
        phase: 'after',
      },
    });
  assert.deepEqual(beforeRare.counts, [0, 3, 0, 0, 0]);
  assert.deepEqual(afterRare.counts, [0, 3, 0, 0, 1]);
  assert.equal(afterRare.rows[3].code[4], 3.1);
  assert(Math.abs(afterRare.signals[2] - 0.2) < 1e-12);
  assert.equal(afterRare.signals[3], 1);
  assert.equal(afterRare.signals[4], 0);
  assert.deepEqual(
    afterRare.rows.slice(0, 3).map((row) => row.code),
    beforeRare.rows.map((row) => row.code),
  );
  const coverage = coverageFixture();
  assert.equal(coverage.general, 0);
  assert(Math.abs(coverage.combined - Math.SQRT2) < 1e-12);
  coverage.reconstructed.forEach((value, i) =>
    assert(Math.abs(value - coverage.activation[i]) < 1e-12),
  );
  return true;
}
