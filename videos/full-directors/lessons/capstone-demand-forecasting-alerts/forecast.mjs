import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  candidate,
  actual,
  baseline,
  fridayFeatures,
  forecastWeights,
  transferForecasts,
  transferCapacities,
  transferActuals,
} from '../../../films/capstone-demand-forecasting-alerts/fixtures.mjs';

const assetRoot = new URL('./assets/', import.meta.url);
function csv(name) {
  const [header, ...rows] = readFileSync(new URL(name, assetRoot), 'utf8').trim().split(/\r?\n/);
  const fields = header.split(',');
  return rows.map((row) =>
    Object.fromEntries(row.split(',').map((value, i) => [fields[i], value])),
  );
}
export const counts = csv('daily_counts.csv').map((r) => ({
  day: r.target_date,
  at: Date.parse(r.available_at),
  y: Number(r.parcels),
  final: r.final === 'true',
}));
const plans = csv('planned_events.csv');
export const origins = ['2026-02-01T08:00Z', '2026-02-08T08:00Z'].map(Date.parse);
const dayMs = 86400000;
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const dot = (a, b) => sum(a.map((v, i) => v * b[i]));
export const eligible = (rows, cutoff) => rows.filter((r) => r.final && r.at <= cutoff);
function weekday(day) {
  return (new Date(day).getUTCDay() + 6) % 7;
}
export function features(day, cutoff, events = plans) {
  const monday = Date.parse('2025-12-01');
  const known = events.some(
    (p) => p.target_date === day && Date.parse(p.known_at) <= Math.min(Date.parse(day), cutoff),
  );
  return [
    ...Array.from({ length: 7 }, (_, i) => +(weekday(day) === i)),
    (Date.parse(day) - monday) / (7 * dayMs),
    +known,
  ];
}
export function sourceDay(day, cutoff) {
  return eligible(counts, cutoff)
    .filter((r) => weekday(r.day) === weekday(day))
    .at(-1);
}
export const windows = candidate.map((issued, i) => ({
  day: '2026-02-' + String(i + 2).padStart(2, '0'),
  date: i + 2,
  h: (i % 7) + 1,
  origin: origins[Math.floor(i / 7)],
  forecast: issued,
  actual: actual[i],
  baseline: baseline[i],
  cap: i % 7 === 2 ? 140 : 150,
}));
export const practice = transferForecasts.map((forecast, i) => ({
  date: ['Tue', 'Wed', 'Thu'][i],
  forecast,
  actual: transferActuals[i],
  cap: transferCapacities[i],
}));
export const fri = windows[4],
  wed = windows[2];
export const fridayTerms = fridayFeatures.map((v, i) => v * forecastWeights[i]);
export const replay = Math.max(0, dot(features(wed.day, origins[0], []), forecastWeights));
export const residual = (row) => row.actual - row.forecast;
export const warn = (row) => row.forecast > row.cap;
export const overload = (row) => row.actual > row.cap;
export const peakMinimum = 150;
export const peakRate = 3;
export const charge = (y, f) => (y >= peakMinimum ? peakRate * Math.max(y - f, 0) : 0);
export const errorTolerance = 6;
export const inside = (row, tolerance = errorTolerance) => Math.abs(residual(row)) <= tolerance;
export function score(rows) {
  const n = rows.length;
  const abs = sum(rows.map((r) => Math.abs(residual(r))));
  const warned = rows.filter(warn).length,
    overloaded = rows.filter(overload).length;
  const caught = rows.filter((r) => warn(r) && overload(r)).length;
  return {
    n,
    abs,
    mae: n ? abs / n : null,
    inside: rows.filter((r) => inside(r)).length,
    peak: n ? sum(rows.map((r) => charge(r.actual, r.forecast))) : null,
    warned,
    overloaded,
    caught,
    precision: warned ? caught / warned : null,
    recall: overloaded ? caught / overloaded : null,
  };
}
export const full = score(windows);
export const seasonal = score(windows.map((r) => ({ ...r, forecast: r.baseline })));
export const readyBy = (t) =>
  windows.filter((w) => eligible(counts, t).some((c) => c.day === w.day));
export const partial = score(readyBy(origins[1]));
export const scenarios = [
  [100, 0.55],
  [160, 0.25],
  [240, 0.2],
];
export function booking(a) {
  const rows = scenarios.map(([y, p]) => {
    const short = Math.max(y - a, 0),
      spare = Math.max(a - y, 0);
    return { y, p, short, spare, term: p * (3 * short + spare), gap: p * (short + spare) };
  });
  return { rows, cost: sum(rows.map((r) => r.term)), mae: sum(rows.map((r) => r.gap)) };
}
export function receipt(scored, complete, previous) {
  const gates = [
    complete,
    !!previous.trim(),
    scored.mae !== null && scored.mae < seasonal.mae,
    scored.peak !== null && scored.peak < seasonal.peak,
    scored.n > 0 && scored.inside / scored.n >= 0.85,
    scored.precision !== null && scored.precision >= 0.6,
    scored.recall !== null && scored.recall >= 0.6,
  ];
  return { gates, comparison: gates.every(Boolean), decision: 'Hold', liveReady: false };
}
export const specimen = (value) => ({
  center: 'FC-A',
  tier: 'standard',
  issue: '2026-02-01T08:00Z',
  target: fri.day,
  version: 'ols-v1',
  forecast: value,
});
export const fingerprint = (value) =>
  createHash('sha256')
    .update(JSON.stringify(specimen(value)))
    .digest('hex');
