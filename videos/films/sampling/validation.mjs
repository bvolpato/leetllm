import {
  metropolisAcceptance,
  mm1Means,
  queuePlan,
  rareEventBudget,
  tokenProbabilities,
} from './arithmetic.mjs';
import {
  auditFrame,
  durationCdf,
  durationDensity,
  durationFromRank,
  latePrefixes,
  requests,
  streams,
  transferFrame,
} from './model.mjs';
import assert from 'node:assert/strict';
import { sampleFunction } from 'vizmatic';
export function validateOriginalSampling() {
  assert(Math.abs(durationFromRank(0.5) - 6) < 1e-6);
  assert(Math.abs(durationFromRank(0.95) - 14.82606527) < 0.001);
  assert(Math.abs(durationCdf(10) - 0.823496) < 0.00001);
  const dx = 0.002,
    mass = sampleFunction(durationDensity, dx, 100, 50000).reduce((sum, p) => sum + p.y * dx, 0);
  assert(Math.abs(mass - 1) < 0.0001);
  assert(requests.every((row) => row.seconds > 0 && row.seconds < 20));
  for (const [i, prefix] of latePrefixes.entries()) {
    assert.equal(prefix.length, 10001);
    assert.equal(prefix[100], streams[i].slice(0, 100).filter((u) => u > durationCdf(10)).length);
  }
  assert.equal(
    auditFrame({
      beat: 3,
    }).fraction,
    0.64,
  );
  assert.equal(
    transferFrame({
      beat: 2,
    }).timely / 250,
    0.8,
  );
  return true;
}
export function validateModel() {
  validateOriginalSampling();
  assert.equal(rareEventBudget(0.0001), 29956);
  assert.equal(mm1Means(20, 20).stable, false);
  assert.equal(
    queuePlan([0, 5, 10, 15], [20, 20, 20, 20], 1).filter((r) => r.total <= 40).length,
    2,
  );
  assert.equal(
    queuePlan([0, 5, 10, 15], [20, 20, 20, 20], 2).filter((r) => r.total <= 40).length,
    4,
  );
  assert.equal(metropolisAcceptance(0.5, 0.6), 1);
  assert(metropolisAcceptance(0.6, 0.5) < 0.4);
  assert(Math.abs(tokenProbabilities().reduce((a, b) => a + b, 0) - 1) < 1e-12);
  return true;
}
