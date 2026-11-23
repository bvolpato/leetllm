import assert from 'node:assert/strict';
import {
  gamma,
  returns,
  mdpBefore,
  mdpEvent,
  explorationDraws,
  explorationEpsilon,
  openingPolicyValues,
  openingBaseline,
  openingGradient,
  updatedPolicy,
} from '../../../films/reinforcement-learning/fixtures.mjs';
import {
  explorationEpisodes,
  explorationLedger,
  observeEnvironment,
  valueIteration,
} from '../../../films/reinforcement-learning/model.mjs';
import {
  evidenceValue,
  indifferenceProbability,
  openingActions,
} from '../../../films/reinforcement-learning/arithmetic.mjs';

export {
  gamma,
  returns,
  mdpBefore,
  mdpEvent,
  explorationDraws,
  explorationEpsilon,
  openingPolicyValues,
  openingBaseline,
  openingGradient,
  updatedPolicy,
  explorationEpisodes,
  explorationLedger,
  indifferenceProbability,
  openingActions,
};
export const routes = [
  { name: 'Ask for proof', cost: -4, finish: 'Verified approval', reward: 70 },
  { name: 'Human review', cost: -18, finish: 'Reviewer approves', reward: 80 },
];
export const back = (reward, future) => reward + gamma * future;
export const net = (r) => back(r.cost, r.reward);
export const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const abandoned = routes[0].cost - 50;
export const receipt = observeEnvironment(mdpBefore, 'ask evidence', mdpEvent);
export const sweeps = [
  { new_request: 0, evidence_ready: 0, review_queue: 0, closed: 0 },
  ...valueIteration(3),
];
export const gradientAt = (outcome, baseline) => (outcome - 0.5) * (outcome - baseline);
export const clipScore = (ratio) => Math.min(ratio, 1.2); // The pictured advantage equals +1.
export const propensities = [
  [0.5, 0.8],
  [0.5, 0.6],
];
export const ratios = propensities.map(([old, next]) => next / old);
export const pathWeight = ratios.reduce((a, b) => a * b, 1);
export const riskAware = [returns.review, returns.review, 70, 70];
export const speed = [100, 45, 15];
export const actionNames = ['Approve', 'Ask', 'Review'];
export const gate = (proposal, verified) =>
  proposal === 'Approve' && !verified ? 'Review' : proposal;
export const coin = (baseline) => {
  const samples = [gradientAt(0, baseline), gradientAt(1, baseline)];
  const mean = avg(samples);
  return { baseline, samples, mean, variance: avg(samples.map((v) => (v - mean) ** 2)) };
};
export function risk(lost) {
  const mean = evidenceValue(lost / 100);
  const review = net(routes[1]);
  return {
    lost,
    replies: 100 - lost,
    mean,
    review,
    switchTo: mean > review ? 'Ask' : mean < review ? 'Review' : 'Tie',
  };
}
export function replay(commit) {
  const old = [0, 0, 0];
  const next = [70, returns.evidenceReadyHuman];
  const target = back(receipt.reward, Math.max(...next));
  const q = [...old];
  if (commit) q[1] += 0.5 * (target - old[1]);
  return { old, q, next, target, observed: receipt };
}
export const targets = {
  td: back(receipt.reward, 50),
  mc: net(routes[0]),
  sarsa: back(receipt.reward, returns.evidenceReadyHuman),
  q: replay(false).target,
  closed: back(-18, 0),
  cutoff: back(-18, 80),
};
export function group(scores) {
  const mean = avg(scores);
  const std = Math.sqrt(avg(scores.map((r) => (r - mean) ** 2)));
  return { scores, mean, std, weights: scores.map((r) => (r - mean) / (std + 1e-8)) };
}
export const tokens = [
  ['Approve', 'access'],
  ['Request', 'evidence'],
  ['Review', 'this', 'request'],
];
export function checkExamples() {
  assert.deepEqual(routes.map(net), [59, 54]);
  assert.deepEqual(
    routes.map((r) => gamma * r.reward),
    [63, 72],
  );
  assert.deepEqual(
    [receipt.receipt, receipt.stage, receipt.elapsedWait, receipt.reward],
    ['E17', 'evidence ready', 65, -4],
  );
  assert.deepEqual(
    sweeps.map((s) => [s.new_request, s.evidence_ready, s.review_queue, s.closed]),
    [
      [0, 0, 0, 0],
      [-4, 70, 80, 0],
      [59, 70, 80, 0],
      [59, 70, 80, 0],
    ],
  );
  assert.deepEqual(openingActions(sweeps[1]), { approve: -120, evidence: 59, review: 54 });
  assert.equal(back(-10, 80), 62);
  for (const [n, ask, review, route] of [
    [0, 59, 54, 'Ask'],
    [25, 30.75, 54, 'Review'],
    [4, 54.48, 54, 'Ask'],
    [5, 53.35, 54, 'Review'],
  ]) {
    const s = risk(n);
    assert.deepEqual(
      [s.replies, s.lost, +s.mean.toFixed(2), s.review, s.switchTo],
      [100 - n, n, ask, review, route],
    );
    assert(Math.abs(s.mean - (s.replies * net(routes[0]) + n * abandoned) / 100) < 1e-9);
  }
  assert.equal(indifferenceProbability, 5 / 113);
  assert.equal(abandoned, -54);
  assert.deepEqual(replay(false).q, [0, 0, 0]);
  assert.deepEqual(replay(true).q, [0, 29.5, 0]);
  assert.deepEqual(replay(true).next, [70, 62]);
  assert.deepEqual(
    Object.values(targets).map((n) => +n.toFixed(1)),
    [41, 59, 51.8, 59, -18, 54],
  );
  assert.deepEqual(explorationLedger(8).counts, [1, 6, 1]);
  assert.deepEqual([explorationEpisodes[1].action, explorationEpisodes[4].action], [2, 0]);
  assert.deepEqual(
    [0, 0.5, 10].map((b) => coin(b).variance),
    [0.0625, 0, 22.5625],
  );
  assert.deepEqual(
    [0, 0.5, 10].map((b) => coin(b).mean),
    [0.25, 0.25, 0.25],
  );
  assert.equal(gamma * coin(0).mean, 0.225);
  assert.deepEqual(openingPolicyValues, [-120, risk(25).mean, 54]);
  assert.equal(openingBaseline, -11.75);
  assert.equal(openingGradient[2], (54 - openingBaseline) / 3);
  assert.deepEqual(
    updatedPolicy.map((v) => v.toFixed(3)),
    ['0.089', '0.403', '0.508'],
  );
  assert.equal(clipScore(1.4), 1.2);
  assert.deepEqual(
    group([0, 1, 2]).weights.map((v) => +v.toFixed(3)),
    [-1.225, 0, 1.225],
  );
  assert.deepEqual(group([1, 1, 1]).weights, [0, 0, 0]);
  assert.deepEqual(ratios, [1.6, 1.2]);
  assert.equal(pathWeight, 1.92);
  assert.equal(avg(riskAware), 62);
  const proposed = actionNames[speed.indexOf(Math.max(...speed))];
  assert.deepEqual(
    [proposed, gate(proposed, false), gate(proposed, true)],
    ['Approve', 'Review', 'Approve'],
  );
}
