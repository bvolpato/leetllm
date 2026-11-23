import { drawBill } from './lifetime-equation.mjs';
import { spoken } from '../cue.mjs';
import { text } from '../defaults.mjs';

export function drawLifetime(ctx, scene, state, api) {
  const compact = spoken(scene, state, 'life-compact').phase !== 'before';
  drawBill(ctx, api, 0, false, compact ? 2 : 1);
  const rates = spoken(scene, state, 'life-rates').phase !== 'before';
  const caption = rates
    ? 'Serving one token   ·   70B model: 140B FLOPs   ·   30B model: 60B FLOPs'
    : 'Before the first request, all the work so far is training.';
  text(ctx, api, caption, 960, 1001, 34, api.C.yellow, 'center');
}

export default {
  id: 'lifetime',
  draw: drawLifetime,
  cues: ['life-training', 'life-compact', 'life-rates'],
};
