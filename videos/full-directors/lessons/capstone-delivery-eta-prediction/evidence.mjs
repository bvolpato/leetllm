import assert from 'node:assert/strict';
import { decisions } from '../../../films/capstone-delivery-eta-prediction/model.mjs';
import {
  fittedEtaFixture,
  scans,
} from '../../../films/capstone-delivery-eta-prediction/fixtures.mjs';
import {
  freshOrder,
  noonOrder,
  estimate,
  scanAt,
  propose,
  limits,
} from '../../../films/capstone-delivery-eta-prediction/shipment.mjs';
import { clock, sum } from '../../../films/capstone-delivery-eta-prediction/arithmetic.mjs';

export { decisions, freshOrder, noonOrder, estimate, scanAt, propose, limits, scans, clock, sum };
export const fitted = fittedEtaFixture();
export const deliveredHours = 11.513977618576238;
export const names = ['Scan age', 'Backlog age', 'Expedited', 'Elapsed', 'To promise'];
export const atDoor = (delivered, promised) => Math.round((delivered - promised) * 60);
export function atNoon(reported = 12.5) {
  return scans.map((row, i) => (i === 1 ? { ...row, available: reported } : row));
}
export const trips = [
  { id: 'H-1', hours: 8, day: 27 },
  { id: 'H-2', hours: 10, day: 28 },
  { id: 'H-3', hours: 12, day: 29 },
  { id: 'H-4', hours: 14, day: 30 },
  { id: 'H-late', hours: 4, day: 1 },
].map((row) => ({
  ...row,
  route: 'East 7',
  tier: 'expedited',
  delivered: row.day === 1 ? 13 : (row.day - 31) * 24 + 8 + row.hours,
  recorded: row.day === 1 ? 13 + 5 / 60 : (row.day - 31) * 24 + 8 + row.hours + 5 / 60,
}));
export function matches(rows, at = 12) {
  return rows.filter(
    (r) =>
      r.route === 'East 7' &&
      r.tier === 'expedited' &&
      r.hours > at - noonOrder.pickup &&
      r.delivered <= at &&
      r.recorded <= at,
  );
}
export const residuals = [3, 1, 4, 2],
  nineErrors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export function interval(errors, center = 11, target = 0.9) {
  const sorted = [...errors].sort((a, b) => a - b),
    rank = Math.ceil((sorted.length + 1) * target);
  const radius = sorted[rank - 1] ?? Infinity;
  return { sorted, rank, radius, lo: center - radius, hi: center + radius };
}
export const withinRange = (n) => (n - 1) / (n + 1);
export const pinball = (error, q) => Math.max(q * error, (q - 1) * error);
export const heldOutDurations = [4, 6, 7, 8, 9, 10, 11, 12, 13, 16];
export const bounds = [6, 14];
export const inside = (h) => bounds[0] <= h && h <= bounds[1];
export function expected(p, miss, falseWarning = 8) {
  return {
    warn: (1 - p) * falseWarning,
    silent: p * miss,
    cutoff: falseWarning / (falseWarning + miss),
  };
}
export const charges = (threshold, ageRule = false) =>
  sum(decisions(threshold, ageRule).map((r) => r.penalty));
export const validation = [
  [0.2, 32],
  [0.4, 16],
  [0.6, 368],
  [0.8, 548],
];
export const frozen = [...validation].sort((a, b) => a[1] - b[1] || b[0] - a[0])[0][0];
export const fitMinute = 12 * 60,
  labelMinute = fitMinute + 8 + 25.801495 / 60;
export const canFit = (prediction, label, fit) => prediction < fit && label < fit;
export const slices = [
  { tier: 'Expedited', n: 11, late: 7, missed: 1, falseWarnings: 0, miss: 150 },
  { tier: 'Standard', n: 13, late: 6, missed: 0, falseWarnings: 1, miss: 60 },
];
export function testCosts(falseWarning) {
  return {
    fitted: sum(slices.map((s) => s.missed * s.miss + s.falseWarnings * falseWarning)),
    all: sum(slices.map((s) => (s.n - s.late) * falseWarning)),
    silent: sum(slices.map((s) => s.late * s.miss)),
  };
}
export const scores = [0.2, 0.3, 0.3, 0.4],
  labels = [1, 0, 1, 0];
