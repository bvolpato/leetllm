import { hash, tuple } from './arithmetic.mjs';
import { original } from './fixtures.mjs';
import { decide, enqueue, payload } from './model.mjs';
export function freshSupportCase(age = 31, consent = false) {
  const value = {
    ...original,
    customer: 'Maya',
    owner: 'Maya',
    invoice: 'M240',
    ticket: 'M9',
    total: 24000,
    amount: 24000,
    age,
  };
  if (consent) value.confirmed = hash(tuple(value));
  const decision = decide(value),
    store = [];
  if (decision.outcome === 'QUEUE ELIGIBLE') enqueue(store, 'credit:M9', payload(value));
  return {
    value,
    decision,
    store,
    pending: store.length,
    applied: 0,
  };
}
export function supportFreshFrame(state) {
  const b = state.beat ?? 0,
    done = (id) => state.cues?.[id]?.phase === 'after';
  const baseline = freshSupportCase(31, true).value,
    ageOnly = b > 1 || (b === 1 && done('maya-replay')),
    rewound = b > 1 || (b === 1 && done('maya-rewind')),
    matched = b > 1 || (b === 1 && done('maya-match')),
    acknowledged = b > 1 || (b === 1 && done('maya-pending'));
  const value = {
    ...baseline,
    age: ageOnly ? 30 : 31,
  };
  if (rewound && !matched) value.confirmed = false;
  const decision = decide(value),
    store = [];
  if (acknowledged && decision.outcome === 'QUEUE ELIGIBLE')
    enqueue(store, 'credit:M9', payload(value));
  return {
    value,
    decision,
    store,
    ageOnly,
    rewound,
    matched,
    acknowledged,
    ageResult: b > 1 || (b === 1 && done('maya-eligible')),
    pending: store.length,
    applied: 0,
  };
}
