import { cueDone } from '../construction.mjs';
import { chapterText, equation, focusTargets, footer } from '../defaults.mjs';
export function drawMetricClaims(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'The same 14 additional successes · two denominators',
        960,
        295,
        32,
        themeColors.blue,
        'center',
      );
      focusTargets(ctx, api, ['metric-points'], () => {
        equation(ctx, api, String.raw`\frac{162-148}{200}\times100`, 545, 515, 53);
        chapterText(
          ctx,
          api,
          cueDone(state, 'metric-points', 0, 0.25)
            ? '= 7 percentage points'
            : 'percentage-point change?',
          545,
          660,
          34,
          themeColors.yellow,
          'center',
        );
      });
      focusTargets(ctx, api, ['metric-relative'], () => {
        equation(ctx, api, String.raw`\frac{162-148}{148}\times100`, 1420, 515, 53);
        chapterText(
          ctx,
          api,
          cueDone(state, 'metric-relative', 0, 0.55)
            ? '≈ 9.5% relative improvement'
            : 'relative change?',
          1420,
          660,
          34,
          themeColors.cyan,
          'center',
        );
      });
      chapterText(
        ctx,
        api,
        '8 query regressions remain in the same paired table',
        960,
        875,
        32,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      focusTargets(ctx, api, ['metric-count'], () => {
        equation(ctx, api, String.raw`\frac{5-1}{5}\times100`, 545, 505, 52);
        chapterText(
          ctx,
          api,
          cueDone(state, 'metric-count', 1, 0.2) ? '80% fewer incidents' : 'count reduction?',
          545,
          650,
          35,
          themeColors.yellow,
          'center',
        );
      });
      focusTargets(ctx, api, ['metric-rate'], () => {
        chapterText(
          ctx,
          api,
          '5 / 5,000,000 → 1 / 500,000',
          1400,
          490,
          31,
          themeColors.blue,
          'center',
        );
        chapterText(
          ctx,
          api,
          cueDone(state, 'metric-rate', 1, 0.5)
            ? '1 → 2 incidents / million'
            : 'exposure-adjusted rate?',
          1400,
          650,
          34,
          themeColors.pink,
          'center',
        );
      });
      chapterText(
        ctx,
        api,
        'Different windows and exposures · cause remains unresolved',
        960,
        875,
        30,
        themeColors.muted,
        'center',
      );
    } else {
      const x = 300,
        w = 1300,
        scale = w / 1000;
      chapterText(
        ctx,
        api,
        'Successful-request latency population',
        960,
        295,
        32,
        themeColors.blue,
        'center',
      );
      [720, 680].forEach((v, i) => {
        api.rect(
          ctx,
          x,
          430 + i * 190,
          v * scale,
          60,
          i ? themeColors.green : themeColors.blue,
          undefined,
          0,
        );
        chapterText(
          ctx,
          api,
          `${v} ms`,
          x + (v * scale) / 2,
          470 + i * 190,
          32,
          themeColors.ink,
          'center',
        );
      });
      api.line(ctx, x + 800 * scale, 390, x + 800 * scale, 740, themeColors.yellow, 3);
      chapterText(
        ctx,
        api,
        '800 ms target',
        x + 800 * scale,
        800,
        28,
        themeColors.yellow,
        'center',
      );
      focusTargets(ctx, api, ['metric-latency'], () =>
        chapterText(
          ctx,
          api,
          cueDone(state, 'metric-latency', 2, 0.3)
            ? '40 / 720 ≈ 5.6% lower p95'
            : '40 ms lower p95',
          960,
          915,
          34,
          themeColors.yellow,
          'center',
        ),
      );
    }
    footer(ctx, api, 'Units, population and measurement window determine the supported claim');
  }
}
export default {
  id: 'metric-claims',
  draw: drawMetricClaims,
  cues: ['metric-points', 'metric-relative', 'metric-count', 'metric-rate', 'metric-latency'],
};
