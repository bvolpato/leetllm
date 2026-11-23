import { exampleTexts, scores } from './fixtures.mjs';
import {
  applyResult,
  boundDecision,
  decide,
  exampleDecision,
  fusionResult,
  moderationPopulation,
  queue,
  scheduled,
  selectedLuminance,
} from './model.mjs';
import { batches, cascadeSnapshot, categorySnapshot, revisionTrace } from './construction.mjs';
import { currentResult, oldResult, replayResult } from './upload.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    exampleTexts.map((value) => exampleDecision(value)),
    ['BLOCK', 'ALLOW'],
  );
  assert.deepEqual(
    exampleTexts.map((value) => exampleDecision(value, true)),
    ['BLOCK', 'BLOCK'],
  );
  assert.equal(decide(scores), 'BLOCK');
  assert.equal(decide(scores.map((v, i) => (i === 1 ? 0.1 : v))), 'REVIEW');
  assert.equal(decide([0.1]), 'REVIEW');
  assert.equal(decide([NaN, ...scores.slice(1)]), 'REVIEW');
  assert.deepEqual(
    scheduled.map((v) => [v.at, v.rows.map((r) => r.id)]),
    [
      [2, ['A', 'B', 'C']],
      [25, ['D']],
      [32, ['E']],
    ],
  );
  const withYAt = (at) =>
    batches([
      { id: 'X', at: 0 },
      { id: 'Y', at },
    ]).map((batch) => [batch.at, batch.rows.map((row) => row.id)]);
  assert.deepEqual(withYAt(4), [[5, ['X', 'Y']]]);
  assert.deepEqual(withYAt(5), [
    [5, ['X']],
    [10, ['Y']],
  ]);
  assert.equal(queue(20), 6000);
  assert.equal(queue(80), 0);
  assert.equal(applyResult(8, 7, 200, 150), 'IGNORE STALE');
  assert.equal(applyResult(7, 7, 200, 200), 'IGNORE STALE');
  assert.equal(revisionTrace(0, 0).revision, 7);
  assert.equal(revisionTrace(0, 4 / 16.566).receipt, true);
  assert.equal(revisionTrace(0, 4 / 16.566).compared, false);
  assert.equal(revisionTrace(0, 1).emitted, true);
  assert.equal(revisionTrace(1, 4 / 22.762).linked, false);
  assert.equal(revisionTrace(1, 1).remedied, true);
  assert.equal(cascadeSnapshot(0, 1).stages[2].remainder, 100);
  assert.equal(cascadeSnapshot(1, 1).staff, 17143);
  assert.equal(categorySnapshot(0, 1).reasons.length, 2);
  assert.equal(categorySnapshot(1, 1).review, true);
  validateAdvanced();
  return true;
}
export function validateAdvanced() {
  assert.equal(oldResult.status, 'STALE');
  assert.equal(oldResult.item.state, 'PENDING');
  assert.deepEqual(oldResult.item.outbox, []);
  assert.equal(currentResult.status, 'APPLIED');
  assert.deepEqual(currentResult.item.outbox, [
    { decision: 'D24', item: 'P24', revision: 3, state: 'PUBLISHED' },
  ]);
  assert.equal(replayResult.status, 'DUPLICATE');
  assert.strictEqual(replayResult.item, currentResult.item);
  assert.equal(fusionResult(0.54, 0.76).action, 'REVIEW');
  assert(Math.abs(fusionResult(0.54, 0.76).score - 0.661) < 1e-12);
  assert.deepEqual(fusionResult(NaN, 0.1, true), {
    action: 'BLOCK',
    score: null,
  });
  assert.deepEqual(
    selectedLuminance([10, 11, 12, 13, 15, 16, 82, 84, 85, 86, 18, 19]),
    [0, 4, 6, 8, 10],
  );
  const population = moderationPopulation(100000, 0.001, 0.95, 0.01);
  assert.deepEqual(
    [population.tp, population.fp, population.fn, population.tn],
    [95, 999, 5, 98901],
  );
  const item = {
    revision: 12,
    scope: 'profile-eu',
    policy: 'v7',
    state: 'PENDING',
    applied: {
      D9: [11, 'profile-eu', 'v7', 'ALLOW'],
    },
  };
  assert.equal(
    boundDecision(item, {
      id: 'D9',
      revision: 11,
      scope: 'profile-eu',
      policy: 'v7',
      action: 'ALLOW',
    }).status,
    'DUPLICATE',
  );
  assert.equal(
    boundDecision(item, {
      id: 'D10',
      revision: 11,
      scope: 'profile-eu',
      policy: 'v7',
      action: 'ALLOW',
    }).status,
    'STALE',
  );
}
