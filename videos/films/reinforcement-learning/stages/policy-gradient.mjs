import { openingPolicyValues, updatedPolicy } from '../fixtures.mjs';
import { equation, line, rectangle, text } from '../defaults.mjs';
export function drawPolicyGradient(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Same mean gradient; different variance',
        960,
        290,
        40,
        themeColors.yellow,
        'center',
      );
      [0, 0.5, 10].forEach((baseline, i) => {
        const grads = [0, 1].map((a) => (a - 0.5) * (a - baseline)),
          mean = (grads[0] + grads[1]) / 2,
          variance = grads.reduce((sum, g) => sum + (g - mean) ** 2, 0) / 2,
          x = 350 + i * 600;
        text(ctx, api, `baseline ${baseline}`, x, 400, 37, themeColors.muted, 'center');
        text(ctx, api, `mean ${mean.toFixed(2)}`, x, 505, 41, themeColors.green, 'center');
        line(ctx, api, x, 620, x, 620 + Math.min(230, variance * 10), themeColors.pink, 20);
        text(ctx, api, `variance ${variance.toFixed(4)}`, x, 945, 32, themeColors.pink, 'center');
      });
    } else {
      const q = currentBeat === 3 ? step(3) : 0,
        probs = updatedPolicy.map((x) => 1 / 3 + (x - 1 / 3) * q),
        colors = [themeColors.pink, themeColors.green, themeColors.cyan],
        names = ['approval', 'evidence', 'review'];
      text(
        ctx,
        api,
        currentBeat === 1
          ? 'Discount from the episode start: 0.9 × 0.25 = 0.225'
          : 'Same opening actions; probabilities move toward useful return',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      let x = 190;
      probs.forEach((prob, i) => {
        const w = 1540 * prob;
        rectangle(ctx, api, x, 460, w - 8, 170, colors[i], colors[i]);
        text(ctx, api, names[i], x + w / 2, 415, 34, colors[i], 'center');
        text(ctx, api, prob.toFixed(3), x + w / 2, 560, 45, themeColors.bg, 'center');
        text(ctx, api, `Q ${openingPolicyValues[i]}`, x + w / 2, 720, 35, colors[i], 'center');
        x += w;
      });
      equation(
        ctx,
        api,
        String.raw`\nabla J=\mathbb E\!\left[\sum_t\gamma^t\nabla\log\pi(A_t\mid S_t)G_t\right]`,
        960,
        945,
        45,
        themeColors.yellow,
      );
    }
  };
  if (api.focus) api.focus.target('policy-gradient-construction', body);
  else body();
}
export default {
  id: 'policy-gradient',
  draw: drawPolicyGradient,
  cues: [
    'policy-gradient-voice-1',
    'policy-gradient-voice-2',
    'policy-gradient-voice-3',
    'policy-gradient-voice-4',
  ],
};
