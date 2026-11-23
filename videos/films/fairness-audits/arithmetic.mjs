import { THRESHOLD } from './fixtures.mjs';
export function route(score, threshold = THRESHOLD) {
  return score >= threshold ? 'auto_serve' : 'human_review';
}
export function wilson(successes, total, z = 1.96) {
  const p = successes / total,
    z2 = z * z,
    denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total ** 2))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}
export const toyRoutingScore = (conversational, stylePenalty = 0.11) =>
  0.78 - (conversational ? stylePenalty : 0);
