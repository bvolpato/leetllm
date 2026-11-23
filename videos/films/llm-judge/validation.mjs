import { aggregateSwaps, receipt, upperAfterZero, belowOnePercent } from './arithmetic.mjs';
import {
  anchors,
  conflictingSwap,
  judge,
  judgeRun,
  labels,
  policy,
  records,
  restoreTie,
  restoreVotes,
  stableSwap,
} from './fixtures.mjs';
import { coverageFrame } from './construction.mjs';
import {
  attempts,
  exactFields,
  expected,
  humanCounts,
  judgeCounts,
  kappa,
  matches,
  observed,
  resolved,
  review,
  unresolved,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal((100 * upperAfterZero(50)).toFixed(2), '5.82');
  assert.equal(belowOnePercent, 299);
  assert.ok(upperAfterZero(belowOnePercent - 1) > 0.01);
  assert.ok(upperAfterZero(belowOnePercent) < 0.01);
  assert.deepEqual(humanCounts, {
    compact: 3,
    stepwise: 3,
    tie: 2,
  });
  assert.deepEqual(judgeCounts, {
    compact: 4,
    stepwise: 3,
    tie: 1,
  });
  assert.equal(coverageFrame(0, 0).pending, 10);
  assert.equal(coverageFrame(0, 0.4).unresolved, 1);
  assert.equal(coverageFrame(0, 0.6).review, 1);
  assert.equal(coverageFrame(0, 0.72).resolved, 8);
  assert.equal(coverageFrame(1, 0.27).checked, 8);
  assert.equal(coverageFrame(1, 0.27).matching, 6);
  for (let i = 0; i <= 100; i++) {
    const frame = coverageFrame(0, i / 100);
    assert.equal(frame.pending + frame.resolved + frame.unresolved + frame.review, 10);
  }
  assert.equal(matches, 6);
  assert.equal(observed, 0.75);
  assert.equal(expected, 23 / 64);
  assert.ok(Math.abs(kappa - 25 / 41) < 1e-12);
  assert.equal(
    exactFields({
      policyVersion: 'DEP-27',
      actions: ['stop_rollout', 'run_rollback'],
    }),
    true,
  );
  assert.equal(
    exactFields({
      policyVersion: 'DEP-26',
      actions: policy.actions,
    }),
    false,
  );
  assert.equal(
    exactFields({
      policyVersion: 'DEP-27',
      actions: ['run_rollback', 'stop_rollout'],
    }),
    false,
  );
  assert.equal(aggregateSwaps(...stableSwap), 'stepwise');
  assert.equal(aggregateSwaps(...conflictingSwap), 'unresolved');
  assert.equal(aggregateSwaps(...restoreVotes), 'alpha');
  assert.equal(aggregateSwaps(restoreVotes[0], restoreTie), 'unresolved');
  assert.equal(aggregateSwaps(receipt('tie'), receipt('tie', true)), 'tie');
  assert.equal(aggregateSwaps(receipt('tie'), receipt('A', true)), 'unresolved');
  assert.equal(aggregateSwaps(receipt('B'), receipt('review', true)), 'review');
  assert.throws(() => aggregateSwaps(receipt('B'), receipt('A', true, 'different-case')));
  assert.throws(() => aggregateSwaps(receipt('B'), { ...receipt('A', true), config: 'rubric-v2' }));
  assert.throws(() => aggregateSwaps(receipt('B'), receipt('A')));
  assert.deepEqual(
    records.filter((record) => labels.includes(record.outcome)).map((record) => record.outcome),
    judge,
  );
  assert.equal(records.filter((record) => record.human === record.outcome).length, matches);
  assert.deepEqual(
    anchors.map((anchor) => anchor.level),
    [0, 1, 2],
  );
  assert.equal(judgeRun.tools.length + judgeRun.secrets.length, 0);
  assert.equal(attempts, resolved + unresolved + review);
  assert.equal(resolved / attempts, 0.8);
  assert.equal(matches / resolved, 0.75);
  return true;
}
