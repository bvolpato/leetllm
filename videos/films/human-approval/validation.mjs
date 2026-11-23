import assert from 'node:assert/strict';
import { admissionBudget } from './arithmetic.mjs';
import {
  executionSnapshot,
  preparationSnapshot,
  reviewExercise,
  staleSnapshot,
} from './construction.mjs';
import {
  FRESH_PROPOSAL,
  PRACTICE_PROPOSAL,
  PROPOSAL,
  RELEASE_WINDOW,
  REVIEW_EXERCISE,
} from './fixtures.mjs';
import {
  conditionalWrite,
  decisionStore,
  deploymentRow,
  digest,
  envelopeFixture,
  operationTarget,
  store,
} from './model.mjs';
export function validateModel() {
  assert.equal(
    admissionBudget(
      [
        {
          at: 0,
          from: 0,
          to: 9,
        },
        {
          at: 1,
          from: 9,
          to: 18,
        },
        {
          at: 3601,
          from: 18,
          to: 0,
        },
        {
          at: 3602,
          from: 0,
          to: 5,
        },
      ],
      3601,
    ),
    0,
  );
  assert.equal(
    admissionBudget(
      [
        {
          at: 100,
          from: 0,
          to: 9,
        },
      ],
      200,
      [
        {
          at: 150,
          from: 9,
          to: 18,
        },
      ],
    ),
    18,
  );
  const copy = envelopeFixture(),
    edited = envelopeFixture(10);
  assert.equal(copy.value.arguments.trafficPercent, 25);
  assert.notEqual(copy.digest, edited.digest);
  assert.equal(copy.digest.length, 64);
  assert.equal(copy.digest, digest(PROPOSAL));
  assert.equal(edited.digest, digest({ ...PROPOSAL, trafficPercent: 10 }));
  assert.equal(conditionalWrite(deploymentRow(3, 0), PROPOSAL).rows, 1);
  assert.deepEqual(conditionalWrite(deploymentRow(4, 10), PROPOSAL), {
    rows: 0,
    row: deploymentRow(4, 10),
  });
  assert.deepEqual(conditionalWrite(deploymentRow(3, 0), PROPOSAL).row, deploymentRow(4, 25));
  const practiceTarget = operationTarget(PRACTICE_PROPOSAL.revision, PRACTICE_PROPOSAL.fromTraffic);
  const practiceReceipt = practiceTarget.apply('op-58', PRACTICE_PROPOSAL);
  assert.equal(practiceReceipt.trafficPercent, 15);
  assert.equal(practiceReceipt.revision, 59);
  assert.equal(practiceTarget.query('op-58'), practiceReceipt);
  assert.equal(practiceTarget.query('maintenance-57'), null);
  assert.equal(practiceTarget.effects, 1);
  const exercise = reviewExercise();
  assert.equal(exercise.waitSum, 26);
  assert.equal(exercise.waitMean, 5.2);
  assert.equal(exercise.responseSum, 32);
  assert.equal(exercise.responseMean, 6.4);
  assert.equal(exercise.expired.length, 1);
  assert.equal(exercise.rows.length, 6);
  assert.equal(exercise.caught.length, 2);
  assert.equal(exercise.seeded.length, 3);
  assert.equal(exercise.approved.length, 3);
  assert.equal(exercise.decisions.length, 5);
  assert.equal(exercise.effects, 0);
  assert.equal(reviewExercise([], 25).waitMean, null);
  assert.equal(reviewExercise(REVIEW_EXERCISE, 19).expired.length, 0);
  assert.equal(digest(PROPOSAL).length, 64);
  assert.ok(store.permits('review-17', PROPOSAL, 3, 100));
  assert.ok(store.permits('review-17', PROPOSAL, 3, RELEASE_WINDOW.reviewBefore));
  assert.throws(
    () => decisionStore().decide('late', PROPOSAL, 'casey', 'approve', 200, 200, 220),
    /review window/,
  );
  for (const [value, live, now] of [
    [
      {
        ...PROPOSAL,
        trafficPercent: 50,
      },
      3,
      100,
    ],
    [PROPOSAL, 4, 100],
    [PROPOSAL, 3, RELEASE_WINDOW.executeBefore],
    [
      {
        ...PROPOSAL,
        operationId: 'op-other',
      },
      3,
      100,
    ],
  ])
    assert.ok(!store.permits('review-17', value, live, now));
  assert.ok(!store.permits('invented-review', PROPOSAL, 3, 100));
  const rejected = decisionStore();
  rejected.decide('r', PROPOSAL, 'casey', 'reject', 200);
  assert.ok(!rejected.permits('r', PROPOSAL, 3, 100));
  assert.throws(
    () => decisionStore().decide('r', PROPOSAL, 'model-output', 'approve', 200),
    /trusted release policy/,
  );
  assert.notEqual(digest(PROPOSAL), digest(FRESH_PROPOSAL));
  assert.ok(store.permits('review-18', FRESH_PROPOSAL, 4, 100));
  assert.ok(!store.permits('review-17', FRESH_PROPOSAL, 4, 100));
  assert.ok(!store.permits('review-18', PROPOSAL, 4, 100));
  assert.ok(
    !store.permits(
      'review-18',
      {
        ...FRESH_PROPOSAL,
        evidence: PROPOSAL.evidence,
      },
      4,
      100,
    ),
  );
  assert.ok(
    !store.permits(
      'review-18',
      {
        ...FRESH_PROPOSAL,
        trafficPercent: 50,
      },
      4,
      100,
    ),
  );
  const target = operationTarget(4),
    receipt = target.apply('op-18', FRESH_PROPOSAL),
    replyLost = true;
  const executionState = replyLost ? 'unknown' : receipt.status;
  assert.equal(executionState, 'unknown');
  assert.deepEqual(target.query('op-18'), receipt);
  assert.deepEqual(target.apply('op-18', FRESH_PROPOSAL), receipt);
  assert.equal(target.effects, 1);
  assert.equal(receipt.revision, 5);
  assert.equal(receipt.operationId, FRESH_PROPOSAL.operationId);
  assert.equal(target.query('op-17'), null);
  assert.throws(
    () =>
      target.apply('op-18', {
        ...FRESH_PROPOSAL,
        trafficPercent: 50,
      }),
    /one payload/,
  );
  assert.equal(target.query('missing'), null);
  const staleTarget = operationTarget(4);
  assert.throws(() => staleTarget.apply('op-17', PROPOSAL), /inside the write/);
  assert.equal(staleTarget.effects, 0);
  assert.equal(staleSnapshot(0, 0.1).revision, 3);
  assert.equal(staleSnapshot(0, 0.5).revision, 4);
  assert.equal(staleSnapshot(1, 0.1).rejected, true);
  assert.equal(staleSnapshot(1, 0.1).effects, 0);
  assert.throws(() => operationTarget().apply('new-op', PROPOSAL), /reviewed action/);
  const before = executionSnapshot(0, 0.26);
  assert.equal(before.hostState, 'authorized');
  assert.equal(before.effects, 0);
  assert.equal(before.targetShare, 10);
  assert.equal(executionSnapshot(0, 0.27).hostState, 'executing');
  assert.equal(executionSnapshot(0, 0.35).dispatched, false);
  assert.equal(executionSnapshot(0, 0.36).dispatched, true);
  assert.equal(executionSnapshot(0, 0.64).effects, 0);
  assert.equal(executionSnapshot(0, 0.65).effects, 1);
  assert.equal(executionSnapshot(0, 0.83).replyLost, false);
  assert.equal(executionSnapshot(0, 0.84).replyLost, true);
  assert.equal(executionSnapshot(0, 0.99).hostState, 'executing');
  assert.equal(executionSnapshot(1, 0.17).timedOut, false);
  assert.equal(executionSnapshot(1, 0.18).hostState, 'unknown');
  assert.equal(executionSnapshot(1, 0.23).queryIssued, false);
  assert.equal(executionSnapshot(1, 0.24).queryIssued, true);
  assert.equal(executionSnapshot(1, 0.55).receipt, null);
  const reconciled = executionSnapshot(1, 0.56);
  assert.equal(reconciled.hostState, 'executed');
  assert.equal(reconciled.receipt.operationId, 'op-18');
  assert.equal(reconciled.receipt.revision, 5);
  assert.equal(reconciled.targetShare, 25);
  assert.equal(reconciled.receipt.effectCount, 1);
  assert.deepEqual(executionSnapshot(2, 0.1), reconciled);
  for (const beat of [0, 1, 2])
    for (const p of [0, 0.1, 0.27, 0.36, 0.5, 0.65, 0.84, 0.99]) {
      const s = executionSnapshot(beat, p);
      assert.equal(s.effects, Number(s.applied));
      assert.equal(s.operationId, FRESH_PROPOSAL.operationId);
      assert.ok(!s.dispatched || s.claimed);
      assert.ok(!s.applied || s.dispatched);
      assert.ok(!s.replyLost || s.applied);
      assert.ok(!s.timedOut || s.replyLost);
      assert.ok(!s.queryIssued || s.timedOut);
      assert.ok(!s.receiptRecorded || s.queryIssued);
      assert.equal(s.hostState === 'unknown', s.timedOut && !s.receiptRecorded);
      assert.equal(Boolean(s.receipt), s.receiptRecorded);
    }
  const tiers = preparationSnapshot('choose-review', 0, 12 / 14.95);
  assert.deepEqual(tiers.tierProgress, [1, 1, 1]);
  const restarted = preparationSnapshot('durable-pending', 1, 5.3 / 11.14);
  assert.equal(restarted.persisted, true);
  assert.equal(restarted.notified, true);
  assert.equal(restarted.localWait, null);
  assert.equal(restarted.recovered, false);
  const recovered = preparationSnapshot('durable-pending', 1, 10 / 11.14);
  assert.deepEqual(recovered.recoveredRecord, recovered.record);
  assert.equal(recovered.effects, 0);
  assert.equal(preparationSnapshot('bind-decision', 0, 12.5 / 14.23).proposalDigest, null);
  assert.equal(
    preparationSnapshot('bind-decision', 0, 13 / 14.23).proposalDigest,
    digest(PROPOSAL),
  );
  assert.equal(
    preparationSnapshot('bind-decision', 1, 2.7 / 14.38).stagedDecision.digest,
    digest(PROPOSAL),
  );
  assert.equal(preparationSnapshot('bind-decision', 1, 12 / 14.38).record, null);
  const decided = preparationSnapshot('bind-decision', 1, 13.3 / 14.38);
  assert.equal(decided.eligible, true);
  assert.equal(decided.record.reviewer, 'casey');
  assert.equal(decided.record.operationId, 'op-17');
  return true;
}
