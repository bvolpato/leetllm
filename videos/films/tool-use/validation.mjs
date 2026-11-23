import { OBSERVATION_CUES, RETRY_CUES, RETRY_TRACE } from './fixtures.mjs';
import {
  budgetSnapshot,
  envelopeSnapshot,
  observationSnapshot,
  retrySnapshot,
  writeGateSnapshot,
} from './construction.mjs';
import { admitToolResult, authorize, observationTrace, validArgs } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const incomplete = envelopeSnapshot(1, 0.5),
    complete = envelopeSnapshot(1, 0.88);
  assert.equal(incomplete.count, 2);
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.ready, false);
  assert.equal(complete.wire, '{"book_id":"B7"}');
  assert.equal(complete.ready, true);
  assert.equal(complete.bytes, 16);
  assert.equal(writeGateSnapshot(0, 0.9).allowed, false);
  assert.equal(writeGateSnapshot(1, 0.2).effects, 1);
  assert.equal(writeGateSnapshot(1, 6 / 15.558).book, 'B8');
  assert.equal(writeGateSnapshot(1, 6 / 15.558).allowed, false);
  assert.equal(writeGateSnapshot(1, 0.88).session.holdGrant, false);
  assert.equal(writeGateSnapshot(1, 0.88).effects, 0);
  assert.equal(writeGateSnapshot(2, 0.2).effects, 0);
  assert.equal(writeGateSnapshot(2, 0.8).effects, 1);
  assert(
    validArgs({
      book_id: 'B7',
    }),
  );
  assert.equal(
    validArgs({
      book_id: 7,
    }),
    false,
  );
  assert.equal(
    validArgs({
      book_id: 'B7',
      place_hold: true,
    }),
    false,
  );
  assert.equal(
    authorize(
      {
        reader: 'lena',
      },
      'lookup',
      'B7',
    ),
    true,
  );
  assert.equal(
    authorize(
      {
        reader: 'lena',
      },
      'hold',
      'B7',
    ),
    false,
  );
  assert.equal(
    authorize(
      {
        reader: 'other',
        holdGrant: true,
      },
      'hold',
      'B7',
    ),
    false,
  );
  assert(
    authorize(
      {
        reader: 'lena',
        holdGrant: true,
      },
      'hold',
      'B7',
    ),
  );
  const trace = observationTrace(),
    beforeResult = observationSnapshot(0, OBSERVATION_CUES.result - 0.001),
    atResult = observationSnapshot(0, OBSERVATION_CUES.result),
    beforeLink = observationSnapshot(0, OBSERVATION_CUES.linkStart - 0.001),
    atLinkStart = observationSnapshot(0, OBSERVATION_CUES.linkStart),
    beforeAdmission = observationSnapshot(0, OBSERVATION_CUES.linked - 0.001),
    atLink = observationSnapshot(0, OBSERVATION_CUES.linked),
    beforeAnswer = observationSnapshot(1, OBSERVATION_CUES.answer - 0.001),
    atAnswer = observationSnapshot(1, OBSERVATION_CUES.answer);
  assert.equal(trace.call.call_id, 'read-7');
  assert.equal(trace.serviceResult.available_copies, 3);
  assert.equal(trace.observation.call_id, 'read-7');
  assert.equal(
    admitToolResult(trace.call, {
      ...trace.serviceResult,
      call_id: 'read-8',
    }),
    null,
    'An unrelated result must not enter this request',
  );
  assert.equal(beforeResult.visibleResult, null);
  assert.equal(atResult.visibleResult.available_copies, 3);
  assert.equal(beforeLink.linkStarted, false);
  assert.equal(atLinkStart.linkStarted, true);
  assert.equal(atLinkStart.resultAdmitted, false);
  assert.equal(beforeAdmission.visibleObservation, null);
  assert.equal(atLink.visibleObservation.call_id, 'read-7');
  assert.equal(beforeAnswer.visibleAnswer, null);
  assert.equal(atAnswer.visibleAnswer, 'River Walk has 3 copies available.');
  assert.equal(
    atAnswer.visibleObservation.available_copies,
    atAnswer.visibleResult.available_copies,
  );
  assert.equal(observationSnapshot(0, OBSERVATION_CUES.result - 0.001).resultReceived, false);
  assert.equal(observationSnapshot(0, OBSERVATION_CUES.result).resultReceived, true);
  assert.equal(observationSnapshot(0, OBSERVATION_CUES.linkStart).resultAdmitted, false);
  assert.equal(observationSnapshot(0, OBSERVATION_CUES.linked).resultAdmitted, true);
  assert.equal(observationSnapshot(1, OBSERVATION_CUES.answer - 0.001).answerVisible, false);
  assert.equal(observationSnapshot(1, OBSERVATION_CUES.answer).answerVisible, true);
  const initial = retrySnapshot(0, 0.1),
    committed = retrySnapshot(0, 0.2),
    unknown = retrySnapshot(0, 0.8),
    retrying = retrySnapshot(1, 0.3),
    replayed = retrySnapshot(1, 0.9);
  assert.equal(initial.requests, 0);
  assert.equal(initial.effects, 0);
  assert.equal(initial.ledger, null);
  assert.equal(committed.requests, 1);
  assert.equal(committed.effects, 1);
  assert.equal(committed.ledger.result, 'hold-1');
  assert.equal(committed.caller, 'Reply pending');
  assert.equal(unknown.caller, 'Unknown outcome');
  assert.equal(unknown.requests, 1);
  assert.equal(unknown.effects, 1);
  assert.equal(retrying.requests, 2);
  assert.equal(retrying.effects, 1);
  assert.equal(retrying.caller, 'Unknown outcome');
  assert.equal(replayed.requests, 2);
  assert.equal(replayed.effects, 1);
  assert.equal(replayed.ledger.result, 'hold-1');
  assert.equal(replayed.caller, 'Verified hold-1');
  assert(RETRY_TRACE.retryResult.replayed);
  assert.equal(retrySnapshot(0, RETRY_CUES.record - 0.001).effects, 0);
  assert.equal(retrySnapshot(0, RETRY_CUES.record).effects, 1);
  assert.equal(retrySnapshot(0, RETRY_CUES.replyLost - 0.001).caller, 'Reply pending');
  assert.equal(retrySnapshot(0, RETRY_CUES.replyLost).caller, 'Reply lost');
  assert.equal(retrySnapshot(0, RETRY_CUES.timeout - 0.001).caller, 'Reply lost');
  assert.equal(retrySnapshot(0, RETRY_CUES.timeout).caller, 'Timed out');
  assert.equal(retrySnapshot(0, RETRY_CUES.unknown).caller, 'Unknown outcome');
  assert.equal(retrySnapshot(1, RETRY_CUES.retry - 0.001).requests, 1);
  assert.equal(retrySnapshot(1, RETRY_CUES.retry).requests, 2);
  assert.equal(retrySnapshot(1, RETRY_CUES.response - 0.001).caller, 'Unknown outcome');
  assert.equal(retrySnapshot(1, RETRY_CUES.response).caller, 'Verified hold-1');
  const conflict = retrySnapshot(2, 0.5);
  assert(RETRY_TRACE.conflictRejected);
  assert.equal(conflict.conflict.requests, 2);
  assert.equal(conflict.conflict.effects, 1);
  assert.equal(conflict.conflict.ledger.book, 'B7');
  assert.equal(conflict.conflict.ledger.result, 'hold-1');
  const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
    phase,
    progress,
  });
  const resultCues = {
    'observation-receive-count': cue('before'),
    'observation-record-outcome': cue('before'),
    'observation-attach-call-id': cue('before'),
  };
  assert.equal(observationSnapshot(0, 1, resultCues).visibleResult, null);
  resultCues['observation-receive-count'] = cue('during', 0.1);
  assert.equal(observationSnapshot(0, 0, resultCues).visibleResult.available_copies, 3);
  assert.equal(observationSnapshot(0, 0, resultCues).visibleObservation, null);
  resultCues['observation-record-outcome'] = cue('after');
  resultCues['observation-attach-call-id'] = cue('during', 0.1);
  assert.equal(observationSnapshot(0, 0, resultCues).visibleObservation.call_id, 'read-7');
  const retryCues = {
    'retry-identity-beat-2-focus-2': cue('after'),
    'retry-identity-beat-2-focus-1': cue('after'),
    'retry-replay-saved-result': cue('before'),
  };
  assert.equal(retrySnapshot(1, 1, retryCues).caller, 'Unknown outcome');
  assert.equal(retrySnapshot(1, 1, retryCues).payloadChecked, true);
  retryCues['retry-replay-saved-result'] = cue('during', 0.1);
  assert.equal(retrySnapshot(1, 0, retryCues).caller, 'Verified hold-1');
  assert.equal(retrySnapshot(1, 0, retryCues).effects, 1);
  for (const p of [0, 0.25, 0.5, 0.75, 0.85, 1]) {
    const current = retrySnapshot(2, 0, {
      'retry-no-contract': cue('after'),
      'retry-identity-beat-3-focus-2': cue('during', p),
    });
    assert.equal(current.unsupported, true);
    assert.equal(current.reconciled, p >= 0.8);
    assert.equal(current.caller, p >= 0.8 ? 'Verified hold-1' : 'Unknown outcome');
    assert.equal(current.knownEffects, p >= 0.8 ? 1 : null);
    assert.equal(current.requests, 1);
    assert.equal(current.effects, 1);
  }
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const current = budgetSnapshot(0, {
      'transfer-reserve-attempt': cue('after'),
      'transfer-count-failure': cue('after'),
      'transfer-timeout': cue('during', p),
    });
    assert.equal(current.attempts, 2);
    assert.equal(current.spend, 0.02);
    assert.equal(current.elapsed, 400 + 600 * p);
    assert.equal(current.stopped, p === 1);
    assert(current.elapsed <= current.limit.ms);
    assert(current.spend <= current.limit.spend);
  }
  return true;
}
