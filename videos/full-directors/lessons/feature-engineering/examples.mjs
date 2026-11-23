import assert from 'node:assert/strict';
import {
  featureNames,
  featureWeights,
  freshFeatureEvents,
  targetRows,
  waitTimes,
} from '../../../films/feature-engineering/fixtures.mjs';
import {
  eligibleFeatureEvent,
  featureVector,
  welfordTrace,
  lagRoute,
} from '../../../films/feature-engineering/model.mjs';
import { mean, std, median, iqr } from '../../../films/feature-engineering/construction.mjs';
import { quantile } from '../../../films/feature-engineering/arithmetic.mjs';
export {
  featureNames,
  featureWeights,
  freshFeatureEvents,
  waitTimes,
  featureVector,
  lagRoute,
  mean,
  std,
  median,
  iqr,
  quantile,
};
export const trace = welfordTrace([2, 4, 6]);
export const historical = [18, 3, 9, 22].map((count, i) => ({
  count,
  flag: Number(count > 10),
  miss: [1, 0, 1, 0][i],
}));
export const pings = [
  [60, 61],
  [510, 511],
  [530, 555],
  [720, 721],
].map(([event, available]) => ({ job: 'J-204', event, available, revision: 1 }));
export const revisions = [
  pings[1],
  { ...pings[1], available: 545, revision: 2 },
  pings[2],
  { job: 'J-peer', event: 525, available: 526, revision: 1 },
  { job: 'J-204', event: 560, available: 561, revision: 1 },
];
export function pingAt(rows, cutoff, job) {
  const ping = eligibleFeatureEvent(rows, cutoff, job);
  return { ping, age: ping ? (cutoff - ping.event) / 60 : null };
}
export const standard = (x) => (x - mean) / std;
export const robust = (x) => (x - median) / iqr;
export function readBay(n, present) {
  const raw = present ? n : null;
  return { n, raw, slots: [raw ?? 0, Number(raw === null)] };
}
export const row = { pool: 'a100-pool', queued: 42, heartbeat: 0.5, backlog: 18, priority: false };
export const names = [
  'A100',
  'H100',
  'other',
  'queue min',
  'age h',
  'backlog',
  'missing',
  'priority',
];
export const pools = ['A100', 'H100', 'L4'];
export const onehot = (name, reserve = true) =>
  ['A100', 'H100', 'other'].map(
    (v) => +(v === (!pools.slice(0, 2).includes(name) && reserve ? 'other' : name)),
  );
