import { FORECAST_CUE_AT, intervalErrors } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { caption, extensionText, rectangle } from '../defaults.mjs';
export function drawNormalErrorScale(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-normal-error-scale-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) =>
    forecastCueProgress(state, `fc-${'normal-error-scale'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-normal-error-scale-mechanism', () => {
    const base = 510,
      dx = 100;
    intervalErrors.forEach((v, i) => {
      const x = 260 + i * dx;
      rectangle(
        ctx,
        api,
        x - 26,
        Math.min(base, base - v * 35),
        52,
        Math.max(2, Math.abs(v) * 35),
        v < 0 ? themeColors.pink : themeColors.blue,
        v < 0 ? themeColors.pink : themeColors.blue,
      );
      extensionText(ctx, api, v, x, 665, 27);
      if (cueProgress('squares') > 0) {
        const side = Math.abs(v) * 25 * cueProgress('squares');
        rectangle(ctx, api, x - side / 2, 740, side, side, themeColors.yellow, themeColors.yellow);
      }
    });
    extensionText(ctx, api, 'Fourteen signed calibration errors', 960, 335, 32, themeColors.muted);
    if (done('mean'))
      extensionText(ctx, api, 'sum 7 / 14 = mean 0.5', 960, 395, 31, themeColors.cyan);
    if (done('squares'))
      extensionText(ctx, api, 'Squared errors sum to 43', 960, 900, 31, themeColors.yellow);
    if (done('rms'))
      extensionText(ctx, api, 'RMS = √(43/14) ≈ 1.75', 960, 705, 33, themeColors.yellow);
    caption(
      ctx,
      api,
      done('width')
        ? 'Zero-mean normal approximation: 1.96 × RMS ≈ 3.4; empirical half-width 3. Both flag +28.'
        : 'RMS includes bias; a normal interval needs a suitable error model.',
    );
  });
  return;
}
export default {
  id: 'normal-error-scale',
  draw: drawNormalErrorScale,
  cues: [
    'fc-normal-error-scale-errors',
    'fc-normal-error-scale-mean',
    'fc-normal-error-scale-squares',
    'fc-normal-error-scale-rms',
    'fc-normal-error-scale-width',
  ],
};
