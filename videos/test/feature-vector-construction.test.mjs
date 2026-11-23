import test from 'node:test';
import assert from 'node:assert/strict';
import {
  welfordTrace,
  eligibleFeatureEvent,
  featureVector,
  featureSum,
  featureTransfer,
  featureFrame,
  lagRoute,
  allowedTargetMean,
} from '../animations/feature-engineering.mjs';
test('running statistics keep old and updated means distinct and preserve the sample boundary', () => {
  const trace = welfordTrace([3, 7, 11]);
  assert.deepEqual(
    trace.map((s) => s.mean),
    [3, 5, 7],
  );
  assert.deepEqual(
    trace.map((s) => s.m2),
    [0, 8, 32],
  );
  assert.equal(trace[0].sample, null);
  assert.equal(trace[2].population, [3, 7, 11].reduce((v, x) => v + (x - 7) ** 2, 0) / 3);
  assert.throws(() => welfordTrace([2, Infinity]));
});
test('historical selection rejects late revisions,other jobs and future events', () => {
  const rows = [
    { job: 'J-204', event: 510, available: 511, revision: 1 },
    { job: 'J-204', event: 510, available: 545, revision: 2 },
    { job: 'J-peer', event: 530, available: 531, revision: 1 },
    { job: 'J-204', event: 535, available: 550, revision: 1 },
    { job: 'J-204', event: 560, available: 561, revision: 1 },
  ];
  assert.equal(eligibleFeatureEvent(rows, 540).revision, 1);
  assert.equal(eligibleFeatureEvent(rows, 550).event, 535);
  assert.equal(eligibleFeatureEvent(rows, 500), null);
  assert.equal(eligibleFeatureEvent(rows, 540).available, 511);
});
test('the ordered vector owns its zero coordinates and its weights reveal a swapped-field error', () => {
  const row = { pool: 'a100-pool', queued: 42, heartbeat: 0.5, backlog: 18, priority: false },
    v = featureVector(row);
  assert.deepEqual(v, [1, 0, 0, 42, 0.5, 18, 0, 0]);
  const sum = featureSum(v);
  assert.equal(sum.terms.length, 8);
  assert.equal(sum.terms.filter((t) => t.zero).length, 5);
  assert.equal(
    sum.total[0],
    v.reduce((n, x, i) => n + x * [0, 0, 0, 0.01, 0.02, 0.01, 0, 0][i], 0),
  );
  const swapped = [...v];
  [swapped[3], swapped[4]] = [swapped[4], swapped[3]];
  assert(Math.abs(featureSum(swapped).total[0] - 1.025) < 1e-12);
  assert.equal(featureSum(v).total[0], 0.61);
  assert.throws(() => featureVector({ ...row, queued: true }));
  assert.deepEqual(featureVector({ ...row, backlog: null }).slice(5, 7), [0, 1]);
  assert.deepEqual(featureVector({ ...row, backlog: 0 }).slice(5, 7), [0, 0]);
});
test('delayed labels and lag policy use inclusive boundaries without coercing Boolean values', () => {
  const rows = [
    { scored: 360, available: 480, label: 0 },
    { scored: 420, available: 600, label: 1 },
  ];
  assert.equal(allowedTargetMean(rows, 420), null);
  assert.equal(allowedTargetMean(rows, 540), 0);
  assert.equal(allowedTargetMean(rows, 600), 0.5);
  assert.deepEqual([15, 15.1, 45, 45.1, false, -1, NaN].map(lagRoute), [
    'normal',
    'fallback',
    'fallback',
    'abstain',
    'abstain',
    'abstain',
    'abstain',
  ]);
});
test('a fresh late ping cannot rewrite the original cutoff and repair changes only the eligible backlog', () => {
  const good = featureTransfer(7),
    bad = featureTransfer(0);
  assert.equal(good.event.event, 550);
  assert.equal(good.vector[4], 5 / 6);
  assert.deepEqual(
    good.vector.filter((_, i) => i !== 5),
    bad.vector.filter((_, i) => i !== 5),
  );
  assert(Math.abs(good.score - bad.score - 0.07) < 1e-12);
  assert(bad.score < 0.25 && good.score > 0.25);
  assert.equal(featureTransfer(7).event.available, 551);
});
test('fresh answers remain behind their own speech cues', () => {
  const f = featureFrame({
    beat: 1,
    beatP: 0.9,
    cues: {
      'feature-fresh-heartbeat': { phase: 'after', progress: 1 },
      'feature-fresh-vector': { phase: 'before', progress: 0 },
      'feature-fresh-history': { phase: 'before', progress: 0 },
    },
  });
  assert.equal(f.started('feature-fresh-heartbeat', 1), true);
  assert.equal(f.started('feature-fresh-vector', 1), false);
  assert.equal(f.started('feature-fresh-history', 1), false);
});
