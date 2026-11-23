import { MONITOR_POLICY, RATE, fields, inventory } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const motion = (p) => {
  const q = clamp((p - 0.1) / 0.58);
  return q * q * (3 - 2 * q);
};
export const sum = (xs) => xs.reduce((a, x) => a + x, 0);
export function joinReviews(events, receipts) {
  const rows = new Map(
    events.map((e) => [
      e.id,
      {
        ...e,
        unsafe: null,
      },
    ]),
  );
  assert.equal(rows.size, events.length, 'duplicate request');
  for (const receipt of receipts) {
    assert(rows.has(receipt.id), 'unrecognized request');
    assert.equal(typeof receipt.unsafe, 'boolean');
    rows.get(receipt.id).unsafe = receipt.unsafe;
  }
  return [...rows.values()];
}
export function summarize(events, ingress = 6) {
  assert(ingress >= events.length);
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
  const reviewed = events.filter((e) => e.unsafe !== null),
    unsafe = reviewed.filter((e) => e.unsafe).length,
    served = reviewed.filter((e) => e.served).length;
  return {
    observed: events.length,
    reviewed: reviewed.length,
    unsafe,
    served,
    abstained: events.filter((e) => e.route === 'abstain').length,
    unknown: ingress - reviewed.length,
    rate: reviewed.length ? unsafe / reviewed.length : null,
    conditional: served ? unsafe / served : null,
  };
}
export function unsafeServeBounds(events, ingress = events.length) {
  assert(Number.isInteger(ingress) && ingress >= events.length, 'invalid ingress count');
  assert.equal(new Set(events.map((e) => e.id)).size, events.length, 'duplicate request');
  for (const event of events) {
    assert(
      [true, false, null].includes(event.served),
      'delivery must be known or explicitly unknown',
    );
    assert(
      [true, false, null].includes(event.unsafe),
      'review must be known or explicitly unknown',
    );
    assert(
      event.unsafe !== true || event.served === true,
      'unsafe serve requires an actual served payload',
    );
  }
  const lowerCount = events.filter((e) => e.unsafe === true).length;
  const unreviewedPossibleServes = events.filter(
    (e) => e.unsafe === null && e.served !== false,
  ).length;
  const missingEvents = ingress - events.length;
  const upperCount = lowerCount + unreviewedPossibleServes + missingEvents;
  return {
    lowerCount,
    upperCount,
    unreviewedPossibleServes,
    missingEvents,
    knownWithheld: events.filter((e) => e.served === false).length,
    lower: ingress ? lowerCount / ingress : null,
    upper: ingress ? upperCount / ingress : null,
  };
}
export function estimate(event) {
  assert(
    [event.input, event.cached, event.output].every((n) => Number.isInteger(n) && n >= 0),
    'token counts must be nonnegative integers',
  );
  assert(
    Number.isInteger(event.input) &&
      Number.isInteger(event.cached) &&
      event.cached >= 0 &&
      event.cached <= event.input,
    'cached input exceeds total',
  );
  return (
    ((event.input - event.cached) * RATE.uncached +
      event.cached * RATE.cached +
      event.output * RATE.output) /
    1e6
  );
}
export function exportRecord(record) {
  for (const [key, allowed] of Object.entries(inventory))
    assert(allowed.has(record[key]), 'unapproved ' + key + ' identifier');
  return Object.fromEntries(fields.map((key) => [key, record[key]]));
}
export function alert(events, policy = MONITOR_POLICY) {
  const q = summarize(events),
    findings = [];
  if (q.unsafe) findings.push('PAGE: unsupported served claims');
  if (!events.length) findings.push('UNKNOWN: no observations');
  else if (events.some((e) => !Number.isInteger(e.ttft) || e.ttft < 0))
    findings.push('UNKNOWN: latency measurement');
  else {
    const ordered = events.map((e) => e.ttft).sort((a, b) => a - b),
      p95 = ordered[Math.ceil(0.95 * ordered.length) - 1];
    if (p95 > policy.maxP95) findings.push('WARN: first-token delay above policy');
  }
  try {
    const cost = sum(events.map(estimate));
    assert(Number.isFinite(cost) && cost >= 0);
    if (cost > policy.maxWindowCost) findings.push('WARN: estimated cost above policy');
  } catch {
    findings.push('UNKNOWN: usage measurement');
  }
  if (q.unknown) findings.push('UNKNOWN: review coverage');
  return findings;
}
export function repeatCount(observations) {
  let n = 0;
  for (let i = observations.length - 1; i >= 0; i--) {
    if (JSON.stringify(observations[i]) !== JSON.stringify(observations.at(-1))) break;
    n++;
  }
  return n;
}
export function guardedDispatch(
  observations,
  elapsed,
  deadline,
  call,
  budget = {
    spent: 0,
    next: 0,
    limit: Infinity,
  },
) {
  assert(Number.isFinite(elapsed) && Number.isFinite(deadline) && elapsed >= 0 && deadline > 0);
  if (repeatCount(observations) >= 3)
    return {
      executed: false,
      reason: 'repeat budget',
    };
  if (elapsed >= deadline)
    return {
      executed: false,
      reason: 'deadline',
    };
  assert(
    Number.isFinite(budget.spent) &&
      budget.spent >= 0 &&
      Number.isFinite(budget.next) &&
      budget.next >= 0 &&
      budget.limit >= 0,
  );
  if (budget.spent + budget.next > budget.limit)
    return {
      executed: false,
      reason: 'spending budget',
    };
  return {
    executed: true,
    reason: 'within budgets',
    result: call(),
  };
}