export function fitPool(flip, held = false) {
  const all = targetRows.map((r, i) => ({
    ...r,
    id: i + 1,
    missed: flip && i === 7 ? 0 : r.missed,
  }));
  const fit = all.filter((r) => !held || r.id % 2 === 1);
  const cat = fit.filter((r) => r.pool === 'l4-pool');
  const misses = fit.reduce((a, r) => a + r.missed, 0),
    hits = cat.reduce((a, r) => a + r.missed, 0);
  return {
    all,
    fit,
    misses,
    hits,
    n: cat.length,
    prior: misses / fit.length,
    estimate: (hits + (5 * misses) / fit.length) / (cat.length + 5),
  };
}
export const outcomes = [
  { score: 360, ready: 480, miss: 0 },
  { score: 420, ready: 600, miss: 1 },
];
export function mature(time) {
  const allowed = outcomes.filter((j) => j.score < time && j.ready <= time);
  const misses = allowed.reduce((a, j) => a + j.miss, 0);
  return { n: allowed.length, misses, rate: allowed.length ? misses / allowed.length : null };
}
export function plugState(input = row, swap = false) {
  const vector = featureVector(input),
    order = vector.map((_, i) => i);
  if (swap) [order[3], order[4]] = [4, 3];
  const slots = order.map((source, i) => ({
    source,
    name: names[source],
    value: vector[source],
    weight: featureWeights[i],
    product: vector[source] * featureWeights[i],
  }));
  return { slots, total: slots.reduce((sum, s) => sum + s.product, 0) };
}
export function logistic(raw, backlog, cap = 180) {
  const age = Math.min(raw, cap),
    logit = 0.02 * age + 0.01 * backlog - 4;
  return { age, backlog, cap, logit, score: 1 / (1 + Math.exp(-logit)) };
}
export const snapshot = { pool: 'a100-pool', backlog: 18, priority: 0 };
export const captures = [
  { ...snapshot },
  { ...snapshot, backlog: 0 },
  { pool: snapshot.pool, backlog: 18 },
];
export function differences(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => !Object.hasOwn(a, k) || !Object.hasOwn(b, k) || a[k] !== b[k],
  );
}
export function transfer(backlog = 0) {
  const { age } = pingAt(freshFeatureEvents, 600, 'J-new');
  const result = plugState({
    pool: 'L4-pool',
    queued: 20,
    heartbeat: age,
    backlog,
    priority: false,
  });
  return { ...result, alert: result.total >= 0.25 };
}
export function checkExamples() {
  const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-8);
  assert.deepEqual(
    historical.map((r) => r.flag),
    [1, 0, 0, 1],
  );
  assert.equal(historical.filter((r) => r.flag === r.miss).length, 2);
  assert.equal(pingAt(pings, 540, 'J-204').age, 0.5);
  assert.equal(pingAt(revisions, 540, 'J-204').ping.revision, 1);
  assert.equal(pingAt(revisions, 545, 'J-204').ping.revision, 2);
  assert.equal(pingAt(revisions, 500, 'J-204').age, null);
  near(iqr, 28.75);
  near(robust(42), 15 / 28.75);
  assert.equal(standard(42).toFixed(3), '-0.374');
  assert.equal(robust(12000).toFixed(3), '416.452');
  assert.deepEqual(
    trace.map((t) => [t.mean, t.m2, t.sample]),
    [
      [2, 0, null],
      [3, 2, 2],
      [4, 8, 4],
    ],
  );
  assert.deepEqual(readBay(3, false), { n: 3, raw: null, slots: [0, 1] });
  assert.deepEqual(readBay(0, true).slots, [0, 0]);
  assert.deepEqual(onehot('L4'), [0, 0, 1]);
  assert.deepEqual(onehot('L4', false), [0, 0, 0]);
  for (const flip of [false, true]) {
    const full = fitPool(flip),
      fold = fitPool(flip, true);
    near(full.estimate, flip ? 5 / 12 : 11 / 16);
    near(fold.estimate, 0.75);
    assert.equal(full.hits, +!flip);
    assert.equal(full.misses, flip ? 4 : 5);
    assert.deepEqual(
      fold.fit.map((r) => r.id),
      [1, 3, 5, 7],
    );
    assert.equal(fold.n, 0);
  }
  assert.deepEqual(
    [420, 540, 600].map((t) => mature(t).rate),
    [null, 0, 0.5],
  );
  assert.deepEqual(
    plugState().slots.map((s) => s.value),
    [1, 0, 0, 42, 0.5, 18, 0, 0],
  );
  for (const swap of [false, true]) {
    const s = plugState(row, swap);
    assert.deepEqual(
      s.slots.map((v) => v.weight),
      featureWeights,
    );
    assert.deepEqual(
      s.slots.map((v) => v.product),
      swap ? [0, 0, 0, 0.005, 0.84, 0.18, 0, 0] : [0, 0, 0, 0.42, 0.01, 0.18, 0, 0],
    );
    near(s.total, swap ? 1.025 : 0.61);
  }
  assert.equal(logistic(200, 18).score.toFixed(3), '0.445');
  assert.equal(logistic(200, 18, 360).score.toFixed(3), '0.545');
  assert.deepEqual(
    captures.map((c) => differences(snapshot, c)),
    [[], ['backlog'], ['priority']],
  );
  assert.deepEqual(differences({ p: null }, {}), ['p']);
  assert.equal(logistic(0.5, 0).logit, -3.99);
  near(logistic(0.5, 18).logit, -3.81);
  assert.deepEqual([15, 45, 45.1, false, NaN, -1].map(lagRoute), [
    'normal',
    'fallback',
    'abstain',
    'abstain',
    'abstain',
    'abstain',
  ]);
  const start = transfer(),
    repaired = transfer(7);
  assert.deepEqual(
    repaired.slots.filter((s, i) => s.value !== start.slots[i].value).map((s) => s.source),
    [5],
  );
  near(start.total, 13 / 60);
  near(repaired.total - start.total, 0.07);
  assert.equal(start.alert, false);
  assert.equal(repaired.alert, true);
  assert.equal(pingAt(freshFeatureEvents, 605, 'J-new').age, 0.25);
  assert.deepEqual(
    featureVector({
      ...row,
      pool: 'h100-pool',
      queued: 10,
      heartbeat: 2,
      backlog: 8,
      priority: true,
    }),
    [0, 1, 0, 10, 2, 8, 0, 1],
  );
  assert.throws(() => featureVector({ ...row, queued: true }));
  assert.throws(() => featureVector({ ...row, priority: 0 }));
  return true;
}
