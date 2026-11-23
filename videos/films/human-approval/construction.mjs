import assert from 'node:assert/strict';
import { progressBetween } from './arithmetic.mjs';
import {
  EXECUTION_CUES,
  FRESH_PROPOSAL,
  PROPOSAL,
  REVIEW_EXERCISE,
  preparationIntervals,
} from './fixtures.mjs';
import { decisionStore, digest, operationTarget, store } from './model.mjs';
export function staleSnapshot(beat, progress) {
  const revision = beat === 0 && progress < 0.35 ? 3 : 4,
    attempted = beat > 0;
  const target = operationTarget(revision);
  let rejected = false;
  if (attempted) {
    try {
      target.apply('op-17', PROPOSAL);
    } catch (error) {
      assert.match(error.message, /inside the write/);
      rejected = true;
    }
  }
  return {
    revision,
    attempted,
    rejected,
    effects: target.effects,
  };
}
export function executionSnapshot(beat, progress, cues) {
  const cueIds = {
    claim: 'execute-claim-complete',
    dispatch: 'execute-and-reconcile-b1-1',
    apply: 'execute-apply-complete',
    replyLost: 'execute-and-reconcile-b1-2',
    timeout: 'execute-timeout-complete',
    query: 'execute-and-reconcile-b2-1',
    receipt: 'execute-and-reconcile-b2-2',
  };
  const reached = (event, atBeat) =>
    cues
      ? cues[cueIds[event]]?.phase === 'after'
      : beat > atBeat || (beat === atBeat && progress >= EXECUTION_CUES[event]);
  const claimed = reached('claim', 0),
    dispatched = reached('dispatch', 0),
    applied = reached('apply', 0),
    replyLost = reached('replyLost', 0),
    timedOut = reached('timeout', 1),
    queryIssued = reached('query', 1),
    receiptRecorded = reached('receipt', 1);
  const target = operationTarget(FRESH_PROPOSAL.revision, FRESH_PROPOSAL.fromTraffic),
    operationId = FRESH_PROPOSAL.operationId;
  let receipt = null;
  if (applied) {
    assert.ok(store.permits('review-18', FRESH_PROPOSAL, 4, 100));
    target.apply(operationId, FRESH_PROPOSAL);
  }
  if (queryIssued) {
    const queried = target.query(operationId);
    assert.ok(queried);
    if (receiptRecorded) receipt = queried;
  }
  return {
    operationId,
    claimed,
    dispatched,
    applied,
    replyLost,
    timedOut,
    queryIssued,
    receiptRecorded,
    effects: target.effects,
    targetRevision: target.row.revision,
    targetShare: target.row.trafficPercent,
    receipt,
    hostState: receiptRecorded
      ? 'executed'
      : timedOut
        ? 'unknown'
        : claimed
          ? 'executing'
          : 'authorized',
  };
}
export function preparationSnapshot(sceneId, beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * preparationIntervals[sceneId][beat];
  const phase = (atBeat, start, end) =>
    beat < atBeat ? 0 : beat > atBeat ? 1 : progressBetween(elapsed, start, end);
  const reached = (atBeat, seconds) => beat > atBeat || (beat === atBeat && elapsed >= seconds);
  if (sceneId === 'choose-review')
    return {
      elapsed,
      tierProgress: [
        [3.625, 4.5875],
        [5.6, 8.45],
        [9.35, 11.3],
      ].map(([start, end]) => phase(0, start, end)),
      focus:
        beat === 0
          ? elapsed < 5.6
            ? 0
            : elapsed < 9.35
              ? 1
              : 2
          : beat === 1
            ? elapsed < 4.9125
              ? 1
              : elapsed < 10.225
                ? 2
                : -1
            : -1,
      contextualComparison: reached(1, 3.2625),
    };
  if (sceneId === 'durable-pending') {
    const persisted = reached(0, 11.6375),
      notified = reached(1, 3.175),
      restarted = reached(1, 4.65),
      recovered = reached(1, 9.6625);
    const record = persisted
      ? {
          operationId: PROPOSAL.operationId,
          revision: PROPOSAL.revision,
          expiresAt: 200,
          reviewerRule: 'casey',
          status: 'pending',
        }
      : null;
    return {
      elapsed,
      persistProgress: phase(0, 0.7625, 11.6375),
      persisted,
      record,
      noticeProgress: phase(1, 1.95, 3.175),
      notified,
      restartProgress: phase(1, 4.65, 5.2125),
      restarted,
      newWorkerProgress: phase(1, 6.8125, 7.4625),
      recoveryProgress: phase(1, 7.6125, 9.6625),
      recovered,
      recoveredRecord: recovered
        ? {
            ...record,
          }
        : null,
      localWait: restarted
        ? null
        : {
            operationId: PROPOSAL.operationId,
          },
      effects: 0,
    };
  }
  const serialized = reached(0, 11.6),
    digestReady = reached(0, 12.6625),
    eligible = reached(1, 10.575),
    saved = reached(1, 13.1375);
  const stagedDecision = reached(1, 1.9)
    ? {
        reviewer: 'casey',
        digest: digest(PROPOSAL),
        revision: 3,
        decision: 'approve',
        expiresAt: 200,
      }
    : null;
  const record = saved
    ? decisionStore().decide('review-17', PROPOSAL, 'casey', 'approve', 200)
    : null;
  return {
    elapsed,
    proposal: PROPOSAL,
    packetProgress: phase(0, 8.65, 11.6),
    serialized,
    evidenceProgress: phase(0, 5.35, 7.55),
    digestProgress: phase(0, 12.0375, 12.6625),
    digestReady,
    proposalDigest: digestReady ? digest(PROPOSAL) : null,
    decisionProgress: phase(1, 0.55, 1.9),
    stagedDecision,
    eligible,
    saved,
    record,
    executionDigest: beat === 2 ? digest(PROPOSAL) : null,
  };
}
export function reviewExercise(rows = REVIEW_EXERCISE, now = 25) {
  const reviewed = rows.filter((r) => r.started !== null && r.started <= now),
    decisions = rows.filter((r) => r.decided !== null && r.decided <= now),
    seeded = rows.filter((r) => r.seeded),
    caught = seeded.filter(
      (r) => r.decision === 'reject' && r.decided !== null && r.decided <= now,
    ),
    expired = rows.filter((r) => r.decision === null && r.expires <= now),
    approved = decisions.filter((r) => r.decision === 'approve');
  const waitSum = reviewed.reduce((sum, r) => sum + r.started - r.submitted, 0),
    responseSum = decisions.reduce((sum, r) => sum + r.decided - r.started, 0);
  return {
    rows,
    now,
    reviewed,
    decisions,
    seeded,
    caught,
    expired,
    approved,
    waitSum,
    responseSum,
    waitMean: reviewed.length ? waitSum / reviewed.length : null,
    responseMean: decisions.length ? responseSum / decisions.length : null,
    effects: 0,
  };
}
