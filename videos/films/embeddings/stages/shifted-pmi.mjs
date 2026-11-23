import { event } from '../construction.mjs';
import { countRepresentation } from '../model.mjs';
import { centeredText, footer } from '../defaults.mjs';
export function drawShiftedPmi(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('shifted-pmi-mechanism', () => {
    const m = countRepresentation(),
      pmi = m.ppmi[0][0],
      k = currentBeat === 0 ? 1 + 3 * ev('pmi-optimum', 0) : 4,
      expectedNoise = m.expected[0][0] * k,
      target = pmi - Math.log(k);
    centeredText(
      ctx,
      api,
      'Observed apple–fruit pair · context-frequency noise',
      960,
      290,
      34,
      themeColors.ink,
    );
    const xs = [400, 960, 1520],
      heights = [8, expectedNoise, 8];
    centeredText(ctx, api, 'positive events', xs[0], 430, 31, themeColors.cyan);
    centeredText(ctx, api, 'expected negative exposure', xs[1], 430, 30, themeColors.pink);
    centeredText(ctx, api, 'unconstrained score', xs[2], 430, 30, themeColors.yellow);
    [0, 1].forEach((i) => {
      const val = heights[i],
        h = (val / 18) * 280;
      api.rect(ctx, xs[i] - 90, 810 - h, 180, h, i ? themeColors.pink : themeColors.cyan);
      centeredText(ctx, api, fmt(val), xs[i], 880, 37, i ? themeColors.pink : themeColors.cyan);
    });
    centeredText(ctx, api, 'k = ' + fmt(k), 960, 350, 32, themeColors.pink);
    centeredText(ctx, api, 'PMI − ln(k)', 1520, 560, 39, themeColors.yellow);
    centeredText(ctx, api, fmt(target), 1520, 700, 54, themeColors.green);
    if (currentBeat === 1 && ev('pmi-absent', 1) > 0) {
      centeredText(
        ctx,
        api,
        'new pair: observed 0 · positive noise probability',
        960,
        955,
        30,
        themeColors.pink,
      );
      centeredText(ctx, api, 'target → −∞', 1520, 820, 39, themeColors.pink);
    }
    if (currentBeat === 2) {
      centeredText(ctx, api, 'positive pressure ↑', 420, 955, 30, themeColors.cyan);
      centeredText(ctx, api, 'noise pressure ↓', 1010, 955, 30, themeColors.pink);
      centeredText(ctx, api, 'finite width couples pair scores', 1510, 955, 27, themeColors.muted);
    }
    footer(
      ctx,
      api,
      'The identity assumes unconstrained observed-pair scores and context-frequency noise; original 0.75 noise differs',
    );
  });
}
export default {
  id: 'shifted-pmi',
  draw: drawShiftedPmi,
  cues: ['emb-pmi-optimum', 'emb-pmi-absent', 'emb-pmi-capacity', 'emb-pmi-pressure'],
};
