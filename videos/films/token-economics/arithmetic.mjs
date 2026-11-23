import { priceMicroDollars } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function acceptedTaskCost(receipts) {
  const accepted = new Set(receipts.filter((r) => r.accepted).map((r) => r.task)),
    spend = receipts.reduce((sum, r) => sum + r.costMicro, 0);
  return {
    receipts,
    attempts: receipts.length,
    accepted: accepted.size,
    spend,
    costPerAccepted: accepted.size ? spend / accepted.size : null,
  };
}
export const rateContentDigest = (output) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        id: 'standard-sep21',
        input: '2.50',
        cached: '0.25',
        output: Number(output).toFixed(2),
      }),
    )
    .digest('hex');
export function contextTierPrice(input, output = 0, cached = 0) {
  assert(
    Number.isInteger(input) &&
      input >= 0 &&
      Number.isInteger(output) &&
      output >= 0 &&
      cached >= 0 &&
      cached <= input,
  );
  const long = input > 272000,
    inputRate = long ? 5 : 2.5,
    readRate = long ? 0.5 : 0.25,
    outputRate = long ? 22.5 : 15;
  return {
    long,
    inputRate,
    readRate,
    outputRate,
    cost: ((input - cached) * inputRate + cached * readRate + output * outputRate) / 1e6,
  };
}
export function reservationTransition(balance, reserve, outcome = 'pending', actual = 0) {
  assert(Number.isInteger(balance) && balance >= 0 && Number.isInteger(reserve) && reserve >= 0);
  if (reserve > balance)
    return {
      admitted: false,
      free: balance,
      held: 0,
      spent: 0,
    };
  if (outcome === 'settled') {
    assert(actual >= 0 && actual <= reserve);
    return {
      admitted: true,
      free: balance - actual,
      held: 0,
      spent: actual,
    };
  }
  return {
    admitted: true,
    free: balance - reserve,
    held: reserve,
    spent: 0,
  };
}
export function historyUsage(cached = false) {
  const inputs = [2000, 3000, 4000, 5000, 6000],
    reads = cached ? [0, 2000, 3000, 4000, 5000] : [0, 0, 0, 0, 0];
  return {
    inputs,
    reads,
    ordinary: inputs.reduce((s, n, i) => s + n - reads[i], 0),
    cached: reads.reduce((s, n) => s + n, 0),
    output: 1000,
    cost: inputs.reduce((s, n, i) => s + priceMicroDollars(n, reads[i], 200), 0) / 1e6,
  };
}
