import { dogTree } from '../dog-tree.mjs';
import { heard } from '../spoken.mjs';

export function drawGreedy(ctx, scene, state, api) {
  const committed = heard(state, 'greedy-commit', 0, 0.48);
  const tied = heard(state, 'greedy-tie', 0, 0.8);
  const picked = heard(state, 'greedy-pick', 1, 0.38);
  const expanded = committed ? [0, 1, 2] : [0, 1, 2, 3, 4];
  dogTree(ctx, api, {
    expanded,
    scores: expanded,
    pruned: committed ? [1] : [],
    kept: committed ? [0] : [],
    selected: picked ? [1] : tied ? [1, 2] : [],
    note: picked
      ? 'The dog ran home'
      : tied
        ? 'Tie order: home before outside'
        : committed
          ? 'The dog ran …'
          : 'Choose one token at a time.',
  });
}
export default {
  id: 'greedy',
  draw: drawGreedy,
  cues: ['greedy-commit', 'greedy-tie', 'greedy-pick'],
};
