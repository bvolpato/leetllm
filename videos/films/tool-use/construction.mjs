import { cueBegun, cueProgress } from './arithmetic.mjs';
import { OBSERVATION_CUES, RETRY_CUES, RETRY_TRACE, operationService } from './fixtures.mjs';
import { authorize, observationTrace, validArgs } from './model.mjs';
export function envelopeSnapshot(beat, p) {
  const chunks = ['{"book_', 'id":"B7"', '}'],
    count = beat !== 1 ? 3 : [4.2, 7.1, 12.7].filter((time) => p * 17.526 >= time).length,
    wire = chunks.slice(0, count).join('');
  let parsed = null;
  try {
    parsed = JSON.parse(wire);
  } catch {}
  const bytes = Buffer.byteLength(wire, 'utf8'),
    bounded = bytes <= 128,
    complete = parsed !== null,
    ready = bounded && complete && validArgs(parsed);
  return {
    count,
    wire,
    bytes,
    bounded,
    complete,
    ready,
  };
}
export function writeGateSnapshot(beat, p, cues) {
  const seconds = p * 15.558,
    changed = beat === 1 && cueBegun(cues, 'write-change-target', seconds >= 5.2),
    removed = beat === 1 && cueBegun(cues, 'write-remove-grant', seconds >= 7.1),
    book = changed && !removed ? 'B8' : 'B7',
    holdGrant = beat !== 0 && !removed,
    session = {
      reader: 'lena',
      holdGrant,
    },
    allowed = authorize(session, 'hold', book),
    rechecked = beat === 2 && cueBegun(cues, 'write-gate-beat-3-focus-2', p >= 0.35),
    target = operationService();
  if (allowed && (beat === 1 || rechecked))
    target.apply('policy-case', {
      book_id: book,
    });
  const service = target.snapshot(),
    verified =
      beat === 2 &&
      cueBegun(cues, 'write-verify-result', p >= 0.75) &&
      service.effects === 1 &&
      service.ledger[0]?.book === book;
  return {
    book,
    session,
    allowed,
    rechecked,
    verified,
    effects: service.effects,
    ledger: service.ledger,
  };
}
export function observationSnapshot(beat, p, cues) {
  const trace = observationTrace();
  const resultReceived =
    beat > 0 || cueBegun(cues, 'observation-receive-count', p >= OBSERVATION_CUES.result);
  const linkStarted =
    beat > 0 || cueBegun(cues, 'observation-record-outcome', p >= OBSERVATION_CUES.linkStart);
  const resultAdmitted =
    beat > 0 || cueBegun(cues, 'observation-attach-call-id', p >= OBSERVATION_CUES.linked);
  const answerVisible =
    beat > 1 ||
    (beat === 1 && cueBegun(cues, 'observation-loop-beat-2-focus-1', p >= OBSERVATION_CUES.answer));
  return {
    ...trace,
    resultReceived,
    linkStarted,
    resultAdmitted,
    answerVisible,
    visibleResult: resultReceived ? trace.serviceResult : null,
    visibleObservation: resultAdmitted ? trace.observation : null,
    visibleAnswer: answerVisible ? trace.answer : null,
  };
}
export function retrySnapshot(beat, p, cues) {
  if (cues) {
    if (beat === 0) {
      if (cueBegun(cues, 'retry-unknown-outcome', false))
        return {
          ...RETRY_TRACE.unknown,
          stage: 4,
        };
      if (cueBegun(cues, 'retry-caller-timeout', false))
        return {
          ...RETRY_TRACE.timedOut,
          stage: 3,
        };
      if (cueBegun(cues, 'retry-lost-reply', false))
        return {
          ...RETRY_TRACE.lost,
          stage: 2,
        };
      return cueBegun(cues, 'retry-identity-beat-1-focus-1', false)
        ? {
            ...RETRY_TRACE.committed,
            stage: 1,
          }
        : {
            ...RETRY_TRACE.waiting,
            stage: 0,
          };
    }
    if (beat === 1) {
      if (cueBegun(cues, 'retry-replay-saved-result', false))
        return {
          ...RETRY_TRACE.replayed,
          stage: 6,
        };
      return cueBegun(cues, 'retry-identity-beat-2-focus-2', false)
        ? {
            ...RETRY_TRACE.retrying,
            stage: 5,
            payloadChecked: cueBegun(cues, 'retry-identity-beat-2-focus-1', false),
          }
        : {
            ...RETRY_TRACE.unknown,
            stage: 4,
          };
    }
    const unsupported = cueBegun(cues, 'retry-no-contract', false),
      reconciliation = Math.min(1, cueProgress(cues, 'retry-identity-beat-3-focus-2', 0) / 0.8),
      reconciled = unsupported && reconciliation === 1;
    return {
      ...(unsupported ? RETRY_TRACE.unknown : RETRY_TRACE.replayed),
      stage: 7,
      conflict: RETRY_TRACE.conflict,
      conflictRejected: RETRY_TRACE.conflictRejected,
      unsupported,
      reconciliation,
      reconciled,
      ...(unsupported
        ? {
            caller: reconciled ? 'Verified hold-1' : 'Unknown outcome',
            knownEffects: reconciled ? 1 : null,
          }
        : {}),
    };
  }
  if (beat === 0) {
    if (p < RETRY_CUES.record)
      return {
        ...RETRY_TRACE.waiting,
        stage: 0,
      };
    if (p < RETRY_CUES.replyLost)
      return {
        ...RETRY_TRACE.committed,
        stage: 1,
      };
    if (p < RETRY_CUES.timeout)
      return {
        ...RETRY_TRACE.lost,
        stage: 2,
      };
    if (p < RETRY_CUES.unknown)
      return {
        ...RETRY_TRACE.timedOut,
        stage: 3,
      };
    return {
      ...RETRY_TRACE.unknown,
      stage: 4,
    };
  }
  if (beat === 1) {
    if (p < RETRY_CUES.retry)
      return {
        ...RETRY_TRACE.unknown,
        stage: 4,
      };
    if (p < RETRY_CUES.response)
      return {
        ...RETRY_TRACE.retrying,
        stage: 5,
      };
    return {
      ...RETRY_TRACE.replayed,
      stage: 6,
    };
  }
  return {
    ...RETRY_TRACE.replayed,
    stage: 7,
    conflict: RETRY_TRACE.conflict,
    conflictRejected: RETRY_TRACE.conflictRejected,
  };
}
export function budgetSnapshot(p, cues) {
  const reserved = cueBegun(cues, 'transfer-reserve-attempt', p > 0.15),
    firstFailed = cueBegun(cues, 'transfer-count-failure', p > 0.3),
    timeout = cueProgress(cues, 'transfer-timeout', p > 0.5 ? 1 : 0),
    second = timeout > 0 || cues?.['transfer-timeout']?.phase === 'during',
    attempts = Number(reserved) + Number(second),
    elapsed = firstFailed ? 400 + 600 * timeout : 0;
  return {
    reserved,
    firstFailed,
    second,
    timeout,
    attempts,
    elapsed,
    spend: attempts * 0.01,
    limit: {
      attempts: 2,
      ms: 1000,
      spend: 0.02,
    },
    stopped: timeout === 1,
    reads: cueBegun(cues, 'transfer-independent-reads', p > 0.7),
    writes: cueBegun(cues, 'transfer-order-writes', p > 0.8),
  };
}
