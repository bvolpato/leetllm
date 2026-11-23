import { cueMotion } from '../construction.mjs';
import { patches } from '../fixtures.mjs';
import { patchComparison } from '../patch-comparison.mjs';

export function drawProjectionRank(ctx, scene, state, api) {
  const across = state.beat >= 2;
  const motion = across ? cueMotion(state, 2, 'rank-across') : cueMotion(state, 0, 'rank-within');
  const answer = across ? state.beat >= 3 : state.beat >= 1;
  patchComparison(ctx, api, {
    original: patches[0],
    edited: across ? [1, 0, 4, 5] : [1, 1, 3, 5],
    motion,
    answer,
    question: answer
      ? across
        ? 'The contrast changes from 1 to 0.'
        : 'Change in the four pixels  [1, 0, −1, 0]     →     change in the token  [0, 0]'
      : 'Does the mean change, the contrast, both, or neither?',
  });
}
export default {
  id: 'projection-rank',
  draw: drawProjectionRank,
  cues: ['rank-within', 'rank-equal', 'rank-across', 'rank-contrast'],
};
