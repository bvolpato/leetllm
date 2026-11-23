import { observedUserRows, outcomes } from './fixtures.mjs';
import { assignmentSnapshot, sampleModel } from './construction.mjs';
import {
  PersistedExperiment,
  adjustedFamily,
  agreementReadout,
  assignmentResidual,
  binaryPowerTerms,
  draftConstruction,
  experimentRequirements,
  guardrailSequence,
  interval,
  mixtureReadout,
  plannedLooks,
  pointEstimate,
  rates,
  repeatTelemetry,
  rubricReadout,
  sampleSize,
  telemetryReadouts,
  tokenClocks,
  userReadout,
  zeroFailureUpper,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.deepEqual([0.05, 0.03, 0.02].map(sampleSize), [2942, 8258, 18672]);
  assert.equal(rates(outcomes)[1].rate, 1 / 3);
  assert.equal(outcomes.filter((r) => r.served === 'T').length, 1);
  assert(Math.abs(interval(3).se / interval().se - 1 / Math.sqrt(3)) < 1e-12);
  assert(interval().low > 0);
  assert.equal(
    sampleModel('ratio', {
      beat: 1,
      beatP: 0.99,
    }).chi,
    25,
  );
  assert(
    !sampleModel('ratio', {
      beat: 0,
      beatP: 0.5,
    }).flag,
  );
  assert.equal(
    sampleModel('looks', {
      beat: 0,
      beatP: 0.99,
    }).visible,
    1,
  );
  assert.equal(
    sampleModel('looks', {
      beat: 1,
      beatP: 0.2,
    }).first,
    null,
  );
  assert.equal(
    sampleModel('looks', {
      beat: 1,
      beatP: 0.8,
    }).first,
    3,
  );
  assert.equal(
    sampleModel('looks', {
      beat: 1,
      beatP: 0.99,
    }).visible,
    3,
  );
  assert.equal(
    sampleModel('screen', {
      beat: 1,
      beatP: 0.5,
    }).score,
    0.9,
  );
  assert(
    sampleModel('intro', {
      beat: 0,
      beatP: 0.5,
    }).checks.every((row) => !row.pass),
  );
  assert.equal(assignmentSnapshot(0, 0.12).settled, false);
  assert.equal(assignmentSnapshot(0, 0.5).settled, true);
  assert.equal(assignmentSnapshot(0, 0.99).mature.length, 0);
  assert.equal(
    assignmentSnapshot(1, 6 / 23.882).mature.some((row) => row.id === 'T2'),
    false,
  );
  assert.equal(
    assignmentSnapshot(1, 6.02 / 23.882).mature.find((row) => row.id === 'T2').served,
    'C',
  );
  assert.equal(assignmentSnapshot(1, 7.3 / 23.882).complete, true);
  const complete = assignmentSnapshot(1, 0.9);
  assert.deepEqual(
    complete.assignedRates.map((row) => [row.arm, row.n, row.success]),
    [
      ['C', 3, 2],
      ['T', 3, 1],
    ],
  );
  assert.deepEqual(
    complete.servedOnly.map((row) => row.id),
    ['T1'],
  );
  for (const snapshot of telemetryReadouts) {
    assert.equal(snapshot.correct.uniqueUsers, 4000);
    assert.equal(snapshot.naive.rows, 4000 * snapshot.copies);
    for (const key of ['a', 'b', 'd', 'se', 'low', 'high']) {
      assert(Math.abs(snapshot.correct[key] - interval()[key]) < 1e-12);
      assert(Math.abs(snapshot.naive[key] - interval(snapshot.copies)[key]) < 1e-12);
    }
  }
  assert.throws(
    () =>
      userReadout([
        ...observedUserRows,
        {
          ...observedUserRows[0],
          arm: 'T',
        },
      ]),
    /Conflicting telemetry/,
  );
  assert.throws(() => repeatTelemetry(0), /positive integer/);
  for (let b = 0; b < 2; b++)
    for (let i = 0; i <= 100; i++) {
      const snapshot = assignmentSnapshot(b, i / 100);
      assert.equal(new Set(snapshot.users.map((row) => row.id)).size, 6);
      for (const row of snapshot.users)
        assert.equal(row.assigned, outcomes.find((original) => original.id === row.id).assigned);
    }
  assert.equal(
    sampleModel('looks', {
      beat: 1,
      beatP: 0,
      cues: {
        'looks-second-receipt': {
          progress: 1,
        },
        'looks-third-receipt': {
          phase: 'before',
        },
      },
    }).visible,
    2,
  );
  assert.equal(
    sampleModel('looks', {
      beat: 1,
      beatP: 0,
      cues: {
        'looks-second-receipt': {
          progress: 1,
        },
        'looks-third-receipt': {
          phase: 'during',
        },
      },
    }).first,
    3,
  );
  return true;
}
export function validateOnlineABModel() {
  const worksheet = pointEstimate();
  assert.equal(worksheet.percentagePoints.toFixed(1), '3.2');
  assert.equal(worksheet.relativePercent.toFixed(2), '5.33');
  assert.deepEqual(rubricReadout().a, [3.4, 3.2, 1]);
  assert.deepEqual(rubricReadout().b, [4.2, 4.2, 4.6]);
  assert.equal(binaryPowerTerms().total, 2942);
  assert.equal(binaryPowerTerms(0.6, 0.025).total, 11922);
  assert.equal(plannedLooks([0.23, 0.036, 0.008, 0.02]).first, 3);
  const alternate = [0.23, 0.016, 0.008, 0.02];
  assert.equal(plannedLooks(alternate).first, 3);
  assert.equal(plannedLooks(alternate.slice(0, 2)).first, 2);
  assert.equal(binaryPowerTerms(0.4, 0.04).total, 4778);
  assert.equal(assignmentResidual(5250, 4750).chi, 25);
  assert(Math.abs(assignmentResidual(5250, 4750).pApprox - 5.733031437583892e-7) < 1e-13);
  assert.equal(assignmentResidual(800, 1200, 0.4).chi, 0);
  assert.deepEqual(adjustedFamily([0.03, 0.001, 0.021, 0.04]).bh, [0.04, 0.004, 0.04, 0.04]);
  assert.equal(zeroFailureUpper(100), 0.029513049607039932);
  const router = new PersistedExperiment(),
    r = router.assign('docs-prompt-v1', 'thread-7', 0.1);
  assert.equal(r.assigned, 'C');
  assert.equal(router.assign('docs-prompt-v1', 'thread-7', 1).assigned, 'C');
  assert.equal(router.assign('different', 'thread-7', 1).assigned, 'T');
  const draft = draftConstruction(
    [
      'retry-budget-guide',
      'rate-limit-reference',
      'idempotency-guide',
      'backoff-examples',
      'gateway-runbook',
    ],
    [
      'rate-limit-reference',
      'retry-budget-guide',
      'timeout-runbook',
      'backoff-examples',
      'auth-migration',
    ],
  );
  assert.deepEqual(
    draft.rows.map((r) => r.id),
    [
      'rate-limit-reference',
      'retry-budget-guide',
      'idempotency-guide',
      'timeout-runbook',
      'backoff-examples',
    ],
  );
  assert.deepEqual(draft.owned.A, ['retry-budget-guide', 'idempotency-guide']);
  assert.deepEqual(
    draftConstruction(['shared'], ['shared', 'b-only-1', 'b-only-2'], 3, ['A']).neutral,
    ['shared'],
  );
  assert.deepEqual(tokenClocks().gaps, [40, 40, 120]);
  assert.equal(tokenClocks([300]).tpot, null);
  assert.deepEqual(
    guardrailSequence([0.994, null, 0.994, 0.994, 0.995], {
      direction: 'min',
      limit: 0.995,
      windows: 2,
    })
      .filter((r) => r.recommendation)
      .map((r) => r.index + 1),
    [2, 4],
  );
  assert.equal(mixtureReadout().a, 0.73);
  assert(Math.abs(mixtureReadout().standardA - 0.775) < 1e-12);
  assert.equal(agreementReadout().count, 6);
  const failed = experimentRequirements(),
    repaired = experimentRequirements({
      times: [2.8, 2.8],
    });
  assert(failed.primary && failed.safety && !failed.absolute && !failed.eligible);
  assert(repaired.eligible);
  assert.equal(failed.d, repaired.d);
  assert.equal(failed.low, repaired.low);
  assert.equal(failed.high, repaired.high);
  const smallerGain = experimentRequirements({ times: repaired.times, bSuccess: 620 });
  assert(smallerGain.absolute && smallerGain.safety && !smallerGain.eligible);
  assert.equal((100 * smallerGain.low).toFixed(3), '-2.274');
  assert.equal((100 * smallerGain.high).toFixed(3), '6.274');
  return true;
}
export function validateModel() {
  validateOriginalModel();
  validateOnlineABModel();
  return true;
}
