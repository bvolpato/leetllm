import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export const hash = (value) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
export const money = (cents) => `$${(cents / 100).toFixed(2)}`;
export function tuple(state) {
  return {
    customer: state.customer,
    invoice: state.invoice,
    item: state.item,
    amount: state.amount,
    policy: state.policy,
    revision: state.revision,
  };
}
export function supportCost(input, cached, output) {
  assert(
    Number.isInteger(input) &&
      input >= 0 &&
      Number.isInteger(cached) &&
      cached >= 0 &&
      cached <= input &&
      Number.isInteger(output) &&
      output >= 0,
  );
  return {
    fresh: input - cached,
    freshCost: ((input - cached) * 2.5) / 1e6,
    cacheCost: (cached * 0.25) / 1e6,
    outputCost: (output * 15) / 1e6,
    total: ((input - cached) * 2.5 + cached * 0.25 + output * 15) / 1e6,
    reserve: (input * 2.5 + 300 * 15) / 1e6,
  };
}
