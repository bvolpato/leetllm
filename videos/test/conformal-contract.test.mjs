import test from 'node:test';
import assert from 'node:assert/strict';
import {
  correctedThreshold,
  RESIDUALS,
  exchangeabilityState,
  classificationSet,
  routerState,
  freshDeadlineState,
  intervalState,
} from '../animations/conformal.mjs';
test('corrected ranks select actual order statistics and preserve the unavailable infinite case', () => {
  assert.deepEqual(correctedThreshold(RESIDUALS, 0.85), { rank: 9, index: 8, threshold: 12 });
  assert.equal(correctedThreshold(RESIDUALS, 0.95).threshold, Infinity);
  assert.equal(correctedThreshold(Array(19).fill(7), 0.95).threshold, 7);
  assert.throws(() => correctedThreshold([], 0.8));
  assert.throws(() => correctedThreshold([1, NaN], 0.8));
  assert.throws(() => correctedThreshold([1], 1));
  assert.equal(intervalState(1, 1).covered, true);
});
test('rank enumeration recalibrates for every removed future identity rather than permuting a fixed threshold', () => {
  const s = exchangeabilityState(2, 1);
  assert.equal(s.cases.length, 10);
  for (const row of s.cases) {
    assert(!row.calibration.includes(row.future));
    assert.equal(row.threshold, row.future <= 8 ? 9 : 8);
    assert.equal(row.covered, row.future <= 8);
  }
  assert.equal(s.covered, 8);
  assert.equal(exchangeabilityState(0, 1).visibleCount, 0);
});
test('the three classification inversions distinguish empty sets, ties and strict first crossings', () => {
  const p = [0.98, 0.01, 0.005, 0.005],
    u = [0.25, 0.25, 0.25, 0.25];
  assert.deepEqual(classificationSet(p, 'softmax', 0.4), [0]);
  assert.deepEqual(classificationSet(p, 'direct', 0.9), []);
  assert.deepEqual(classificationSet(p, 'crossing', 0.9), [0]);
  assert.deepEqual(classificationSet(u, 'softmax', 0.4), []);
  assert.deepEqual(classificationSet(u, 'direct', 0.5), [0, 1]);
  assert.deepEqual(classificationSet(u, 'crossing', 0.5), [0, 1, 2]);
});
test('strict router acceptance drops a threshold-equal mistake and preserves both risk denominators', () => {
  assert.equal(routerState(0.6 - 1e-8).mistakes, 2);
  const s = routerState(0.6);
  assert.equal(s.mistakes, 1);
  assert.deepEqual(s.accepted, ['R7', 'R8', 'R9']);
  assert.equal(s.joint, 1 / 9);
  assert.equal(s.selective, 1 / 3);
  assert.equal(s.corrected, 0.2);
  assert.equal(routerState(0.1).passes, false);
  assert.equal(routerState(1).selective, null);
});
test('fresh prediction stays withheld and the inclusive covered endpoint can miss a deadline', () => {
  assert.equal(freshDeadlineState(0, 1).intervalVisible, false);
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 };
  const held = freshDeadlineState(1, 0.99, { 'fresh-interval': before, 'fresh-outcome': before }),
    shown = freshDeadlineState(1, 0.01, { 'fresh-interval': after, 'fresh-outcome': after });
  assert.equal(held.intervalVisible, false);
  assert.equal(held.outcomeVisible, false);
  assert.equal(shown.intervalVisible, true);
  assert.equal(shown.covered, true);
  assert.equal(shown.meetsDeadline, false);
  const changed = freshDeadlineState(2, 1);
  assert.equal(changed.rank, 18);
  assert.deepEqual([changed.lower, changed.upper, changed.width], [44, 60, 16]);
});
