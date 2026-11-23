import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { seasonalDescription } from '../model.mjs';
import { caption, extensionText, rectangle } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawProportionalSeasonality(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-proportional-seasonality-')))
    return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) =>
    forecastCueProgress(state, `fc-${'proportional-seasonality'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
  api.focus.target('fc-proportional-seasonality-mechanism', () => {
    const level = lerp(105, 120, cueProgress('level')),
      desc = seasonalDescription(level),
      scale = 3,
      base = 840;
    const vals = [
      level,
      done('additive') ? desc.additive : 132,
      done('proportional') ? desc.proportional : 132,
    ];
    ['Reference level', 'Additive Friday', 'Proportional Friday'].forEach((name, i) => {
      const x = 340 + i * 540,
        v = vals[i];
      rectangle(
        ctx,
        api,
        x,
        base - v * scale,
        240,
        v * scale,
        [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
      );
      extensionText(ctx, api, name, x + 120, 890, 29);
      extensionText(
        ctx,
        api,
        v.toFixed(i === 2 && done('proportional') ? 3 : 0),
        x + 120,
        base - v * scale - 28,
        34,
        [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
      );
    });
    if (done('additive'))
      extensionText(ctx, api, '120 + 27 = 147', 1000, 330, 29, themeColors.cyan);
    if (done('proportional'))
      extensionText(ctx, api, '120 × (132 / 105) = 150.857', 1470, 315, 28, themeColors.yellow);
    caption(
      ctx,
      api,
      done('logs')
        ? 'For positive values: log(level × factor) = log(level) + log(factor).'
        : 'Both descriptions reproduce Friday 132 at level 105. Change the level to distinguish them.',
    );
  });
  return;
}
export default {
  id: 'proportional-seasonality',
  draw: drawProportionalSeasonality,
  cues: [
    'fc-proportional-seasonality-same',
    'fc-proportional-seasonality-level',
    'fc-proportional-seasonality-additive',
    'fc-proportional-seasonality-proportional',
    'fc-proportional-seasonality-logs',
  ],
};
