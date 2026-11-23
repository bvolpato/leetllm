import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requestContract,
  fixedCapacityReplay,
  cohortAsOf,
  confusion,
  simulateRelease,
  jobBucket,
  assignmentBuckets,
} from '../animations/model-monitoring.mjs';

test('capacity replay exposes the fixed serving denominator even when one case happens to match', () => {
  assert.deepEqual([50, 100, 200].map(fixedCapacityReplay), [
    { numerator: 20, trainingCapacity: 50, servingCapacity: 100, training: 0.4, serving: 0.2 },
    { numerator: 20, trainingCapacity: 100, servingCapacity: 100, training: 0.2, serving: 0.2 },
    { numerator: 20, trainingCapacity: 200, servingCapacity: 100, training: 0.1, serving: 0.2 },
  ]);
  assert.throws(() => fixedCapacityReplay(0), RangeError);
});
test('request validation separates finite typed source values from snapshot freshness', () => {
  const base = { backlog: 20, heartbeatHours: 30, age: 60 };
  assert.equal(requestContract(base), 'pass');
  assert.equal(requestContract({ ...base, age: 60.01 }), 'freshness');
  assert.equal(requestContract({ ...base, age: -1 }), 'freshness');
  for (const value of [null, true, NaN, Infinity, -1, 1.5])
    assert.equal(requestContract({ ...base, backlog: value }), 'schema');
  assert.equal(requestContract({ ...base, heartbeatHours: false }), 'schema');
});
test('as-of join keeps missing mature labels distinct from immature outcomes', () => {
  const rows = [
    { dueHours: -1, arrivalHours: 1, label: true },
    { dueHours: -1, arrivalHours: 0, label: false },
    { dueHours: 1, arrivalHours: 0, label: true },
  ];
  assert.deepEqual(cohortAsOf(rows, 0), {
    mature: 2,
    joined: 1,
    missing: 1,
    immature: 1,
    coverage: 0.5,
  });
  assert.deepEqual(cohortAsOf(rows, 1), {
    mature: 3,
    joined: 3,
    missing: 0,
    immature: 0,
    coverage: 1,
  });
  assert.equal(cohortAsOf([], 0).coverage, null);
});
test('quality uses the historical threshold and undefined empty denominators', () => {
  const rows = [
    { score: 0.2, label: false },
    { score: 0.7, label: true },
    { score: 0.8, label: false },
  ];
  assert.deepEqual(confusion(rows, 0.5), {
    tp: 1,
    fp: 1,
    fn: 0,
    tn: 1,
    n: 3,
    precision: 0.5,
    recall: 1,
    cost: 2,
    costPer1000: 2000 / 3,
  });
  assert.equal(confusion(rows, 0.9).precision, null);
  assert.equal(confusion([], 0.5).recall, null);
  assert.throws(() => confusion([{ score: NaN, label: true }]), TypeError);
});
test('release simulator gates promotion before delayed metrics, applies the strict cost boundary and rejects invalid evidence', () => {
  assert.deepEqual(simulateRelease({ offline: false }), { action: 'not promoted', alias: 'v3' });
  assert.equal(
    simulateRelease({ mature: 400, joined: 380, cost: 10 }).action,
    'insufficient evidence',
  );
  assert.equal(
    simulateRelease({ mature: 500, joined: 499, cost: 10 }).action,
    'insufficient evidence',
  );
  assert.equal(simulateRelease({ mature: 500, joined: 501, cost: 10 }).action, 'invalid counts');
  for (const cost of [null, false, NaN, Infinity, -1])
    assert.equal(simulateRelease({ mature: 500, joined: 500, cost }).action, 'invalid metric');
  assert.deepEqual(simulateRelease({ mature: 500, joined: 500, cost: 50 }), {
    action: 'keep candidate',
    alias: 'v4',
  });
  assert.deepEqual(simulateRelease({ mature: 500, joined: 500, cost: 50.001 }), {
    action: 'propose rollback',
    alias: 'v3',
  });
});
test('fixed namespace and exact SHA byte contract conserve existing rollout identities', () => {
  assert.equal(jobBucket('job-0000'), jobBucket('job-0000'));
  const initial = assignmentBuckets.flatMap((bucket, i) => (bucket < 5 ? [i] : [])),
    expanded = new Set(assignmentBuckets.flatMap((bucket, i) => (bucket < 25 ? [i] : [])));
  assert.equal(initial.length, 48);
  assert.equal(expanded.size, 257);
  assert.ok(initial.every((i) => expanded.has(i)));
});
