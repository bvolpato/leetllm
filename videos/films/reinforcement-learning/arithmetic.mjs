import {
  explorationActions,
  explorationEpsilon,
  explorationQ,
  gamma,
  returns,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function epsilonDecision(u, v, epsilon = explorationEpsilon) {
  const greedy = explorationQ.indexOf(Math.max(...explorationQ));
  const explore = u < epsilon;
  const action = explore
    ? Math.min(explorationActions.length - 1, Math.floor(v * explorationActions.length))
    : greedy;
  assert(Number.isFinite(u) && u >= 0 && u < 1);
  if (explore) assert(Number.isFinite(v) && v >= 0 && v < 1);
  return {
    u,
    v: explore ? v : null,
    explore,
    action,
    name: explorationActions[action],
  };
}
export const evidenceValue = (probability) =>
  (1 - probability) * returns.evidence + probability * -54;
export const reviewValue = returns.review;
export const indifferenceProbability = (returns.evidence - reviewValue) / (returns.evidence + 54);
export function openingActions(values) {
  return {
    approve: -120 + gamma * values.closed,
    evidence: -4 + gamma * values.evidence_ready,
    review: -18 + gamma * values.review_queue,
  };
}
export const unit = (value) => Math.max(0, Math.min(1, value));
