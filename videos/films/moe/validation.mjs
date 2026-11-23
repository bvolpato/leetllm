import {
  BATCH_ROUTES,
  CAPACITY_ROUTES,
  CHOICE_SCORES,
  MOE_FRESH_ROUTES,
  ROUTER_LOGITS,
  ROUTING,
  SKEW_COUNTS,
} from './fixtures.mjs';
import {
  overflowReroute,
  queueExample,
  routerScoreSnapshot,
  trainingSkewSnapshot,
} from './construction.mjs';
import { moeChoice, moePacked, moeServing } from './model.mjs';
import { vec } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const originalReroute = overflowReroute(0),
    committedReroute = overflowReroute(1);
  assert.deepEqual(
    originalReroute.grouped.map((rows) => rows.length),
    [8, 3, 3, 2],
  );
  assert.deepEqual(
    committedReroute.grouped.map((rows) => rows.length),
    [7, 3, 3, 3],
  );
  assert.deepEqual(originalReroute.routes[4], [0, 2]);
  assert.deepEqual(committedReroute.routes[4], [3, 2]);
  assert.deepEqual(originalReroute.output, [1.2, 1.2000000000000002]);
  assert.deepEqual(committedReroute.output, [3, 1.2000000000000002]);
  const limited = queueExample(CAPACITY_ROUTES, 4, originalReroute.gates);
  assert.deepEqual(
    limited.terms.map((term) => [term.slot, term.runs]),
    [
      [5, false],
      [2, true],
    ],
  );
  assert.equal(limited.totalOverflow, 4);
  assert.equal(vec(limited.output), '[0, 1.2]');
  for (const trial of [originalReroute, committedReroute]) {
    assert.deepEqual(
      queueExample(trial.routes, trial.token, trial.gates, 1, true).output,
      trial.output,
    );
  }
  for (const [factor, slots, overflow, output] of [
    [1, 3, 2, [0, 2.25]],
    [1.5, 5, 0, [0.5, 2.25]],
  ]) {
    const batch = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], factor);
    assert.deepEqual([batch.slots, batch.totalOverflow, batch.output], [slots, overflow, output]);
  }
  const { packed, outputs } = moePacked();
  assert.deepEqual(
    packed.map((row) => row.token),
    [1, 2, 0, 0, 2],
  );
  assert.deepEqual(
    packed.filter((row) => row.token === 0).map((row) => row.contribution),
    [
      [-0.75, -1.5],
      [0.125, 0.25],
    ],
  );
  assert.deepEqual(
    outputs.map((v) => vec(v)),
    ['[-0.625, -1.25]', '[6, 8]', '[5.5, 6.6]'],
  );
  assert.deepEqual(
    moeServing(60).map((row) => row.accepted),
    [false, true],
  );
  assert.deepEqual(
    moeServing(50).map((row) => row.accepted),
    [false, false],
  );
  for (let token = 0; token < CHOICE_SCORES[0].length; token++) {
    assert(Math.abs(CHOICE_SCORES.reduce((sum, row) => sum + row[token], 0) - 1) < 1e-12);
  }
  assert.deepEqual(moeChoice().buckets, [
    [0, 1],
    [0, 2],
    [2, 3],
  ]);
  assert.deepEqual(moeChoice().coverage, [2, 1, 2, 1, 0]);
  for (const progress of [0, 0.1, 0.5, 0.99, 1]) {
    const model = overflowReroute(progress);
    assert.equal(
      model.routes.reduce((n, route) => n + route.length, 0),
      16,
    );
    assert(model.routes.every((route) => route.length === 2 && new Set(route).size === 2));
    assert.equal(
      model.gates.reduce((a, v) => a + v, 0),
      1,
    );
    model.routes.forEach((route, token) => {
      if (token !== 4) assert.deepEqual(route, CAPACITY_ROUTES[token]);
    });
  }
  const beforeSoftmax = routerScoreSnapshot(1, 0.0999 / 11.542);
  const onSoftmax = routerScoreSnapshot(1, 0.1 / 11.542);
  assert.equal(beforeSoftmax.softmax, false);
  assert.equal(beforeSoftmax.zeroX, 1590);
  assert.equal(onSoftmax.softmax, true);
  assert.equal(onSoftmax.zeroX, 1040);
  for (let beat = 0; beat < 3; beat++)
    for (let i = 0; i <= 100; i++) {
      const current = routerScoreSnapshot(beat, i / 100);
      current.rows.forEach((row, expert) => {
        assert.equal(
          row.value,
          current.softmax ? ROUTING.probabilities[expert] : ROUTER_LOGITS[expert],
        );
        assert.ok(
          Math.abs(row.width - Math.abs(row.value) * (current.softmax ? 790 : 150)) < 1e-10,
        );
        assert.ok(Math.abs((current.softmax ? row.x : row.x + row.width) - current.zeroX) < 1e-10);
        assert.ok(row.opacity >= 0 && row.opacity <= 1);
      });
      if (current.softmax)
        assert.ok(Math.abs(current.rows.reduce((sum, row) => sum + row.value, 0) - 1) < 1e-12);
    }
  const middleProbabilities = routerScoreSnapshot(1, 0.5);
  assert.ok(middleProbabilities.rows[3].width < middleProbabilities.rows[1].width);
  assert.ok(middleProbabilities.rows.every((row) => row.x === 1040 && row.opacity === 1));
  assert.equal(
    SKEW_COUNTS.reduce((a, b) => a + b, 0),
    20,
  );
  assert.deepEqual(trainingSkewSnapshot(0, 0.99).assigned, [12, 4, 3, 1]);
  assert.deepEqual(trainingSkewSnapshot(1, 0.12).contributions, [9, 3, 2, 0]);
  assert.equal(trainingSkewSnapshot(1, 0.17).collected, 20);
  assert.equal(trainingSkewSnapshot(1, 0.17).update, false);
  assert.equal(trainingSkewSnapshot(1, 0.5).update, true);
  assert.equal(trainingSkewSnapshot(1, 0.5).possibleFeedback, false);
  assert.equal(trainingSkewSnapshot(1, 0.88).possibleFeedback, true);
  for (let beat = 0; beat < 3; beat++)
    for (let i = 0; i <= 100; i++) {
      const state = trainingSkewSnapshot(beat, i / 100);
      state.contributions.forEach((n, e) => assert(n <= state.assigned[e]));
      if (state.update) assert.equal(state.collected, 20);
      if (state.possibleFeedback) assert(state.update);
    }
  const weights = ROUTING.weights;
  assert(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.deepEqual(ROUTING.selected, [0, 2]);
  assert.equal(
    BATCH_ROUTES.reduce((n, r) => n + r.length, 0),
    12,
  );
  return true;
}
