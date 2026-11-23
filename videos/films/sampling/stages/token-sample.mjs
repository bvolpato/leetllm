import { tokenProbabilities } from '../arithmetic.mjs';
import { cueStep } from '../construction.mjs';

const tokens = ['blue', 'clear', 'cloudy', 'green'];
const logits = [2.2, 1.5, 0.2, -1.5];
const probability = tokenProbabilities();
const draw = 0.6229016948897019; // First uniform from the article's Python Random(5).
const cumulative = probability.map((_, i) =>
  probability.slice(0, i + 1).reduce((a, b) => a + b, 0),
);
const winner = cumulative.findIndex((end) => draw < end);
const x = (u) => 241 + 1430 * u;

export function drawTokenSample(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.cyan, C.yellow, C.pink];
  const shift = cueStep(state, 'sp-token-sample-0', 0, 0.3, 0.52);
  const mass = cueStep(state, 'token-share', 0, 0.62, 0.91);
  const marker = cueStep(state, 'token-draw', 1, 0.38, 0.61);
  const reveal = cueStep(state, 'sp-token-sample-1', 2, 0.08, 0.38);
  api.focus.target('sp-token-sample-visual', () => {
    api.text(
      ctx,
      '“The sky is ' + (reveal === 1 ? tokens[winner] : '…') + '”',
      960,
      266,
      52,
      C.ink,
      'center',
    );
    tokens.forEach((token, i) => {
      const center = 370 + 390 * i;
      api.text(ctx, token, center, 406, 45, colors[i], 'center');
      api.text(ctx, String(logits[i]), center, 483, 33, C.ink, 'center');
      if (shift === 1)
        api.text(
          ctx,
          (logits[i] - Math.max(...logits)).toFixed(1),
          center,
          558,
          33,
          C.ink,
          'center',
        );
      if (mass === 1)
        api.text(ctx, probability[i].toFixed(3), center, 638, 36, colors[i], 'center');
    });
    api.text(ctx, 'logit', 118, 483, 28, C.muted);
    if (shift === 1) api.text(ctx, 'shifted', 118, 558, 28, C.muted);
    if (mass === 1) api.text(ctx, 'share', 118, 638, 28, C.muted);
    api.line(ctx, x(0), 776, x(1), 776, C.muted, 3);
    let low = 0;
    cumulative.forEach((high, i) => {
      const end = Math.min(high, mass);
      if (end > low) api.rect(ctx, x(low), 736, x(end) - x(low), 81, colors[i], null, 0);
      low = high;
    });
    api.text(ctx, '0', x(0), 874, 32, C.muted, 'center');
    api.text(ctx, '1', x(1), 874, 32, C.muted, 'center');
    if (marker > 0) {
      const at = x(draw);
      api.line(ctx, at, 912 - 95 * marker, at, 923, C.ink, 4);
      api.text(ctx, 'draw  ' + draw.toFixed(3), at, 987, 37, C.ink, 'center');
    }
  });
}

export default {
  id: 'token-sample',
  draw: drawTokenSample,
  cues: ['sp-token-sample-0', 'token-share', 'token-draw', 'sp-token-sample-1'],
};
