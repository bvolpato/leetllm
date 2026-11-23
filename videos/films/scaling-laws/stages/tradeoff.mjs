import { comparePlans } from '../allocation-comparison.mjs';
import { spoken } from '../cue.mjs';

export function drawTradeoff(ctx, scene, state, api) {
  const move = spoken(scene, state, 'tradeoff-widen');
  const terms = spoken(scene, state, 'tradeoff-square-terms');
  const showSquare = terms.phase !== 'before';
  comparePlans(ctx, api, {
    n: 5 + 5 * api.ease(move.progress),
    b: 2,
    showSquare,
    totals: false,
    conclusion: showSquare
      ? 'Which shape has the lower fitted loss?'
      : 'Both proposals spend 100 units',
  });
}

export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: ['tradeoff-tall', 'tradeoff-widen', 'tradeoff-square-terms'],
};
