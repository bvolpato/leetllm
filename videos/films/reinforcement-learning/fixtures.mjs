import assert from 'node:assert/strict';
export const gamma = 0.9;
export const returns = {
  approve: -120,
  evidence: -4 + gamma * 70,
  review: -18 + gamma * 80,
  evidenceReadyHuman: -10 + gamma * 80,
};
export const explorationEpsilon = 0.2;
export const explorationActions = Object.freeze([
  'auto approve',
  'request evidence',
  'human review',
]);
export const explorationQ = Object.freeze([-120, 59, 54]);
export const explorationDraws = Object.freeze([
  {
    u: 0.71,
  },
  {
    u: 0.09,
    v: 0.91,
  },
  {
    u: 0.64,
  },
  {
    u: 0.87,
  },
  {
    u: 0.15,
    v: 0.08,
  },
  {
    u: 0.44,
  },
  {
    u: 0.95,
  },
  {
    u: 0.58,
  },
]);
export const abandonmentProbability = 0.25;
export const transitionSweepCrossoverProgress = 0.42;
export const mdpBefore = Object.freeze({
  request: 'REQ-10234',
  stage: 'new request',
  elapsedWait: 45,
});
export const mdpEvent = Object.freeze({
  id: 'E17',
  request: 'REQ-10234',
  outcome: 'evidence received',
  elapsed: 20,
});
export function createOpeningPolicyReference() {
  const openingPolicyValues = [-120, 30.75, 54];
  const policySoftmax = (xs) => {
    const peak = Math.max(...xs),
      e = xs.map((x) => Math.exp(x - peak)),
      z = e.reduce((a, b) => a + b);
    return e.map((x) => x / z);
  };
  const openingBaseline = openingPolicyValues.reduce((a, b) => a + b) / 3;
  const openingGradient = openingPolicyValues.map((x) => (x - openingBaseline) / 3);
  const updatedPolicy = policySoftmax(openingGradient.map((x) => 0.03 * x));
  assert.equal(openingBaseline, -11.75);
  assert.equal(updatedPolicy[2].toFixed(3), '0.508');
  assert.equal(-4 + 0.9 * 62, 51.800000000000004);
  assert.equal((0.8 / 0.5) * (0.6 / 0.5), 1.92);
  return {
    openingPolicyValues,
    openingBaseline,
    openingGradient,
    updatedPolicy,
  };
}
export const { openingPolicyValues, openingBaseline, openingGradient, updatedPolicy } =
  createOpeningPolicyReference();
