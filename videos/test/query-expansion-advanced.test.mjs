import test from 'node:test';
import assert from 'node:assert/strict';
import {
  meanEmbedding,
  proxyEvidence,
  supportScore,
  CRITIQUE_BRANCHES,
  correctionPath,
  nearestRank,
  LATENCY_TRACES,
  eligibleRoutes,
} from '../animations/query-expansion.mjs';

const close = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} differs from ${b}`);

test('a proxy mean is component-wise and a changed cause loses a required source', () => {
  const mean = meanEmbedding([
    [0.1, 0.5, 0.9],
    [0.7, 0.3, 0.1],
  ]);
  mean.forEach((v, i) => close(v, [0.4, 0.4, 0.5][i]));
  assert.deepEqual(
    new Set(proxyEvidence().hits.map((v) => v.document.id)),
    new Set(['quota-policy', 'batch-policy']),
  );
  assert.equal(proxyEvidence(true).recovered, 1);
  assert(!proxyEvidence(true).hits.some((v) => v.document.id === 'quota-policy'));
});

test('reflection support normalizes its family and critique contributions select the grounded branch', () => {
  close(supportScore([0.47, 0.02, 0.01]), 0.96);
  close(supportScore([0.94, 0.04, 0.02]), 0.96);
  close(CRITIQUE_BRANCHES[0].total, 0.922);
  close(CRITIQUE_BRANCHES[1].total, 0.534);
  assert(CRITIQUE_BRANCHES[0].total > CRITIQUE_BRANCHES[1].total);
});

test('correction equality stays ambiguous and request tails cannot be replaced by summed stage tails', () => {
  assert.equal(correctionPath(0.2), 'combined');
  assert.equal(correctionPath(0.7), 'combined');
  assert.equal(correctionPath(0.19), 'external');
  assert.equal(correctionPath(0.71), 'internal');
  assert.equal(
    nearestRank(LATENCY_TRACES.map((v) => v.a)) + nearestRank(LATENCY_TRACES.map((v) => v.b)),
    20,
  );
  assert.equal(nearestRank(LATENCY_TRACES.map((v) => v.total)), 110);
  assert.deepEqual(
    eligibleRoutes(350).map((v) => v.id),
    ['rewrite'],
  );
  assert.deepEqual(eligibleRoutes(300), []);
});
