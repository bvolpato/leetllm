import test from 'node:test';
import assert from 'node:assert/strict';
import {
  editorEpochState,
  prefillCohortWork,
  correctionDistribution,
  completeTraceQuantiles,
  fimTrace,
  fresh,
} from '../animations/design-code-completion-system.mjs';

const after = { phase: 'after', progress: 1 },
  before = { phase: 'before', progress: 0 };

test('returning to the caret retains the invalidated event epoch until a new request', () => {
  const state = { beat: 0, cues: { 'cc-fresh-move15': after, 'cc-fresh-return12': after } };
  const question = editorEpochState(state);
  assert.equal(question.cursor, 12);
  assert.equal(question.currentEpoch, 103);
  assert.equal(question.responseEpoch, 101);
  assert.equal(question.answerVisible, false);
  assert.equal(question.painted, false);
  const denied = editorEpochState({ beat: 1, cues: { ...state.cues, 'cc-fresh-deny': after } });
  assert.equal(denied.denied, true);
  assert.equal(denied.submitted, false);
  const pending = editorEpochState({
    beat: 1,
    cues: {
      ...state.cues,
      'cc-fresh-deny': after,
      'cc-fresh-current-request': after,
      'cc-fresh-current-paint': before,
    },
  });
  assert.equal(pending.currentEpoch, 104);
  assert.equal(pending.painted, false);
  const painted = editorEpochState({
    beat: 1,
    cues: { ...state.cues, 'cc-fresh-current-request': after, 'cc-fresh-current-paint': after },
  });
  assert.equal(painted.painted, true);
  assert.deepEqual(editorEpochState(state), question);
});

test('equal request hit rates and global means do not determine token-weighted work', () => {
  assert.deepEqual(prefillCohortWork(), { hit: 204800, miss: 819200, total: 1024000, gpus: 52 });
  assert.deepEqual(prefillCohortWork(3072, 1024), {
    hit: 307200,
    miss: 409600,
    total: 716800,
    gpus: 36,
  });
  assert.deepEqual(prefillCohortWork(1024, 3072), {
    hit: 102400,
    miss: 1228800,
    total: 1331200,
    gpus: 67,
  });
});

test('stochastic replacement normalizes the positive residual on the same vocabulary', () => {
  const r = correctionDistribution([0.1, 0.7, 0.2], [0.4, 0.4, 0.2]);
  assert.ok(Math.abs(r.mass - 0.3) < 1e-12);
  assert.deepEqual(r.probabilities, [0, 1, 0]);
  assert.equal(correctionDistribution([0.2, 0.8], [0.2, 0.8]).probabilities, null);
});

test('the percentile sorts complete request sums before selecting nearest rank', () => {
  const f = completeTraceQuantiles();
  assert.equal(f.rank, 19);
  assert.equal(f.complete, 101);
  assert.equal(f.stageSum, 2);
  assert.equal(f.rows.filter((r) => r.total === 101).length, 2);
  assert.equal(f.rows.filter((r) => r.total === 2).length, 18);
});

test('the generated middle returns progressively while document boundaries remain outside it', () => {
  assert.equal(fimTrace(0, 0.99).returnProgress, 0);
  assert.equal(fimTrace(1, 16.8 / 18.034).returnProgress, 0);
  assert.ok(Math.abs(fimTrace(1, 17.25 / 18.034).returnProgress - 0.5) < 1e-12);
  assert.equal(fimTrace(1, 17.8 / 18.034).returnProgress, 1);
  const snap = {
    document: 'scope.py',
    version: 73,
    cursor: 12,
    selection: { start: 12, end: 12 },
    policy: 9,
    epoch: 103,
  };
  assert.equal(fresh({ ...snap, epoch: 101 }, snap), false);
  assert.equal(fresh({ ...snap, selection: { start: 12, end: 15 } }, snap), false);
  assert.equal(fresh({ ...snap, selection: { start: 12, end: 12 } }, snap), true);
});
