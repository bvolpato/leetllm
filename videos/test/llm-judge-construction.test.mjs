import test from 'node:test';
import assert from 'node:assert/strict';
import { judgeReport } from '../animations/llm-judge.mjs';

test('an additional parse failure reduces coverage without changing comparable-label agreement', () => {
  const before = judgeReport({ attempted: 20, resolved: 14, comparable: 14, matches: 10 });
  const after = judgeReport({ ...before, attempted: 21 });
  assert.equal(before.coverage, 0.7);
  assert.equal(after.coverage, 2 / 3);
  assert.equal(after.agreement, before.agreement);
  assert.equal(after.agreement, 5 / 7);
});

test('missing labels reduce the agreement denominator and an empty comparison is unavailable', () => {
  const report = judgeReport({ attempted: 10, resolved: 8, comparable: 6, matches: 5 });
  assert.equal(report.coverage, 0.8);
  assert.equal(report.agreement, 5 / 6);
  assert.equal(
    judgeReport({ attempted: 10, resolved: 0, comparable: 0, matches: 0 }).agreement,
    null,
  );
  assert.equal(
    judgeReport({ attempted: 0, resolved: 0, comparable: 0, matches: 0 }).coverage,
    null,
  );
  assert.throws(() => judgeReport({ attempted: 10, resolved: 8, comparable: 6, matches: 7 }));
});
