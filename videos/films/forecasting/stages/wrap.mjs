import { timedForecastScene } from '../construction.mjs';
import { fridayChart } from '../friday-chart.mjs';
import { mae } from '../arithmetic.mjs';
import { errors, FORECAST_ROWS, intervalHalfWidth } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const scene = timedForecastScene('wrap', (ctx, api, clock) => {
  fridayChart(ctx, api);
  const { C } = api;
  api.focus.target('friday-action', () => {
    if (clock.after('pending')) {
      text(
        ctx,
        api,
        'Owner  capacity-ops       Action  review       Resolution  pending',
        960,
        873,
        35,
        C.yellow,
      );
      text(
        ctx,
        api,
        'Compare unique job starts with the source count. Check available capacity.',
        960,
        948,
        30,
        C.ink,
      );
    } else if (clock.after('week')) {
      const covered = errors.filter((error) => Math.abs(error) <= intervalHalfWidth);
      const week = FORECAST_ROWS.slice(-errors.length);
      const routine = errors.filter((_, i) => !week[i].launch_event);
      text(
        ctx,
        api,
        '26 Jan – 1 Feb   ·   ' +
          covered.length +
          ' of ' +
          errors.length +
          ' daily counts inside the band',
        960,
        872,
        36,
        C.blue,
      );
      if (clock.after('overall')) {
        const allDays = 'Mean absolute error   ·   all days  ' + mae(errors).toFixed(1) + ' jobs';
        const slice = clock.after('routine') ? '   ·   non-launch days  ' + mae(routine).toFixed(1) + ' jobs' : '';
        text(ctx, api, allDays + slice, 960, 949, 31, C.ink);
      }
    } else {
      text(
        ctx,
        api,
        '23 Jan  ·  source       25 Jan  ·  policy cutoff       29 Jan  ·  origin       30 Jan  ·  target',
        960,
        884,
        32,
        C.ink,
      );
    }
  });
});

export const drawWrap = scene.draw;
export default scene;
