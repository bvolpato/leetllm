import { classNames } from '../fixtures.mjs';
import { fixed } from '../arithmetic.mjs';
import { full } from '../model.mjs';
import { card, math, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintProbabilities(ctx, scene, state, api, C, c, t, s) {
  text(ctx, api, C, 'Ticket 1 · three possible destinations', 960, 280, 39, C.ink, 'center');
  const probs = s.probabilities;
  classNames.forEach((name, i) => {
    const x = 270 + i * 500,
      color = i === 0 ? C.yellow : i === 2 ? C.pink : C.cyan;
    target(ctx, api, 'class-scores', () => {
      card(ctx, api, C, c, name, x, 355, 380, 100, color, 42);
      math(ctx, api, C, `z=${fixed(full.logits[0][i])}`, x + 190, 525, 47, color);
    });
    if (s.probabilitiesReady) {
      target(ctx, api, 'probability-bars', () => {
        api.rect(ctx, x + 110, 800 - 240 * probs[i], 160, 240 * probs[i], color, color, 0, 8);
        text(ctx, api, C, (probs[i] * 100).toFixed(1) + '%', x + 190, 860, 44, color, 'center');
      });
    }
  });
  if (!s.lossReady)
    text(
      ctx,
      api,
      C,
      s.probabilitiesReady
        ? 'An almost even split · the model is uncertain'
        : 'What would these similar scores imply?',
      960,
      960,
      36,
      C.yellow,
      'center',
    );
  else
    target(ctx, api, 'ticket-loss', () => {
      math(
        ctx,
        api,
        C,
        `\\text{correct route: Billing}\\qquad L_1=-\\log p_{Billing}=${fixed(s.loss)}`,
        960,
        960,
        43,
        C.yellow,
      );
    });
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintProbabilities(ctx, scene, state, api, C, c, t, s);
}
export function drawProbabilitiesStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'probabilities',
  draw: drawProbabilitiesStage,
  cues: ['probability-bars', 'correct-route-loss'],
};
