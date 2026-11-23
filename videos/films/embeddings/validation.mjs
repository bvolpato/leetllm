import {
  centerPopulation,
  cosine,
  gloveResidual,
  maskedMean,
  occurrenceVisibility,
  subwordComposition,
} from './arithmetic.mjs';
import { CONTEXT_COUNTS, FINANCE, LIMITS_CUES, RIVER, V } from './fixtures.mjs';
import {
  contextCountTrace,
  extendedEmbeddingState,
  limitsGeometry,
  limitsState,
  poolingState,
  substitutionState,
} from './construction.mjs';
import { countRepresentation, negativeSamplingState } from './model.mjs';
import assert from 'node:assert/strict';
import { dotProduct, normalizeVector } from 'vizmatic';
export function validateOriginalModel() {
  assert.deepEqual(contextCountTrace(2, 1).counts, CONTEXT_COUNTS);
  assert.deepEqual(contextCountTrace(0, 1).counts, [1, 0, 0, 0]);
  assert.deepEqual(contextCountTrace(1, 0.4).counts, [2, 1, 0, 0]);
  const separation = Math.hypot(...V.river.map((x, j) => x - V.money[j]));
  for (const beat of [0, 1, 2])
    for (const p of [0, 0.2, 0.5, 0.9, 1])
      assert(Math.abs(limitsGeometry(beat, p).distance - separation) < 1e-12);
  assert(limitsGeometry(0, 1).cosine > 0.96);
  assert(limitsGeometry(1, 1).cosine < -0.99);
  assert.deepEqual(CONTEXT_COUNTS, [2, 1, 2, 1]);
  assert(cosine(RIVER, V.river) > cosine(RIVER, V.money));
  assert(cosine(FINANCE, V.money) > cosine(FINANCE, V.river));
  for (const vector of Object.values(V))
    assert(Math.abs(Math.hypot(...normalizeVector(vector)) - 1) < 1e-12);
  const valid = [V.bank, V.river, V.water],
    mean = valid[0].map((_, i) => valid.reduce((s, v) => s + v[i], 0) / 3);
  const padded = [...valid, [0, 0]],
    mask = [1, 1, 1, 0];
  assert.deepEqual(
    padded[0].map((_, i) => padded.reduce((s, v, k) => s + mask[k] * v[i], 0) / 3),
    mean,
  );
  const { shiftStart, shiftEnd, centerStart, centerEnd } = LIMITS_CUES;
  assert.deepEqual(limitsState(0, shiftStart).opacity, [1, 0, 0]);
  assert.deepEqual(limitsState(0, shiftEnd).opacity, [1, 1, 0]);
  assert(Math.abs(limitsState(0, (shiftStart + shiftEnd) / 2).opacity[1] - 0.5) < 1e-12);
  assert.deepEqual(limitsState(1, centerStart).opacity, [1, 1, 0]);
  assert.deepEqual(limitsState(1, centerEnd).opacity, [1, 1, 1]);
  assert(Math.abs(limitsState(1, (centerStart + centerEnd) / 2).opacity[2] - 0.5) < 1e-12);
  for (const progress of [0.12, 0.5, 0.88]) {
    assert.deepEqual(limitsState(2, progress).opacity, [1, 1, 1]);
    assert.deepEqual(limitsState(0, progress).values, limitsState(2, progress).values);
  }
  const references = limitsState(0, 0).values;
  assert(Math.abs(references[0] - 0.19801980198019803) < 1e-12);
  assert(references[1] > 0.96 && references[1] < 0.98);
  assert(references[2] < -0.99);
  for (const beat of [0, 1, 2])
    for (const progress of [0, 0.12, 0.5, 0.88, 1]) {
      const state = poolingState(beat, progress);
      assert.equal(state.values.length, state.entry > 0 ? 4 : 3);
      assert.deepEqual(state.mask, state.entry > 0 ? [1, 1, 1, 0] : [1, 1, 1]);
      assert.equal(state.count, 3);
      state.mean.forEach((value, i) => assert(Math.abs(value - mean[i]) < 1e-12));
    }
  assert.equal(poolingState(1, 0.1 / 16.272).entry, 0);
  assert(poolingState(1, 1 / 16.272).entry > 0 && poolingState(1, 1 / 16.272).entry < 1);
  assert.equal(poolingState(1, 1.875 / 16.272).entry, 1);
  assert.notDeepEqual(maskedMean([...valid, [1, 1]], [1, 1, 1, 1]), mean);
  for (const progress of [0, 0.12, 0.5, 8.125 / 15.792, 8.55 / 15.792]) {
    const state = substitutionState(1, progress);
    assert.equal(state.amount, 0);
    assert.deepEqual(state.current, RIVER);
    assert.equal(state.showNormalization, false);
    assert.equal(state.showPooling, false);
  }
  const moving = substitutionState(1, 8.8625 / 15.792);
  assert(moving.amount > 0 && moving.amount < 1);
  assert(moving.current[0] > RIVER[0] && moving.current[0] < 0.67);
  assert(moving.current[1] < RIVER[1] && moving.current[1] > 0.38);
  const replaced = substitutionState(1, 9.175 / 15.792);
  assert.equal(replaced.amount, 1);
  replaced.current.forEach((value, i) => assert(Math.abs(value - [0.67, 0.38][i]) < 1e-12));
  assert.notDeepEqual(replaced.current, FINANCE);
  assert(Math.abs(Math.hypot(...replaced.normalized) - 1) < 1e-12);
  for (const progress of [0, 0.12, 0.5, 0.88, 1]) {
    const held = substitutionState(2, progress);
    assert.deepEqual(held.current, replaced.current);
    assert.deepEqual(held.clue, V.money);
    assert.deepEqual(held.pooled, maskedMean([V.bank, held.current, V.water], [1, 1, 1]));
  }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const counts = countRepresentation();
  assert.equal(counts.total, 53);
  assert.equal(counts.rows[0], 14);
  assert.equal(counts.cols[0], 15);
  assert(Math.abs(counts.ppmi[0][0] - Math.log(424 / 210)) < 1e-9);
  assert(
    Math.abs(counts.singular[0] - 1.418) < 0.001 && Math.abs(counts.singular[1] - 1.348) < 0.001,
  );
  assert(Math.abs(cosine(counts.vectors[0], counts.vectors[1]) - 1) < 1e-12);
  assert(Math.abs(dotProduct(counts.vectors[0], counts.vectors[2])) < 1e-12);
  const n = negativeSamplingState();
  assert(n.loss < n.lossBefore);
  assert(Math.abs(n.updated[0] - 1.081) < 0.001);
  assert(Math.abs(n.updated[1] - 0.008) < 0.001);
  assert(Math.abs(gloveResidual(3).squared - Math.log(10) ** 2) < 1e-12);
  assert.equal(gloveResidual(30).squared, 0);
  assert.deepEqual(
    subwordComposition(
      [0, 0, 1],
      [
        [2, 0],
        [0, 3],
      ],
    ).mean,
    [4 / 3, 1],
  );
  assert.deepEqual(occurrenceVisibility(true, 0, ['charge', 'the', 'phone']), ['charge']);
  assert.deepEqual(occurrenceVisibility(true, 0, ['charge', 'the', 'invoice']), ['charge']);
  assert.deepEqual(
    centerPopulation([
      [10, 1],
      [10, 2],
      [10, 3],
    ]).centered[1],
    [0, 0],
  );
  for (const progress of [0, 0.37, 1, 0.01, 1]) {
    const f = extendedEmbeddingState('fresh-representation', {
      beat: 1,
      cues: {
        'emb-fresh-docs': {
          phase: 'after',
        },
        'emb-fresh-query': {
          phase: 'during',
          progress,
        },
      },
    });
    assert(f.scores.every(Number.isFinite));
  }
  return true;
}
