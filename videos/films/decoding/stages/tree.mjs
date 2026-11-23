import { dogTree } from '../dog-tree.mjs';
import { treeDistribution } from '../model.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawTree(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { conditionals } = treeDistribution(state, state.beatP);
  // Quantize the moving edge once so the displayed factors yield the displayed products.
  const outside = Math.round(conditionals[2] * 100);
  const values = [0.3, (70 - outside) / 100, outside / 100, 0.9, 0.1];
  const home = heard(state, 'tree-home', 0, 0.36);
  const soundly = heard(state, 'tree-soundly', 0, 0.76);
  const originalWinner = heard(state, 'tree-original-winner', 0, 0.94);
  const complete = beat > 0;
  const expanded = complete ? (outside ? [0, 1, 2, 3, 4] : [0, 1, 3, 4]) : [1, 3];
  const winner = heard(state, 'tree-split-winner', 2, 0.94);
  const question = movement(state, 'tree-split-question', 1, 0.5, 0.9) > 0;
  dogTree(ctx, api, {
    values,
    expanded,
    scores: complete ? expanded : [home && 1, soundly && 3].filter(Number.isInteger),
    selected: winner ? [3] : beat < 2 && originalWinner ? [1] : [],
    note:
      beat === 0 || (beat === 1 && !question)
        ? 'Two words, then stop.'
        : beat === 1
          ? 'Split the home share equally with outside. Which pair will lead?'
          : winner
            ? 'slept soundly     0.360'
            : 'Only the split after ran is changing.',
  });
}
export default {
  id: 'tree',
  draw: drawTree,
  cues: [
    'tree-home',
    'tree-soundly',
    'tree-original-winner',
    'tree-split-question',
    'tree-b3-1',
    'tree-branch-spread',
    'tree-final-path-product',
    'tree-split-winner',
  ],
};
