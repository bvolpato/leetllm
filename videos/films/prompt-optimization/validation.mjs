import assert from 'node:assert/strict';
import { plannedPromptRequests } from './arithmetic.mjs';
import { metricCases, searchCase, splitRows, testFixture, validationFixture } from './fixtures.mjs';
import {
  bootstrapMetricAccept,
  promptSearchSnapshot,
  safetyDecision,
  scorePair,
  selectValidationWinner,
  splitPlan,
  testReversal,
} from './model.mjs';

export function validateModel() {
  assert.deepEqual(splitPlan.records, {
    train: ['req-001', 'req-002'],
    development: ['req-101'],
    test: ['req-201'],
  });
  assert.deepEqual(splitPlan.families.train, ['approval-4412']);
  assert.deepEqual(splitPlan.rejected, [
    { ...splitRows.at(-1), assignedSplit: 'train', reason: 'family already assigned' },
  ]);

  const rollback = metricCases[0].gold;
  const deployment = metricCases[1].gold;
  assert.equal(scorePair(rollback, { ...rollback, recordId: 'approval-9999' }), 0);
  assert.equal(scorePair(rollback, rollback), 1);
  assert.equal(scorePair(deployment, rollback), 0);
  assert.equal(scorePair(deployment, deployment), 1);
  assert.deepEqual(
    metricCases
      .slice(0, 2)
      .map(({ gold, prediction }) => bootstrapMetricAccept(scorePair(gold, prediction), 1)),
    [true, false],
  );
  assert.equal(bootstrapMetricAccept(0.5, 0), true);
  assert.equal(bootstrapMetricAccept(0.5, 1), false);

  const baseline = promptSearchSnapshot(0, 0);
  const revised = promptSearchSnapshot(1, 0);
  assert.equal(baseline.caseId, revised.caseId);
  assert.deepEqual(baseline.prediction, searchCase.prediction);
  assert.deepEqual(revised.prediction, searchCase.gold);
  assert.deepEqual([baseline.score, revised.score], [0, 1]);
  assert.equal(selectValidationWinner(), 'compiled');
  assert.equal(testReversal().reversal, true);
  assert.equal(validationFixture.compiled.correct - validationFixture.baseline.correct, 5);
  assert.equal(testFixture.baseline.correct - testFixture.compiled.correct, 3);

  const plan = (trials) => plannedPromptRequests({ trials, cases: 24, teacher: 12, proposals: 9 });
  assert.deepEqual([plan(8).executions, plan(8).roleRequests, plan(8).requests], [216, 648, 669]);
  assert.equal(plan(7).requests, 597);
  assert.equal(plan(8).requests - plan(7).requests, 72);
  assert.deepEqual(safetyDecision({ forbidden: 1, relevant: 100, capPercent: 1 }), {
    percent: 1,
    verdict: 'PASS',
  });
  assert.deepEqual(safetyDecision({ forbidden: 2, relevant: 80, capPercent: 1 }), {
    percent: 2.5,
    verdict: 'HOLD',
  });
  return true;
}
