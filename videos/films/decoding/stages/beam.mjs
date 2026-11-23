import { dogTree } from '../dog-tree.mjs';
import { heard } from '../spoken.mjs';

export function drawBeam(ctx, scene, state, api) {
  const both = heard(state, 'beam-keep', 0, 0.4);
  const expand = heard(state, 'beam-expand', 0, 0.72);
  const scored = heard(state, 'beam-products', 1, 0.25);
  const kept = heard(state, 'beam-frontier', 1, 0.6);
  const all = expand ? [0, 1, 2, 3, 4] : [];
  dogTree(ctx, api, {
    expanded: all,
    scores: scored ? all : [],
    kept: both ? [0, 1] : [],
    cover: !expand,
    selected: kept ? [3, 1] : [],
    note: kept
      ? 'Width 2 keeps slept soundly and ran home.'
      : expand
        ? 'Which two paths earn a place?'
        : 'Two places for first words.',
  });
}
export default {
  id: 'beam',
  draw: drawBeam,
  cues: ['beam-keep', 'beam-expand', 'beam-products', 'beam-frontier'],
};