export const completeGrid = (rows) =>
  rows.length === 14 &&
  origins.every((o) =>
    Array.from({ length: 7 }, (_, i) => i + 1).every((h) =>
      rows.some((r) => r.origin === o && r.h === h),
    ),
  );
export const swapped = windows.map((r, i) => (i === 3 ? fri : r));

// Refit the same small full-rank design after each audit edit. Modified Gram-Schmidt
// avoids adding a numerical library to the still renderer.
function fit(rows) {
  const data = eligible(rows, origins[0]);
  const X = data.map((r) => features(r.day, origins[0]));
  const y = data.map((r) => r.y);
  const q = [],
    upper = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let j = 0; j < 9; j++) {
    let v = X.map((row) => row[j]);
    for (let i = 0; i < j; i++) {
      upper[i][j] = dot(q[i], v);
      v = v.map((x, k) => x - upper[i][j] * q[i][k]);
    }
    upper[j][j] = Math.sqrt(dot(v, v));
    assert(upper[j][j] > 1e-8);
    q.push(v.map((x) => x / upper[j][j]));
  }
  const w = q.map((col) => dot(col, y));
  for (let i = 8; i >= 0; i--) {
    for (let j = i + 1; j < 9; j++) w[i] -= upper[i][j] * w[j];
    w[i] /= upper[i][i];
  }
  return windows.slice(0, 7).map((r) => Math.max(0, dot(features(r.day, origins[0]), w)));
}
export const fitRuns = [
  fit(counts),
  fit(counts.map((r) => (r.at > origins[0] ? { ...r, y: r.y + 10000 } : r))),
  fit(counts.map((r) => (r.day === '2026-01-30' ? { ...r, y: r.y + 10000 } : r))),
];
export function checkForecasts() {
  const near = (a, b) => assert(Math.abs(a - b) < 1e-7, [a, b].join(' vs '));
  assert.equal(counts.length, 77);
  assert.deepEqual(
    origins.map((o) => eligible(counts, o).length),
    [62, 68],
  );
  assert.equal(sourceDay('2026-02-08', origins[0]).y, 86);
  assert.equal(sourceDay('2026-02-14', origins[1]).day, '2026-01-31');
  assert.deepEqual(
    readyBy(origins[1]).map((r) => r.date),
    [2, 3, 4, 5, 6],
  );
  assert.deepEqual(
    scenarios.map(([a]) => [booking(a).cost, booking(a).mae]),
    [
      [129, 43],
      [81, 49],
      [97, 97],
    ],
  );
  assert.equal(warn({ ...fri, forecast: 150 }), false);
  assert.equal(charge(150, 149), 3);
  assert.equal(charge(145, 138), 0);
  near(sum(fridayTerms), fri.forecast);
  near(wed.forecast - replay, forecastWeights[8]);
  assert.equal(replay.toFixed(3), '124.117');
  assert.equal(inside({ ...fri, forecast: 170, actual: 176 }), true);
  assert.notEqual(fingerprint(fri.forecast), fingerprint(fri.actual));
  near(full.mae, 6.253526690917234);
  assert.equal(full.inside, 11);
  assert.deepEqual(
    windows.filter((r) => !inside(r)).map((r) => r.date),
    [4, 6, 10],
  );
  assert.deepEqual([seasonal.peak, full.peak.toFixed(3)], [201, '142.734']);
  assert.deepEqual([full.caught, full.warned, full.overloaded], [2, 3, 3]);
  assert.equal(partial.mae.toFixed(2), '8.15');
  assert.equal(score([]).mae, null);
  assert.deepEqual([score([]).peak, score([]).precision, score([]).recall], [null, null, null]);
  assert.deepEqual(receipt(full, true, 'seasonal-v0').gates, [
    true,
    true,
    true,
    true,
    false,
    true,
    true,
  ]);
  assert.equal(
    receipt({ ...full, n: 20, inside: 17, mae: seasonal.mae }, true, 's').gates[2],
    false,
  );
  assert.equal(receipt({ ...full, n: 20, inside: 17 }, true, 's').comparison, true);
  assert.deepEqual(fitRuns[0], fitRuns[1]);
  fitRuns[0].forEach((v, i) => near(v, windows[i].forecast));
  assert.equal(Math.round(fitRuns[2][4]), 661);
  assert.deepEqual(
    features('2026-02-03', origins[0], [
      { target_date: '2026-02-03', known_at: '2026-02-02T08:00Z' },
    ]),
    features('2026-02-03', origins[0], []),
  );
  assert(completeGrid(windows) && !completeGrid(swapped));
  const transferWed = practice[1];
  assert.deepEqual([transferWed.forecast, transferWed.cap, transferWed.actual], [138, 140, 145]);
  assert.deepEqual([warn(transferWed), overload(transferWed), inside(transferWed)], [false, true, false]);
  assert.equal(peakMinimum - transferWed.actual, 5);
  assert.equal(charge(transferWed.actual, transferWed.forecast), 0);
  assert.equal(score([practice[0], practice[2]]).mae, 0.5);
  assert.deepEqual(
    [score(practice).mae, score(practice).precision, score(practice).recall],
    [8 / 3, 1, 0.5],
  );
  return true;
}
