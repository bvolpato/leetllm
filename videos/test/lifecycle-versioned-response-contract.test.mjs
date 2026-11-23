import test from 'node:test';
import assert from 'node:assert/strict';
import {
  responseCacheDecision,
  releaseGate,
} from '../animations/llm-lifecycle-training-to-deployment.mjs';

test('cached eligibility requires current policy/checker and request facts', () => {
  const request = { id: 'K', age: 75, stale: true, model: 'v4' },
    old = { version: 'P2', threshold: 60 },
    oldChecker = { version: 'C2', policyVersion: 'P2', threshold: 60 };
  const prior = responseCacheDecision({ request, policy: old, checker: oldChecker });
  assert.equal(prior.eligible, true);
  const policy = { version: 'P3', threshold: 90 },
    checker = { version: 'C3', policyVersion: 'P3', threshold: 90 },
    cached = { identity: prior.identity, answer: { eligible: true, executed: false } };
  const changed = responseCacheDecision({ request, policy, checker, cached });
  assert.equal(changed.kind, 'recompute');
  assert.equal(changed.eligible, false);
  const current = {
    identity: changed.identity,
    answer: { eligible: changed.eligible, executed: false },
  };
  assert.equal(responseCacheDecision({ request, policy, checker, cached: current }).kind, 'hit');
  assert.equal(
    responseCacheDecision({ request: { ...request, age: 90 }, policy, checker, cached: current })
      .eligible,
    true,
  );
  assert.equal(
    responseCacheDecision({
      request,
      policy,
      checker: { ...checker, threshold: 60 },
      cached: current,
    }).kind,
    'checker_mismatch',
  );
});

test('a release gate rejects malformed or empty evidence at the inclusive latency boundary', () => {
  const good = {
    policyCasesPassed: 5,
    policyCasesTotal: 5,
    actionClaims: 0,
    p95DecisionMs: 1000,
    budgetMs: 1000,
  };
  assert.equal(releaseGate(good).verdict, 'PROMOTE');
  for (const patch of [
    { policyCasesTotal: 0, policyCasesPassed: 0 },
    { policyCasesPassed: true },
    { actionClaims: false },
    { p95DecisionMs: -1 },
    { p95DecisionMs: 1001 },
  ])
    assert.equal(releaseGate({ ...good, ...patch }).verdict, 'BLOCK');
});
