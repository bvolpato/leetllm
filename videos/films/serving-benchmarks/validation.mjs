import {
  SERVING_COHORT,
  comparisonTokenTimes,
  gaps,
  rates,
  tokenTerminalMs,
  tokenTimes,
} from './fixtures.mjs';
import { averageInFlight, freshServingState, servingClock } from './construction.mjs';
import {
  arrivalComparison,
  fixedPlayback,
  freshServingRows,
  inFlightAt,
  nearestRank,
  servingGate,
  servingReceipt,
  servingRequestMetrics,
  wilsonLower,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateServingConstruction();
  const slow = arrivalComparison(1),
    fast = arrivalComparison(0);
  assert(slow.closed.slice(1).every((r, i) => r.start === slow.closed[i].end));
  assert.deepEqual(
    slow.open.map((r) => r.start),
    fast.open.map((r) => r.start),
  );
  assert.equal(fast.closed.filter((r) => r.start < fast.horizon).length, 6);
  assert.equal(slow.closed.filter((r) => r.start < slow.horizon).length, 3);
  assert.equal(averageInFlight, 2.7);
  assert.equal(inFlightAt(0), 3);
  assert.deepEqual(gaps, [40, 40, 120, 40]);
  assert.equal(gaps.reduce((a, b) => a + b, 0) / gaps.length, 60);
  assert.equal(tokenTerminalMs, 500);
  assert.equal(servingGate(rates).rps, 1.5);
  return true;
}
export function validateServingConstruction() {
  assert.deepEqual(
    SERVING_COHORT.map((r) => r.scheduled),
    [0, 120, 700, 760, 800, 1900],
  );
  assert.deepEqual(
    SERVING_COHORT.map((r) => r.terminal),
    [500, 310, 1220, 1310, 1180, 2500],
  );
  const receipt = servingReceipt();
  assert.deepEqual(
    [receipt.offered, receipt.success, receipt.qualified, receipt.horizon],
    [6, 5, 3, 2500],
  );
  assert.equal(receipt.qualifiedRps, 1.2);
  assert.equal(receipt.offeredRps, 3);
  assert.equal(receipt.attainment, 0.5);
  assert.equal(servingRequestMetrics(SERVING_COHORT[1]).tpot, null);
  assert.equal(servingRequestMetrics(SERVING_COHORT[2]).ttft, 340);
  assert.deepEqual(servingClock(0), {
    scheduled: 760,
    sent: 765,
    first: 1050,
    lag: 5,
    ttft: 285,
    valid: true,
  });
  assert.equal(servingClock(1).ttft, 250);
  assert.equal(servingClock(1).lag, 40);
  const a = fixedPlayback(tokenTimes),
    b = fixedPlayback(comparisonTokenTimes);
  assert.deepEqual(a.deadlines, [300, 380, 460, 540, 620]);
  assert.deepEqual(b.deadlines, a.deadlines);
  assert.equal(a.arrivals[3] - a.arrivals[2], 120);
  assert.equal(a.deadlines[3] - a.arrivals[3], 100);
  assert.equal(a.lateCount, 0);
  assert.equal(b.meanTpot, 80);
  assert.deepEqual(b.late, [0, 0, 0, 40, 0]);
  assert.equal(nearestRank([...Array(19).fill(1), 100], 0.95), 1);
  assert.equal(nearestRank([1, 100], 0.95), 100);
  assert(Math.abs(wilsonLower(190, 200) - 0.9181081670817905) < 1e-8);
  assert.equal(servingGate(rates).rps, 1.5);
  const fresh = servingReceipt(freshServingRows(), [0, 2500]);
  assert.deepEqual([fresh.offered, fresh.success, fresh.qualified, fresh.horizon], [8, 7, 6, 4000]);
  assert.equal(fresh.qualifiedRps, 1.5);
  assert.equal(fresh.offeredRps, 3.2);
  assert.equal(freshServingState(0, 0.99).showAttainment, false);
  return true;
}
