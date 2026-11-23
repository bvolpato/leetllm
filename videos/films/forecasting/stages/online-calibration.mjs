import { alphaUpdate } from '../arithmetic.mjs';
import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, dot, extensionText } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawOnlineCalibration(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-online-calibration-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) =>
    forecastCueProgress(state, `fc-${'online-calibration'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
  api.focus.target('fc-online-calibration-mechanism', () => {
    box(ctx, api, 'Issued interval · α = 0.10', 220, 410, 620, themeColors.blue, 31, 150);
    box(ctx, api, 'Next interval · pending', 1080, 410, 620, themeColors.muted, 31, 150);
    const p = cueProgress('observed');
    dot(ctx, api, lerp(400, 950, p), 650, themeColors.pink, 13);
    extensionText(ctx, api, 'Outcome arrives later', 600, 730, 31, themeColors.pink);
    if (done('miss')) box(ctx, api, 'miss = 1', 760, 785, 390, themeColors.pink, 32);
    if (cueProgress('update') > 0) {
      const a = alphaUpdate(0.1, 0.1, 0.05, 1);
      extensionText(ctx, api, '0.10 + 0.05 × (0.10 − 1)', 1375, 660, 31, themeColors.yellow);
      if (done('update')) {
        extensionText(ctx, api, `α next = ${a.toFixed(3)}`, 1390, 725, 37, themeColors.yellow);
        extensionText(ctx, api, 'quantile level 1−α = 0.945', 1390, 850, 28, themeColors.yellow);
      }
    }
    if (done('wait'))
      extensionText(
        ctx,
        api,
        'Use the new level at the next available forecast origin.',
        960,
        345,
        27,
        themeColors.muted,
      );
    caption(
      ctx,
      api,
      done('extremes')
        ? 'Track both long-run coverage and interval width.'
        : 'The arriving count updates the level for a future forecast.',
    );
  });
  return;
}
export default {
  id: 'online-calibration',
  draw: drawOnlineCalibration,
  cues: [
    'fc-online-calibration-observed',
    'fc-online-calibration-miss',
    'fc-online-calibration-update',
    'fc-online-calibration-wait',
    'fc-online-calibration-extremes',
  ],
};
