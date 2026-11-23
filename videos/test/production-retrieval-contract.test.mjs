import test from 'node:test';
import assert from 'node:assert/strict';
import {
  halfOpenCurrent,
  filteredRecallFixture,
  zeroScoreFixture,
  unknownSourceLabels,
  governingRecall,
  serialRequestTrace,
  ragReleaseGate,
  REQUIRED_RAG_GATES,
  parentPackingFixture,
  parentAdmission,
  PARENTS,
  answerFromEvidence,
} from '../animations/production-retrieval.mjs';

test('half-open ownership changes at the exact replacement boundary', () => {
  const old = { start: 3, end: 12 },
    next = { start: 12, end: null };
  assert.equal(halfOpenCurrent(old, 11.999), true);
  assert.equal(halfOpenCurrent(old, 12), false);
  assert.equal(halfOpenCurrent(next, 12), true);
  assert.throws(() => halfOpenCurrent(next, Infinity));
});

test('late permission filtering loses allowed candidates below the global cutoff', () => {
  const f = filteredRecallFixture();
  assert.deepEqual(
    f.global.map((r) => r.id),
    ['R1', 'R2', 'P1'],
  );
  assert.deepEqual(
    f.redacted.map((r) => r.id),
    ['P1'],
  );
  assert.deepEqual(
    f.allowed.map((r) => r.id),
    ['P1', 'P2', 'P3'],
  );
});

test('zero lexical scores can coexist with a mechanically supported numeric answer', () => {
  const f = zeroScoreFixture();
  assert.deepEqual(
    f.hits.map((h) => h.score),
    [0, 0],
  );
  assert.deepEqual(
    f.hits.map((h) => h.record.id),
    ['eu-key-v2', 'eu-session-v1'],
  );
  assert.equal(f.answer.decision, 'eligible');
});

test('source identity validation does not establish passage support', () => {
  assert.deepEqual(unknownSourceLabels('Rule [E7]. Again [E7].', ['E1', 'E2']), ['E7']);
  assert.deepEqual(unknownSourceLabels('A key rule [E2].', ['E1', 'E2']), []);
  const f = parentPackingFixture();
  assert.equal(
    answerFromEvidence(
      { intent: 'rotation_eligibility', staleDays: 10, signalHours: 48 },
      f.packed.filter((p) => p.sourceId === 'E2'),
    ).decision,
    'abstain',
  );
});

test('parent packing deduplicates identity and requires the pinned child revision', () => {
  const f = parentPackingFixture(),
    child = f.hits[0].record,
    parent = PARENTS[child.parentId];
  assert.equal(f.hits.length, 3);
  assert.equal(f.packed.length, 2);
  assert.equal(
    parentAdmission(child, { ...parent, version: 'different' }, f.run.caller).accepted,
    false,
  );
  assert.equal(
    f.budget.parts.reduce((sum, p) => sum + p.tokens, 0),
    f.budget.total,
  );
});

test('ANN overlap and required-passage recall measure different contracts', () => {
  const exact = ['A', 'B', 'C', 'D'],
    approx = ['A', 'B', 'X', 'Y'];
  assert.deepEqual(governingRecall(exact, approx, ['D']), { ann: 0.5, task: 0 });
});

test('serial elapsed time includes every preceding stage and keeps trace off response path', () => {
  const f = serialRequestTrace();
  assert.equal(f.stages[3].start, 21);
  assert.equal(f.callerTTFT, f.stages[3].end);
  assert.equal(f.completion, f.stages.at(-1).end);
  assert.equal(f.traceComplete - f.completion, 3);
  assert.equal(
    f.localTotal,
    f.localPassingStages.reduce((a, b) => a + b, 0),
  );
});

test('release report requires every named Boolean success rather than truthy or empty data', () => {
  const all = Object.fromEntries(REQUIRED_RAG_GATES.map((k) => [k, true]));
  assert(ragReleaseGate(all));
  assert.equal(ragReleaseGate({}), false);
  for (const key of REQUIRED_RAG_GATES) {
    const missing = { ...all };
    delete missing[key];
    assert.equal(ragReleaseGate(missing), false);
    for (const value of [false, 1, 'true', null])
      assert.equal(ragReleaseGate({ ...all, [key]: value }), false);
  }
});
