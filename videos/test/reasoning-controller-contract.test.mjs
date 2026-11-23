import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalVote,
  chooseReasoningStrategy,
  FRESH_FRACTION_TREE,
  occurrenceExpressionCheck,
  reasoningDecision,
  freshFractionTrace,
  checkExpression,
} from '../animations/reasoning-search.mjs';
test('rejected attempts remain in the winning denominator and a tie is not a policy recommendation', () => {
  const s = ['merge_release', 'merge release', 'force', 'manual_review'];
  assert.equal(canonicalVote(s, 0.6).share, 0.5);
  assert.equal(canonicalVote(s, 0.6).decision, 'abstain');
  assert.equal(canonicalVote(['merge_release', 'manual_review']).decision, 'abstain');
  assert.throws(() => canonicalVote(s, true), /Minimum share/);
  assert.throws(
    () =>
      reasoningDecision({
        tests_passed: true,
        security_scan_clear: 'false',
        reviewer_approved: true,
      }),
    /actual booleans/,
  );
});
test('a valid value multiset still rejects duplicated physical operand occurrence identity', () => {
  const bad = structuredClone(FRESH_FRACTION_TREE);
  bad.left.occurrence = '8a';
  assert.equal(occurrenceExpressionCheck(FRESH_FRACTION_TREE).valid, true);
  const result = occurrenceExpressionCheck(bad);
  assert.equal(result.reachesGoal, true);
  assert.equal(result.allInputsUsed, true);
  assert.equal(result.occurrencesValid, false);
  assert.equal(result.valid, false);
  assert.equal(freshFractionTrace(0).wrong.result, '25');
});
test('the strategy gate rejects impossible metrics and orders eligible rows by calls then latency', () => {
  assert.equal(
    chooseReasoningStrategy([{ strategy: 'bad', accuracy: Infinity, p95_ms: -1, calls: 1 }]),
    null,
  );
  assert.equal(
    chooseReasoningStrategy([{ strategy: 'bad', accuracy: 0.99, p95_ms: 1, calls: true }]),
    null,
  );
  const chosen = chooseReasoningStrategy([
    { strategy: 'slow', accuracy: 0.95, p95_ms: 700, calls: 2 },
    { strategy: 'many', accuracy: 0.97, p95_ms: 100, calls: 5 },
    { strategy: 'fast', accuracy: 0.94, p95_ms: 600, calls: 2 },
  ]);
  assert.equal(chosen.strategy, 'fast');
});

test('nested illegal operations reject the expression instead of dereferencing an absent value', () => {
  assert.deepEqual(
    checkExpression(
      { op: '×', left: { op: '÷', left: { leaf: 3 }, right: { leaf: 0 } }, right: { leaf: 8 } },
      [3, 0, 8],
    ),
    { valid: false, reason: 'invalid-operation' },
  );
});

test('beam width follows the spoken widening cue rather than elapsed beat percentage', async () => {
  const { narratedPruningSnapshot } = await import('../animations/reasoning-search.mjs');
  const cues = {
    'pruning-score-a': { phase: 'after', progress: 1 },
    'pruning-drop-b': { phase: 'after', progress: 1 },
    'pruning-widen-b': { phase: 'before', progress: 0 },
  };
  assert.equal(narratedPruningSnapshot(2, 0.99, cues).width, 1);
  assert.equal(narratedPruningSnapshot(2, 0.99, cues).bPruned, true);
  cues['pruning-widen-b'] = { phase: 'after', progress: 1 };
  assert.equal(narratedPruningSnapshot(2, 0, cues).width, 2);
  assert.equal(narratedPruningSnapshot(2, 0, cues).completionValid, true);
});
