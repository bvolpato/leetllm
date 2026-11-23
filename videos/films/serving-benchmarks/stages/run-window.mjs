import { SERVING_COHORT } from '../fixtures.mjs';
import { limit } from '../construction.mjs';
import { box, constructionText, footer, line, requestCohort, title } from '../defaults.mjs';
export function drawRunWindow(ctx, scene, state, api) {
  api.focus.target('run-window-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(ctx, api, 'A cohort ends after its last declared terminal outcome');
      const x = (t) => 450 + (t / 3000) * 1230;
      [
        ['readiness', -600, -350, themeColors.muted],
        ['warmup', -350, 0, themeColors.blue],
        ['measurement arrivals', 0, 2000, themeColors.cyan],
        ['drain', 2000, 2500, themeColors.yellow],
      ].forEach(([name, start, end, col], i) => {
        const xx = x(start),
          ww = x(end) - x(start);
        api.rect(ctx, xx, 365, ww, 60, col + '30', col, 2);
        constructionText(ctx, api, name, xx + ww / 2, 405, i < 2 ? 22 : 26, col, 'center');
      });
      requestCohort(ctx, api, SERVING_COHORT, {
        x: 450,
        y: 500,
        width: 1230,
        height: 53,
        max: 3000,
        details: false,
      });
      line(ctx, api, x(2000), 445, x(2000), 835, themeColors.cyan, 2);
      line(ctx, api, x(2500), 445, x(2500), 835, themeColors.yellow, 2);
      if (currentBeat >= 1)
        box(ctx, api, '[0, 2000) owns six offered IDs', 320, 880, 620, 72, themeColors.cyan, 28);
      if (currentBeat >= 2)
        box(
          ctx,
          api,
          'horizon = max(2000, 2500) = 2500 ms',
          1010,
          880,
          730,
          72,
          themeColors.yellow,
          28,
        );
      footer(
        ctx,
        api,
        currentBeat === 3
          ? 'Flat server queue can coexist with rejected requests'
          : 'Client timeout remains terminal even if a late answer later arrives',
      );
    }
    return true;
  });
}
export default {
  id: 'run-window',
  draw: drawRunWindow,
  cues: ['run-window-beat-0', 'run-window-beat-1', 'run-window-beat-2', 'run-window-beat-3'],
};
