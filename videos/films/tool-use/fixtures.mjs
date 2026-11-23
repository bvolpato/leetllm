import assert from 'node:assert/strict';
export function operationService() {
  const saved = new Map();
  let attempts = 0,
    effects = 0;
  return {
    apply(key, payload) {
      attempts++;
      const fingerprint = JSON.stringify(payload);
      if (saved.has(key)) {
        const entry = saved.get(key);
        assert.equal(entry.fingerprint, fingerprint, 'Operation identity cannot change payload');
        return {
          ...entry.result,
          replayed: true,
        };
      }
      effects++;
      const result = {
        hold: `hold-${effects}`,
        book: payload.book_id,
      };
      saved.set(key, {
        fingerprint,
        result,
      });
      return {
        ...result,
        replayed: false,
      };
    },
    snapshot() {
      return {
        attempts,
        effects,
        ledger: [...saved].map(([operation, entry]) => ({
          operation,
          ...entry.result,
        })),
      };
    },
  };
}
export const OBSERVATION_CUES = Object.freeze({
  result: 4.7375 / (15.048 + 0.55),
  linkStart: 6.9125 / (15.048 + 0.55),
  linked: 9.8625 / (15.048 + 0.55),
  answer: 3.125 / (16.08 + 0.75),
  description: 6.625 / (15.576 + 0.55),
  authority: 9.3875 / (15.576 + 0.55),
  proposal: 10.9875 / (15.576 + 0.55),
  policy: 13.725 / (15.576 + 0.55),
});
export const RETRY_CUES = Object.freeze({
  record: 1.85 / (13.224 + 0.55),
  replyLost: 3.85 / (13.224 + 0.55),
  timeout: 5.55 / (13.224 + 0.55),
  unknown: 7.7625 / (13.224 + 0.55),
  retry: 2.9625 / (15.6 + 0.75),
  response: 11.25 / (15.6 + 0.75),
  conflict: 5.7125 / (16.56 + 0.55),
});
export function callerState(delivery) {
  if (!delivery.attempted) return 'Waiting';
  if (delivery.delivered) return `Verified ${delivery.result.hold}`;
  if (delivery.status === 'unknown') return 'Unknown outcome';
  if (delivery.status === 'timed-out') return 'Timed out';
  if (delivery.status === 'lost') return 'Reply lost';
  return 'Reply pending';
}
export function projectedRetryState(serviceSnapshot, delivery) {
  const ledger = serviceSnapshot.ledger.find((item) => item.operation === 'op-17') ?? null;
  return {
    requests: serviceSnapshot.attempts,
    effects: serviceSnapshot.effects,
    ledger: ledger
      ? {
          operation: ledger.operation,
          book: ledger.book,
          result: ledger.hold,
        }
      : null,
    caller: callerState(delivery),
  };
}
export function executeRetryTrace() {
  const target = operationService(),
    key = 'op-17',
    payload = {
      book_id: 'B7',
    };
  const waiting = projectedRetryState(target.snapshot(), {
    attempted: false,
    delivered: false,
    timedOut: false,
    result: null,
  });
  const firstResult = target.apply(key, payload);
  const committed = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: false,
    status: 'pending',
    result: firstResult,
  });
  const lost = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: false,
    status: 'lost',
    result: null,
  });
  const timedOut = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: false,
    status: 'timed-out',
    result: null,
  });
  const unknown = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: false,
    status: 'unknown',
    result: null,
  });
  const retryResult = target.apply(key, payload);
  const retrying = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: false,
    status: 'unknown',
    result: null,
  });
  const replayed = projectedRetryState(target.snapshot(), {
    attempted: true,
    delivered: true,
    status: 'delivered',
    result: retryResult,
  });
  const conflictTarget = operationService();
  const original = conflictTarget.apply(key, payload);
  let conflictRejected = false;
  try {
    conflictTarget.apply(key, {
      book_id: 'B8',
    });
  } catch (error) {
    conflictRejected = error instanceof assert.AssertionError;
  }
  const conflict = projectedRetryState(conflictTarget.snapshot(), {
    attempted: true,
    delivered: true,
    status: 'delivered',
    result: original,
  });
  return {
    waiting,
    committed,
    lost,
    timedOut,
    unknown,
    retrying,
    replayed,
    retryResult,
    conflict,
    conflictRejected,
  };
}
export const RETRY_TRACE = executeRetryTrace();
export const TOOL_RECEIPTS = Object.freeze(
  [
    [true, 2, 430, 2.1],
    [true, 2, 510, 2.4],
    [false, 3, 680, 3.8],
    [true, 2, 470, 2.2],
  ].map(([passed, rounds, latency_ms, cost_cents]) =>
    Object.freeze({
      passed,
      rounds,
      latency_ms,
      cost_cents,
      unauthorized_reads: 0,
      unsafe_writes: 0,
    }),
  ),
);
export const TOOL_GOOD_TRACE = Object.freeze([
  {
    type: 'call',
    id: 'status-1',
    name: 'get_release_status',
    args: {
      release_id: 'reranker-v16',
    },
  },
  {
    type: 'observation',
    call_id: 'status-1',
    ok: true,
    release_id: 'reranker-v16',
    status: 'canary_failed',
  },
  {
    type: 'answer',
    release_id: 'reranker-v16',
    status: 'canary_failed',
    text: 'Release reranker-v16: canary_failed.',
  },
]);
