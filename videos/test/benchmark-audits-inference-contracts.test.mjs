import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wilsonInterval,
  exactPairedP,
  freshAuditDecision,
  freshAuditReveal,
  rankedPrecision,
  strictMetricRecord,
  subsetCoverage,
} from '../animations/benchmark-audits.mjs';

test('Wilson roots invert the candidate-variance score test, including all passes', () => {
  for (const [k, n] of [
    [3, 3],
    [17, 25],
    [49, 50],
    [990, 1000],
  ]) {
    const interval = wilsonInterval(k, n);
    for (const rate of [interval.low, interval.high]) {
      if (rate === 0 || rate === 1) continue;
      const z = Math.abs(k / n - rate) / Math.sqrt((rate * (1 - rate)) / n);
      assert.ok(Math.abs(z - 1.96) < 1e-8);
    }
  }
  assert.ok(Math.abs(wilsonInterval(40, 40).low - 40 / (40 + 1.96 ** 2)) < 1e-12);
  assert.throws(() => wilsonInterval(3, 2));
});

test('exact paired tails agree with explicit equally likely direction sequences', () => {
  for (const [fixes, breaks] of [
    [7, 1],
    [3, 1],
    [5, 0],
    [10, 2],
  ]) {
    const n = fixes + breaks,
      limit = Math.min(fixes, breaks);
    let lower = 0;
    for (let bits = 0; bits < 2 ** n; bits++) {
      let ones = 0;
      for (let j = 0; j < n; j++) ones += (bits >> j) & 1;
      if (ones <= limit) lower++;
    }
    assert.equal(exactPairedP(fixes, breaks), Math.min(1, (2 * lower) / 2 ** n));
    assert.equal(exactPairedP(fixes, breaks), exactPairedP(breaks, fixes));
  }
});

test('fresh aggregate evidence cannot buy back the failed permission-bound gate', () => {
  const result = freshAuditDecision();
  assert.equal(result.bothPass + result.broken, result.baselinePass);
  assert.equal(result.bothPass + result.fixed, result.candidatePass);
  assert.equal(result.bothPass + result.bothFail + result.broken + result.fixed, result.total);
  assert.ok(result.pairedP < 0.05);
  assert.ok(result.criticalLower < result.criticalFloor);
  assert.equal(result.ship, false);
});

test('fresh prediction suppresses both answers until the independent spoken cues', () => {
  assert.deepEqual(freshAuditReveal({ beat: 0, beatP: 1 }), {
    paired: false,
    bound: false,
    hold: false,
  });
  const cues = {
    'ba-fresh-report-pvalue': { phase: 'before' },
    'ba-fresh-report-bound': { phase: 'before' },
    'ba-fresh-report-hold': { phase: 'before' },
  };
  assert.deepEqual(freshAuditReveal({ beat: 1, beatP: 1, cues }), {
    paired: false,
    bound: false,
    hold: false,
  });
  cues['ba-fresh-report-pvalue'].phase = 'after';
  assert.deepEqual(freshAuditReveal({ beat: 1, beatP: 0.1, cues }), {
    paired: true,
    bound: false,
    hold: false,
  });
  assert.equal(freshAuditReveal({ beat: 2, beatP: 1, cues }).hold, false);
  cues['ba-fresh-report-hold'].phase = 'active';
  assert.equal(freshAuditReveal({ beat: 2, beatP: 0.01, cues }).hold, false);
  cues['ba-fresh-report-hold'].phase = 'after';
  assert.equal(freshAuditReveal({ beat: 2, beatP: 0.01, cues }).hold, true);
});

test('metric validity preserves true zero while rejecting Boolean, missing and nonfinite evidence', () => {
  const base = { policy: 0.99, schema: 1, ms: 0, cost: 0 };
  assert.equal(strictMetricRecord(base), true);
  for (const field of ['policy', 'schema', 'ms', 'cost']) {
    for (const value of [false, undefined, NaN, Infinity, -1, '0'])
      assert.equal(strictMetricRecord({ ...base, [field]: value }), false);
  }
  assert.equal(strictMetricRecord({ ...base, policy: 1.01 }), false);
});

test('ranked precision and subset counting keep their intended denominators', () => {
  assert.ok(Math.abs(rankedPrecision([1, 0, 1]) - 5 / 6) < 1e-12);
  assert.equal(rankedPrecision([0, 0, 0]), 0);
  assert.equal(subsetCoverage(6, 2, 3), 0.8);
  assert.equal((subsetCoverage(4, 4, 2) + subsetCoverage(4, 0, 2)) / 2, 0.5);
  assert.notEqual(subsetCoverage(8, 4, 2), 0.5);
});