export const mean = (a) => sum(a) / a.length;
export function trace(hasPolicy) {
  return {
    feature_contract_id: 'eta-features-v1',
    expected_feature_contract_id: 'eta-features-v1',
    model_id: 'frozen-score-fixture-v1',
    expected_model_id: 'frozen-score-fixture-v1',
    ...(hasPolicy ? { threshold_policy_id: 'eta-threshold-v1' } : {}),
  };
}
export const versioned = (t) =>
  Object.keys(trace(true)).every((key) => typeof t[key] === 'string' && t[key].length > 0);
export function checkEvidence() {
  assert.equal(atDoor(noonOrder.doorstep, noonOrder.promise), 30);
  assert.deepEqual(
    [atNoon(), atNoon(11.75)].map((rows) => scanAt(rows, 12).age),
    [1, 0.5],
  );
  assert.equal(scanAt([{ event: 12, available: 12 }], 12).age, 0);
  assert.deepEqual(
    matches(trips).map((t) => t.hours),
    [8, 10, 12, 14],
  );
  assert.deepEqual(
    estimate(
      10,
      matches(trips).map((t) => t.hours),
    ),
    { median: 11, arrival: '21:00', first: '18:00', last: '00:00' },
  );
  assert.equal(estimate(10, matches([])), null);
  assert.equal(withinRange(4), 0.6);
  assert.equal(heldOutDurations.filter(inside).length / heldOutDurations.length, 0.8);
  assert.equal(pinball(2, 0.9), 1.8);
  assert.ok(Math.abs(pinball(-2, 0.9) - 0.2) < 1e-12);
  assert.deepEqual(interval(residuals), {
    sorted: [1, 2, 3, 4],
    rank: 5,
    radius: Infinity,
    lo: -Infinity,
    hi: Infinity,
  });
  assert.deepEqual(
    interval(nineErrors, 11),
    { sorted: nineErrors, rank: 9, radius: 9, lo: 2, hi: 20 },
  );
  assert.deepEqual(
    [
      propose(4, 12, 0.75, 0.4).reason,
      propose(4, 7, 0.75, 0.4).reason,
      propose(31, 2, 0.81, 0.4).reason,
      propose(4, 2, 1.4, 0.4).reason,
    ],
    ['stale_backlog_features', 'late_risk_threshold', 'stale_scan_features', 'invalid_late_risk'],
  );
  assert.deepEqual(
    [charges(0.4, true), ...[0.4, 0.59, 0.65, 0.8].map((t) => charges(t))],
    [150, 8, 0, 60, 210],
  );
  assert.deepEqual(
    decisions(0.65).map((r) => r.penalty),
    [0, 60, 0, 0],
  );
  assert.deepEqual(
    decisions(0.8).map((r) => r.penalty),
    [150, 60, 0, 0],
  );
  assert.equal(expected(0.2, 60).warn, 6.4);
  assert.equal(expected(0.2, 60).silent, 12);
  assert.ok(0.05 < expected(0.05, 150).cutoff && 0.051 > expected(0.051, 150).cutoff);
  assert.equal(canFit(fitMinute - 1440, labelMinute, fitMinute), false);
  assert.equal(frozen, 0.4);
  assert.equal(clock(12 + fitted.eta), '20:22');
  assert.equal(clock(12 + deliveredHours), '23:31');
  assert.equal(atDoor(deliveredHours, fitted.input[4]), 37);
  assert.ok(fitted.probability < frozen);
  assert.deepEqual(
    [testCosts(8), testCosts(20)],
    [
      { fitted: 158, all: 88, silent: 1410 },
      { fitted: 170, all: 220, silent: 1410 },
    ],
  );
  assert.equal(versioned(trace(true)), true);
  assert.equal(versioned(trace(false)), false);
  assert.ok(Math.abs(mean(scores) - 0.3) < 1e-10);
  assert.equal(mean(labels), 0.5);
  assert.equal(scanAt(freshOrder.scans, 13).age, 1.5);
  assert.equal(scanAt(freshOrder.scans, 13.25).name, 'Hub');
  assert.deepEqual(estimate(freshOrder.pickup, freshOrder.durations), {
    median: 11,
    arrival: '20:00',
    first: '15:00',
    last: '01:00',
  });
  assert.deepEqual(
    [0.4, 0.6].map((t) => propose(1.5, 3, 0.52, t).action),
    ['Propose warning', 'Normal tracking'],
  );
}
