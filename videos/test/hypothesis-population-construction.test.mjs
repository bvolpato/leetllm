import test from 'node:test';
import assert from 'node:assert/strict';
import {
  joinTaskResults,
  jointDifferenceMoments,
  waldMeanDifference,
  estimatorFactors,
  estimatorExpectation,
  orderedTaskResamples,
  macroTaskResamples,
  macroTaskScores,
  macroTaskInterval,
  percentileInterval,
  passAtK,
  subsets,
  usefulLiftDecision,
  pairedIntervalStudies,
} from '../animations/hypothesis-testing.mjs';
const close = (a, b) => assert(Math.abs(a - b) < 1e-11, `${a} != ${b}`);
test('arrival order cannot change the task join and missing outcomes remain accountable', () => {
  const a = [
      { id: 'denial', pass: 0 },
      { id: 'quota', pass: 1 },
      { id: 'timeout', pass: 0 },
    ],
    b = [
      { id: 'quota', pass: 0 },
      { id: 'denial', pass: 1 },
    ];
  assert.deepEqual(joinTaskResults(a, b), {
    rows: [
      { id: 'denial', a: 0, b: 1, difference: 1 },
      { id: 'quota', a: 1, b: 0, difference: -1 },
      { id: 'timeout', a: 0, b: null, difference: null },
    ],
    unmatchedB: [],
  });
  assert.throws(() => joinTaskResults(a, [...b, b[0]]), TypeError);
});
test('paired variance matches direct joint-outcome variance for positive,zero and negative covariance', () => {
  for (const both of [0.45, 0.25, 0.05]) {
    const m = jointDifferenceMoments(both),
      mean = m.rows.reduce((s, r) => s + r.p * (r.b - r.a), 0),
      variance = m.rows.reduce((s, r) => s + r.p * (r.b - r.a - mean) ** 2, 0);
    close(m.paired, variance / 40);
    close(m.independent, 0.5 / 40);
    close(m.cov, both - 0.25);
  }
  close(jointDifferenceMoments(0.45).paired, 0.5 / 200);
  assert(jointDifferenceMoments(0.05).paired > jointDifferenceMoments(0.05).independent);
});
test('stable product and direct enumeration agree at finite-pool boundaries', () => {
  for (let n = 1; n <= 8; n++)
    for (let c = 0; c <= n; c++)
      for (let k = 1; k <= n; k++) {
        const ids = subsets(n, k),
          direct = ids.filter((a) => a.some((i) => i < c)).length / ids.length;
        close(passAtK(c, n, k), direct);
        close(estimatorFactors(c, n, k).success, direct);
      }
  assert.throws(() => passAtK(0, 0, 0), RangeError);
  assert.throws(() => passAtK(2, 10, 0), RangeError);
  assert.throws(() => passAtK(2, 10, 11), RangeError);
});
test('independent Bernoulli pool enumeration earns the unbiased target and exposes plug-in bias', () => {
  const p = 0.2,
    n = 10,
    k = 5;
  let unbiased = 0,
    plugin = 0;
  for (let mask = 0; mask < 2 ** n; mask++) {
    const c = mask.toString(2).replaceAll('0', '').length,
      prob = p ** c * (1 - p) ** (n - c);
    unbiased += prob * passAtK(c, n, k);
    plugin += prob * (1 - (1 - c / n) ** k);
  }
  const m = estimatorExpectation(p, n, k);
  close(unbiased, 1 - (1 - p) ** k);
  close(m.combinatorial, unbiased);
  close(m.plugin, plugin);
  assert(plugin < m.target);
  close(plugin, 0.593591168);
});
test('whole-task resamples preserve repeated ownership and actual percentile endpoints', () => {
  const r = macroTaskResamples;
  close(r[0].mean, 71 / 126);
  assert.deepEqual(r[0].ids, [0, 1, 2, 3]);
  assert.equal(r.length, 256);
  assert.equal(new Set(r.map((x) => x.ids.join(','))).size, 256);
  for (const x of r) close(x.mean, x.ids.reduce((s, i) => s + macroTaskScores[i], 0) / 4);
  close(macroTaskInterval[0], 7 / 36);
  close(macroTaskInterval[1], 221 / 252);
  assert.deepEqual(
    percentileInterval(orderedTaskResamples([0, 0, 0, 0]).map((r) => r.mean)),
    [0, 0],
  );
});
test('empirical interval degeneracy and strict useful-lift equality do not erase their limits', () => {
  const r = waldMeanDifference([0, 0, 0, 0, 0, 0]);
  assert.deepEqual(r.interval, [0, 0]);
  for (const s of pairedIntervalStudies) {
    close(s.mean, s.values.reduce((a, b) => a + b, 0) / 40);
    assert.equal(s.covers, s.interval[0] <= 0 && s.interval[1] >= 0);
  }
  assert(pairedIntervalStudies.some((s) => !s.covers));
  assert.equal(usefulLiftDecision([0.02, 0.14]), 'positive-size-unestablished');
  assert.equal(usefulLiftDecision([0.020001, 0.14]), 'clears-useful-lift');
  assert.equal(usefulLiftDecision([-0.08, -0.01]), 'regression');
  assert.equal(usefulLiftDecision([-0.1, 0.25]), 'inconclusive');
});
