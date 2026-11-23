import { FORECAST_CUE_AT, FORECAST_ROWS } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, extensionText, line, mini, rectangle } from '../defaults.mjs';
export function drawFoundationGenerations(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-foundation-generations-')))
    return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) =>
    forecastCueProgress(state, `fc-${'foundation-generations'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-foundation-generations-mechanism', () => {
    const values = FORECAST_ROWS.slice(0, 7).map((r) => r.volume),
      mean = 105,
      norm = values.map((v) => v / mean);
    extensionText(ctx, api, 'First week of batch jobs', 960, 310, 29, themeColors.muted);
    values.forEach((v, i) =>
      mini(ctx, api, done('scale') ? norm[i].toFixed(2) : v, 260 + i * 200, 370, themeColors.blue),
    );
    if (currentBeat === 0) {
      const q = cueProgress('bins');
      norm.forEach((v, i) => {
        if (q > i / 7) {
          const bin = v < 0.8 ? 0 : v < 1 ? 1 : v < 1.2 ? 2 : 3;
          box(ctx, api, 'bin ' + bin, 260 + i * 200, 570, 120, themeColors.cyan, 26);
          line(ctx, api, 320 + i * 200, 450, 320 + i * 200, 550, themeColors.cyan, 3);
        }
      });
      extensionText(
        ctx,
        api,
        'Illustrative uniform edges: 0.8, 1.0, 1.2',
        960,
        760,
        31,
        themeColors.cyan,
      );
      caption(ctx, api, 'Original Chronos samples the next bin one step at a time.');
    } else {
      const q = cueProgress('continuous');
      for (let i = 0; i < 3; i++) {
        const x = 210 + i * 550;
        if (q > i / 3) {
          rectangle(ctx, api, x, 540, 500, 100, themeColors.blue);
          extensionText(
            ctx,
            api,
            norm
              .slice(i * 2, i * 2 + 3)
              .map((v) => v.toFixed(2))
              .join('  '),
            x + 250,
            600,
            30,
            themeColors.blue,
          );
        }
      }
      extensionText(
        ctx,
        api,
        'Chronos-2 · continuous patches (illustrative grouping)',
        960,
        490,
        29,
        themeColors.blue,
      );
      if (done('timesfm')) {
        extensionText(
          ctx,
          api,
          'TimesFM-3 · masked future patches',
          960,
          725,
          30,
          themeColors.yellow,
        );
        for (let i = 0; i < 3; i++)
          box(ctx, api, 'masked', 400 + i * 400, 755, 310, themeColors.muted, 26);
      }
      if (done('quantiles')) {
        for (let i = 0; i < 9; i++) {
          box(ctx, api, 'P' + (i + 1) * 10, 230 + i * 165, 865, 140, themeColors.yellow, 25, 62);
        }
      }
      caption(
        ctx,
        api,
        done('not99')
          ? 'Highest reported quantile here   ·   P90'
          : done('timesfm')
            ? 'Each masked patch represents a future part of the series.'
            : 'Chronos-2 reads continuous values in patches.',
      );
    }
  });
  return;
}
export default {
  id: 'foundation-generations',
  draw: drawFoundationGenerations,
  cues: [
    'fc-foundation-generations-scale',
    'fc-foundation-generations-bins',
    'fc-foundation-generations-continuous',
    'fc-foundation-generations-timesfm',
    'fc-foundation-generations-quantiles',
    'fc-foundation-generations-not99',
  ],
};
