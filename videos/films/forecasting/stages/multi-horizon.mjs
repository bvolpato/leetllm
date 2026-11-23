import { within } from '../arithmetic.mjs';
import { FORECAST_CUE_AT, weeklyLagForecast } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, extensionText, line, mini } from '../defaults.mjs';
export function drawMultiHorizon(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-multi-horizon-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'multi-horizon'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-multi-horizon-mechanism', () => {
    const recursive = cueProgress('recursive'),
      direct = cueProgress('direct'),
      steps = Math.min(7, Math.floor(recursive * 7));
    extensionText(ctx, api, 'Origin-valid observed history', 960, 320, 31, themeColors.blue);
    weeklyLagForecast.forEach((v, i) => mini(ctx, api, v, 260 + i * 200, 370, themeColors.blue));
    if (currentBeat === 0) {
      extensionText(
        ctx,
        api,
        'Recursive state: a prediction becomes a subsequent input',
        960,
        520,
        31,
        themeColors.yellow,
      );
      for (let i = 0; i < 7; i++) {
        const x = 260 + i * 200;
        box(
          ctx,
          api,
          i < steps ? 'ŷ' + (i + 1) : 'pending',
          x,
          630,
          140,
          i < steps ? themeColors.yellow : themeColors.muted,
          27,
        );
        if (i < steps - 1) line(ctx, api, x + 150, 665, x + 190, 665, themeColors.yellow, 4);
      }
      if (steps > 0) {
        const x = 260 + (steps - 1) * 200;
        extensionText(ctx, api, 'next input ← ŷ' + steps, x + 70, 810, 27, themeColors.yellow);
      }
      caption(ctx, api, 'Tuesday uses the value the model predicted for Monday.');
    } else {
      extensionText(
        ctx,
        api,
        'Direct horizon models read the original known history',
        960,
        270,
        31,
        themeColors.cyan,
      );
      if (direct > 0) {
        line(ctx, api, 320, 470, 1530, 470, themeColors.cyan, 3);
        for (let i = 0; i < 7; i++)
          line(ctx, api, 320 + i * 200, 445, 320 + i * 200, 470, themeColors.cyan, 3);
      }
      for (let i = 0; i < 7; i++) {
        const x = 260 + i * 200,
          q = within(direct * 7 - i);
        if (q > 0) {
          line(ctx, api, x + 70, 470, x + 70, 560, themeColors.cyan, 3);
          box(ctx, api, 'f' + (i + 1) + '(history)', x - 20, 580, 180, themeColors.cyan, 22);
          extensionText(ctx, api, 'ŷ' + (i + 1), x + 70, 730, 30, themeColors.cyan);
        }
      }
      if (done('fixed'))
        extensionText(
          ctx,
          api,
          'Fixed-origin week keeps future actuals closed',
          960,
          810,
          29,
          themeColors.yellow,
        );
      if (done('daily'))
        box(
          ctx,
          api,
          'A new daily origin can admit a newly finalized count',
          400,
          865,
          1120,
          themeColors.green,
          28,
        );
      if (currentBeat === 1)
        caption(
          ctx,
          api,
          'Each horizon gets its forecast from the observations available on Sunday.',
        );
    }
  });
  return;
}
export default {
  id: 'multi-horizon',
  draw: drawMultiHorizon,
  cues: [
    'fc-multi-horizon-recursive',
    'fc-multi-horizon-direct',
    'fc-multi-horizon-fixed',
    'fc-multi-horizon-daily',
  ],
};
