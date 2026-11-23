import { detailText, heading, line, phraseProgress, tile } from '../defaults.mjs';
export function drawRisk(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat < 2)
      heading(
        ctx,
        api,
        currentBeat === 0
          ? 'Loss on four training requests'
          : 'Same fitted rule · a hypothetical mix of future requests',
      );
    if (currentBeat === 0) {
      [0, 0, 0, 1].forEach((v, i) => {
        tile(ctx, api, v, 250 + i * 380, 460, 320, 120, themeColors.blue);
      });
      detailText(
        ctx,
        api,
        'Empirical risk: sum the observed training losses, then divide by n',
        960,
        860,
        34,
        themeColors.blue,
        'center',
      );
    }
    if (currentBeat === 1) {
      [0, 0, 0, 1].forEach((v, i) =>
        tile(ctx, api, v, 250 + i * 380, 360, 320, 85, themeColors.blue),
      );
      detailText(
        ctx,
        api,
        'Training mean = (0 + 0 + 0 + 1) / 4 = 0.25',
        960,
        590,
        39,
        themeColors.blue,
        'center',
      );
      tile(ctx, api, 'P = 0.75 · loss 0', 330, 700, 540, 100, themeColors.cyan);
      tile(ctx, api, 'P = 0.25 · loss 2', 1030, 700, 540, 100, themeColors.pink);
      const weighted = phraseProgress(state, api, 'weighted-loss', 1, 0.49, 0.56) === 1;
      api.focus.target('population-loss', () =>
        detailText(
          ctx,
          api,
          'Population risk = 0.75 × 0 + 0.25 × 2 = ' + (weighted ? '0.50' : '?'),
          960,
          925,
          39,
          themeColors.yellow,
          'center',
        ),
      );
      const gap = phraseProgress(state, api, 'risk-gap', 1, 0.65, 0.78);
      if (gap > 0)
        api.focus.target('gap', () =>
          detailText(
            ctx,
            api,
            'Generalization gap = 0.50 − 0.25 = ' + (gap === 1 ? '0.25' : '?'),
            960,
            1020,
            35,
            themeColors.green,
            'center',
          ),
        );
    }
    if (currentBeat === 2) {
      const ys = Array.from(
        {
          length: 5,
        },
        (_, k) => {
          const fitted = k > 2 ? 1 : 0,
            risk = fitted ? 0.75 : 0.25,
            trainingLoss = Math.min(k / 4, 1 - k / 4);
          return risk - trainingLoss;
        },
      );
      heading(ctx, api, 'Four independent draws · probability of a positive = 0.25');
      line(ctx, api, 300, 670, 1650, 670, themeColors.muted, 3);
      detailText(ctx, api, 'Gap', 216, 680, 35, themeColors.muted, 'center');
      ys.forEach((v, i) => {
        const x = 400 + i * 250,
          y = 670 - v * 400;
        line(ctx, api, x, 670, x, y, v >= 0 ? themeColors.blue : themeColors.pink, 5);
        api.circle(ctx, x, y, 10, v >= 0 ? themeColors.blue : themeColors.pink);
        detailText(
          ctx,
          api,
          v.toFixed(2).replace('-', '−'),
          x,
          y + (v < 0 ? 47 : -25),
          35,
          v < 0 ? themeColors.pink : themeColors.blue,
          'center',
        );
        detailText(ctx, api, i, x, 900, 40, themeColors.ink, 'center');
      });
      detailText(
        ctx,
        api,
        'Positive cases in the training sample',
        960,
        977,
        37,
        themeColors.ink,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'risk',
  draw: drawRisk,
  cues: ['weighted-loss', 'risk-gap'],
};
