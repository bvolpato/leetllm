import { P, Q } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function decomposition(p = P, q = Q) {
  const overlap = p.map((v, i) => Math.min(v, q[i])),
    deficit = p.map((v, i) => Math.max(0, v - q[i])),
    z = deficit.reduce((a, v) => a + v, 0);
  return {
    overlap,
    deficit,
    z,
    residual: z ? deficit.map((v) => v / z) : null,
    acceptance: q.map((v, i) => (v > 0 ? Math.min(1, p[i] / v) : null)),
  };
}
export const expectedYield = (alpha, depth) =>
  Array.from(
    {
      length: depth + 1,
    },
    (_, i) => alpha ** i,
  ).reduce((a, v) => a + v, 0);
export function sampleProposal(q, u) {
  assert(u >= 0 && u < 1);
  let cumulative = 0;
  for (let i = 0; i < q.length; i++) {
    cumulative += q[i];
    if (u < cumulative) return i;
  }
  throw new Error('Proposal probabilities must sum to one');
}
export function deliverUntilStop(tokens) {
  const stop = tokens.indexOf('EOS');
  return {
    delivered: tokens.slice(0, stop < 0 ? tokens.length : stop),
    stopped: stop >= 0,
    discarded: stop < 0 ? [] : tokens.slice(stop + 1),
  };
}
export function weightWorksheet(positions = 1) {
  const bytes = 30e9 * 2,
    flops = 30e9 * 2 * positions;
  return {
    positions,
    bytes,
    flops,
    intensity: flops / bytes,
    memoryMs: (bytes / 3.35e12) * 1000,
    computeMs: (flops / 989.5e12) * 1000,
    ridge: 989.5 / 3.35,
  };
}
export function transformedLaw() {
  const raw = [0.55, 0.3, 0.15],
    retained = raw.slice(0, 2).reduce((a, v) => a + v, 0),
    target = raw.map((v, i) => (i < 2 ? v / retained : 0)),
    proposal = [0.4, 0.35, 0.25];
  return {
    raw,
    retained,
    target,
    proposal,
    acceptance: target.map((v, i) => Math.min(1, v / proposal[i])),
  };
}
export function correctionCounterexample() {
  const p = [0.4, 0.5, 0.1],
    q = [0.6, 0.3, 0.1],
    d = decomposition(p, q);
  return {
    p,
    q,
    ...d,
    wrongExtra: p.map((v) => v * d.z),
    wrong: p.map((v, i) => d.overlap[i] + v * d.z),
    correct: p.map((v, i) => d.overlap[i] + d.deficit[i]),
  };
}
export function prefixStates(tokens, initial = 0) {
  return tokens.reduce((out, v) => [...out, out.at(-1) * 10 + v], [initial]);
}
export function visibility(parents, query) {
  const visible = parents.map(() => 0);
  for (let at = query; at !== null; at = parents[at]) visible[at] = 1;
  return visible;
}
export function isolationFixture(offBranch = 100) {
  const scores = [-1, 4, 0, 3],
    values = [1, offBranch, 2, 200],
    tree = [1, 0, 1, 0],
    flat = [1, 1, 1, 0];
  const run = (mask) => {
    const max = Math.max(...scores.filter((_, i) => mask[i])),
      mass = scores.map((v, i) => (mask[i] ? Math.exp(v - max) : 0)),
      z = mass.reduce((a, v) => a + v, 0),
      weights = mass.map((v) => v / z);
    return {
      weights,
      result: weights.reduce((a, v, i) => a + v * values[i], 0),
    };
  };
  return {
    scores,
    values,
    tree: run(tree),
    flat: run(flat),
  };
}
export function verificationBudget(streams, depth, budget = 64, alpha = 0.8) {
  return {
    inputs: streams * (depth + 1),
    expectedOutput: streams * expectedYield(alpha, depth),
    fits: streams * (depth + 1) <= budget,
  };
}
export function samplerBoundary(changed, exact) {
  return {
    target: changed ? 'W1' : 'W0',
    targetLawEstablished: exact,
    baselineLawEstablished: !changed && exact,
  };
}
