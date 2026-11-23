import { scalingEvent } from '../construction.mjs';
import { allocation, band, curve, plot, text } from '../defaults.mjs';
export function drawHistoricalFrontiers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-historical-frontiers-construction', () => {
    band(ctx, api, 'Kaplan 2020 · fitted regimes and growth multipliers have different meanings');
    if (currentBeat === 0) {
      const alphas = [0.076, 0.095, 0.05];
      alphas.forEach((a, i) => {
        const pl = plot(
          ctx,
          api,
          230 + i * 550,
          390,
          410,
          350,
          [0, 3],
          [-0.35, 0.03],
          'log₁₀ resource',
          'log₁₀ fitted loss',
        );
        curve(
          ctx,
          api,
          pl,
          (x) => -a * x,
          0,
          3,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          progress,
        );
        text(
          ctx,
          api,
          ['N only', 'D only', 'Minimum-compute frontier'][i],
          435 + i * 550,
          325,
          28,
          themeColors.ink,
          'center',
        );
        if (end)
          text(
            ctx,
            api,
            'Slope −' + a,
            435 + i * 550,
            850,
            31,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            'center',
          );
      });
    } else {
      const factor = currentBeat === 1 ? 10 ** (2 * progress) : 100,
        a = 0.73,
        n = factor ** a,
        d = factor ** (1 - a);
      allocation(ctx, api, n, d, 290, 790, 15, 31, 12, themeColors.blue);
      allocation(ctx, api, factor ** 0.5, factor ** 0.5, 1110, 790, 15, 31, 12, themeColors.green);
      text(ctx, api, 'Kaplan allocation', 520, 355, 32, themeColors.blue, 'center');
      text(ctx, api, 'Equal growth reference', 1340, 355, 32, themeColors.green, 'center');
      text(
        ctx,
        api,
        `Current compute multiplier ${factor.toFixed(1)}×`,
        960,
        870,
        32,
        themeColors.yellow,
        'center',
      );
      result(
        currentBeat === 1
          ? '100× compute → 28.84× parameters and 3.47× presentations'
          : '100× compute → 10× each under equal growth',
      );
    }
  });
}
export default {
  id: 'historical-frontiers',
  draw: drawHistoricalFrontiers,
  cues: ['sl-historical-frontiers-0', 'sl-historical-frontiers-1', 'sl-historical-frontiers-2'],
};
