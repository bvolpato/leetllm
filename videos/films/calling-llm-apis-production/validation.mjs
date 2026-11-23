import { customerQuestion, sceneIds, trusted } from './fixtures.mjs';
import {
  apiChapterState,
  breakerConstruction,
  retryConstruction,
  sampleOriginalModel,
  timeoutSnapshot,
} from './construction.mjs';
import {
  actionReceipt,
  accountB,
  bufferThrough,
  deadlineReservation,
  freshBudget,
  jitterWindows,
  usageReceipt,
  breakerSnapshot,
  checkRotation,
  classifyFailure,
  costTrace,
  idempotentJobTrace,
  redactedTelemetry,
  retryPlan,
  streamSnapshot,
  validationCases,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  const opened = sampleOriginalModel('circuit-breaker', {
    beat: 1,
    beatP: 0.01,
    cues: {
      'breaker-first-receipt': {
        phase: 'after',
        progress: 1,
      },
      'breaker-failure-two-b2-1': {
        phase: 'during',
        progress: 0.01,
      },
    },
  });
  assert.equal(opened.failures, 2);
  assert.equal(opened.state, 'open');
  assert.equal(trusted.ageDays >= trusted.thresholdDays, true);
  assert.equal(trusted.ageDays - trusted.thresholdDays, 15);
  const cases = validationCases();
  assert.deepEqual(
    cases.map((row) => row.result.status),
    ['fact_mismatch', 'policy_mismatch', 'accepted'],
  );
  assert.equal(
    checkRotation({
      decision: 'eligible',
      minimum_key_age_days: true,
      source_line_ids: ['P-7'],
    }).status,
    'invalid_threshold',
  );
  const retry = retryPlan();
  assert.deepEqual(
    [retry.remainingAfterFirst, retry.wait, retry.secondAttempt.end, retry.fits],
    [6, 2.5, 19.5, true],
  );
  assert.equal(retry.shortBudgetFits, false);
  assert.equal(retryConstruction(2, 1).time, 19.5);
  assert.equal(retryConstruction(2, 1).remaining, 0.5);
  assert.equal(breakerConstruction(1, 2 / 10.47).failures, 1);
  assert.equal(breakerConstruction(1, 4.5 / 10.47).state, 'open');
  assert.equal(breakerConstruction(2, 3 / 16.28).state, 'half_open');
  assert.equal(breakerConstruction(2, 5 / 16.28).success, true);
  assert.equal(breakerConstruction(2, 8 / 16.28).failure, true);
  assert.equal(classifyFailure(429, 'rate_limit'), 'bounded_retry');
  assert.equal(classifyFailure(429, 'credit_balance_exhausted'), 'fix_quota');
  assert.equal(classifyFailure(401, ''), 'fix_credentials_or_access');
  assert.deepEqual(
    [breakerSnapshot(0).state, breakerSnapshot(1).state, breakerSnapshot(2).state],
    ['closed', 'open', 'half_open'],
  );
  assert.deepEqual(
    [breakerSnapshot(2).recovery.success, breakerSnapshot(2).recovery.failure],
    ['closed', 'open'],
  );
  assert.equal(idempotentJobTrace(2).jobs, 1);
  assert.equal(idempotentJobTrace(2).safe, true);
  assert.equal(streamSnapshot(0).readyForValidation, false);
  assert.equal(streamSnapshot(2).readyForValidation, true);
  const costs = costTrace();
  assert.equal(costs.inputCost + costs.outputCost, 0.00098);
  assert.equal(costs.monthlyCost, 5880);
  assert.deepEqual(Object.keys(costs.log).sort(), [
    'estimatedCost',
    'inputTokens',
    'latencyMs',
    'model',
    'outputTokens',
    'promptVersion',
    'questionFingerprint',
    'status',
  ]);
  assert.equal(costs.log.questionFingerprint, '85ef707a963bf1208e6621899bd3c995');
  const pending = redactedTelemetry({
    question: customerQuestion,
    fingerprintKey: 'dev-only-fingerprint-key',
    usage: null,
    apiKey: 'private',
    accountId: trusted.accountId,
  });
  assert.equal(pending.inputTokens, null);
  assert.equal(pending.outputTokens, null);
  assert.equal(pending.estimatedCost, null);
  assert.equal(pending.status, 'usage_pending');
  assert.ok(!JSON.stringify(pending).includes(trusted.accountId));
  assert.ok(!JSON.stringify(pending).includes(customerQuestion));
  assert.ok(!Object.hasOwn(pending, 'apiKey'));
  assert.notEqual(
    redactedTelemetry({
      question: customerQuestion,
      fingerprintKey: 'another-tenant-key',
      usage: null,
    }).questionFingerprint,
    pending.questionFingerprint,
  );
  assert.throws(() =>
    redactedTelemetry({
      question: customerQuestion,
      fingerprintKey: 'key',
      usage: {
        inputTokens: -1,
        outputTokens: 0,
      },
    }),
  );
  assert.equal(timeoutSnapshot(0.12).timedOut, false);
  assert.equal(timeoutSnapshot(0.5).timedOut, true);
  assert.equal(timeoutSnapshot(0.88).remoteActive, true);
  assert.equal(timeoutSnapshot(0.88).clientWait, 4);
  assert.equal(timeoutSnapshot(0.88).acknowledgedRemoteResult, null);
  assert.ok(timeoutSnapshot(0.88).remoteWork > timeoutSnapshot(0.5).remoteWork);
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.1, 0.5, 0.9, 1]) {
        const sample = sampleOriginalModel(id, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat < 2 ? beat + 1 : beat);
      }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  for (const [remaining, allowed] of [
    [6, true],
    [5.5, false],
  ]) {
    const plan = deadlineReservation(remaining);
    assert.deepEqual([plan.wait, plan.required, plan.admitted], [2.5, 5.9, allowed]);
  }
  assert.deepEqual(
    [freshBudget.wait, freshBudget.required, freshBudget.admitted],
    [1.5, 4.2, false],
  );
  const proposed = { decision: 'eligible', minimum_key_age_days: 30, source_line_ids: ['P-7'] };
  assert.equal(checkRotation(proposed, accountB).status, 'policy_mismatch');
  assert.equal(
    checkRotation({ ...proposed, minimum_key_age_days: 21 }, accountB).status,
    'accepted',
  );
  assert.deepEqual(
    jitterWindows(true).map((row) => row.wait),
    [0.5, 1],
  );
  assert.deepEqual(
    jitterWindows(false).map((row) => row.wait),
    [2, 3.5],
  );
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => bufferThrough(n).length),
    [8, 19, 31, 41],
  );
  for (const [cached, expectedCost] of [
    [1200, 0.00345],
    [1600, 0.00285],
  ]) {
    const usage = usageReceipt(cached);
    assert.equal(usage.ordinary + usage.cached + usage.writes, 2000);
    assert.deepEqual([usage.output, usage.visible, usage.cost], [200, 120, expectedCost]);
  }
  const write = { kind: 'create', key: 'R-B' };
  const lookup = { kind: 'status', key: 'R-B', jobId: 'JOB-042' };
  assert.deepEqual(actionReceipt('R-B', [write]), { writes: 1, jobId: null });
  assert.deepEqual(actionReceipt('R-B', [write, lookup]), { writes: 1, jobId: 'JOB-042' });
  assert.equal(actionReceipt('R-B', [write, { ...lookup, key: 'R-C' }]).jobId, null);
  assert.equal(
    apiChapterState('usage-subsets', {
      beat: 1,
      beatP: 1,
    }).cost,
    0.00345,
  );
  const fresh = apiChapterState('fresh-request', {
    beat: 1,
    beatP: 1,
  });
  assert.equal(fresh.wait, 1.5);
  assert.equal(fresh.total, 4.2);
  assert(fresh.total > fresh.remaining);
  assert.equal(
    apiChapterState('stream-failures', {
      beat: 1,
      beatP: 1,
    }).length,
    41,
  );
  assert.equal(
    apiChapterState('stream-failures', {
      beat: 2,
      beatP: 1,
    }).length,
    19,
  );
  assert.equal(
    apiChapterState('stream-failures', {
      beat: 2,
      beatP: 1,
    }).status,
    'failed',
  );
  assert.deepEqual(
    apiChapterState('jitter-geometry', {
      beat: 2,
      beatP: 1,
    }).decorrelatedWaits,
    [2, 3.5],
  );
  assert.equal(0.5 * (3 * 1 - 1) + 1, 2);
  assert.equal(1 + 0.5 * (3 * 2 - 1), 3.5);
  assert.equal(700 + 1200 + 100, 2000);
  assert.equal(120 + 80, 200);
  return true;
}
