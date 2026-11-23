import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recursivePrefix,
  recursiveCandidate,
  recursiveConstructionState,
  normalizedWeights,
  maskStepTime,
  treeRelationships,
  nullableRecord,
  ciOutcome,
  retryBudget,
  digestIdentity,
} from '../animations/structured-generation.mjs';

test('recursive rule retains each unresolved return point through a whole token', () => {
  for (const depth of [1, 2, 3, 4, 8]) {
    const prefix = '{"child":'.repeat(depth - 1) + '{';
    const before = recursivePrefix(prefix),
      closed = recursiveCandidate(prefix, '}'.repeat(depth));
    assert.equal(before.frames.length, depth);
    assert.equal(before.complete, false);
    assert.equal(closed.accepted, true);
    assert.equal(closed.committedFrames.length, 0);
    assert.equal(closed.eosAfter, true);
  }
});
test('an illegal trailing byte discards every trial pop', () => {
  const prefix = '{"child":{"child":{',
    bad = recursiveCandidate(prefix, '}}]');
  assert.equal(bad.accepted, false);
  assert.equal(bad.trial.frames.length, 1);
  assert.equal(bad.nextPrefix, prefix);
  assert.deepEqual(bad.committedFrames, bad.before.frames);
});
test('fresh visible state commits only the complete A trial and keeps B on its original input', () => {
  const held = recursiveConstructionState(true, 0.999, 0);
  assert.equal(held.accepted, false);
  assert.equal(held.committed.frames.length, 4);
  assert.equal(held.committedPrefix, held.prefix);
  const revealed = recursiveConstructionState(true, 1, 1);
  assert.equal(revealed.committed.complete, true);
  assert.equal(revealed.committed.frames.length, 0);
  assert.equal(revealed.alternativeStartsFrom, held.prefix);
  assert.equal(revealed.bTrial.valid, false);
  assert.equal(revealed.rejected, true);
});
test('masking renormalizes surviving weights without changing their ratio', () => {
  assert.deepEqual(normalizedWeights([2, 3, 5], [0, 1]), [0.4, 0.6, 0]);
  const fresh = normalizedWeights([1, 4, 6, 9], [0, 2]);
  assert.equal(fresh[0] + fresh[2], 1);
  assert.equal(fresh[2] / fresh[0], 6);
  assert.deepEqual(normalizedWeights([100, 3, 5], [1]), [0, 1, 0]);
});
test('empty or nonfinite legal mass is an error rather than an unmasked fallback', () => {
  assert.throws(() => normalizedWeights([1, 2], []), /No finite legal/);
  assert.throws(() => normalizedWeights([0, 0], [0, 1]), /No finite legal/);
  assert.throws(() => normalizedWeights([Infinity, 2], [1]));
});
test('sampling joins both previous-prefix tasks, including a slow mask', () => {
  assert.equal(maskStepTime(8, 3, 1, false), 12);
  assert.equal(maskStepTime(8, 3, 1), 9);
  assert.equal(maskStepTime(8, 10, 1), 11);
  assert.equal(maskStepTime(7, 11, 2), 13);
});
test('resolved parent IDs still fail when a cycle is disconnected from the root', () => {
  const got = treeRelationships([
    { id: 'R', parent: null },
    { id: 'U', parent: 'V' },
    { id: 'V', parent: 'U' },
    { id: 'W', parent: 'R' },
  ]);
  assert.equal(got.valid, false);
  assert.deepEqual(new Set(got.visited), new Set(['R', 'W']));
  assert.match(got.reason, /disconnected/);
});
test('flat-tree construction rejects unknown parents and duplicate identities', () => {
  assert.equal(
    treeRelationships([
      { id: 'r', parent: null },
      { id: 'n', parent: 'r' },
    ]).valid,
    true,
  );
  assert.equal(
    treeRelationships([
      { id: 'r', parent: null },
      { id: 'n', parent: 'missing' },
    ]).reason,
    'unknown parent',
  );
  assert.equal(
    treeRelationships([
      { id: 'r', parent: null },
      { id: 'r', parent: null },
    ]).reason,
    'duplicate ID',
  );
});
test('nullable is a present value and does not weaken the closed field contract', () => {
  const base = { run_id: 'RUN-316', status: 'failed', failing_job: null };
  assert.equal(nullableRecord(base), true);
  assert.equal(nullableRecord({ run_id: base.run_id, status: base.status }), false);
  assert.equal(nullableRecord({ ...base, note: 'unknown' }), false);
  assert.equal(nullableRecord({ ...base, failing_job: false }), false);
});
test('an unauthorized project cannot query the snapshot', () => {
  const snapshot = new Proxy(
    {},
    {
      get() {
        throw new Error('unauthorized query');
      },
    },
  );
  assert.deepEqual(
    ciOutcome(
      { project: 'foreign', run_id: 'RUN-842', status: 'failed' },
      'project-alpha',
      snapshot,
    ),
    { outcome: 'deny', queried: false },
  );
});
test('a same-shaped authorized candidate can contradict the trusted snapshot', () => {
  const snapshot = { 'project-alpha/RUN-842': 'failed' };
  assert.equal(
    ciOutcome(
      { project: 'project-alpha', run_id: 'RUN-842', status: 'passed' },
      'project-alpha',
      snapshot,
    ).outcome,
    'review',
  );
  assert.equal(
    ciOutcome(
      { project: 'project-alpha', run_id: 'RUN-842', status: 'failed' },
      'project-alpha',
      snapshot,
    ).outcome,
    'show snapshot',
  );
});
test('retry permission combines failure class and both accumulated reserves', () => {
  const fixed = {
    call: 3,
    validation: 1,
    cost: 3,
    deadline: 12,
    limit: 8,
    output: 500,
    modelLimit: 600,
  };
  const inputs = [
    ['A', 'length', 7, 4],
    ['B', 'length', 8.5, 4],
    ['C', 'length', 4, 6],
    ['D', 'refusal', 4, 4],
  ];
  assert.deepEqual(
    inputs
      .filter(
        ([, status, elapsed, spent]) => retryBudget({ ...fixed, status, elapsed, spent }).allowed,
      )
      .map(([id]) => id),
    ['A'],
  );
});
test('digest identity preserves duplicates, unknown names and an empty list as distinct states', () => {
  const catalog = ['auth-api'];
  assert.equal(digestIdentity([], catalog).valid, true);
  assert.deepEqual(digestIdentity([{ service: 'new', status: 'unknown' }], catalog), {
    valid: true,
    duplicates: [],
    unknown: ['new'],
  });
  assert.equal(
    digestIdentity(
      [
        { service: 'auth-api', status: 'healthy' },
        { service: 'auth-api', status: 'outage' },
      ],
      catalog,
    ).valid,
    false,
  );
});
