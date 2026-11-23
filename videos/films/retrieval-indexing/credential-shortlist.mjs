import { reciprocalFusion } from './vector-search.mjs';

export const sparse = ['d1', 'd4'];
export const dense = ['d2', 'd1', 'd4'];
export const passageNames = { d1: 'Rotation guide', d4: 'Quota page', d2: 'Credential guide' };
export const jointScores = { d1: 0.55, d4: 0.12, d2: 0.96 };

export const fused = (constant = 60) => reciprocalFusion([sparse, dense], constant);
export function reranked(depth) {
  return fused()
    .slice(0, depth)
    .map(([id]) => id)
    .sort((a, b) => jointScores[b] - jointScores[a]);
}
