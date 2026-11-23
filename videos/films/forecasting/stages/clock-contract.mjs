import { timedForecastScene } from '../construction.mjs';
import { FORECAST_ROWS, weekdayNames } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const scene = timedForecastScene('clock-contract', (ctx, api, clock) => {
  const { C } = api;
  const origin = 20;
  const delayed = clock.progress('missing') > 0;
  api.focus.target('clock-calendar', () => {
    text(ctx, api, 'Daily batch jobs  ·  synthetic cluster history', 150, 245, 32, C.ink, 'left');
    text(ctx, api, 'As of Sun 25 Jan, evening', 1745, 245, 32, C.yellow, 'right');
    weekdayNames.forEach((day, i) => text(ctx, api, day, 276 + 228 * i, 325, 29, C.ink));
    FORECAST_ROWS.forEach((row, i) => {
      const future = i > origin;
      const left = 170 + (i % 7) * 228,
        top = 352 + Math.floor(i / 7) * 126;
      const targeted =
        future &&
        (clock.progress('weekly') > 0 || (i === origin + 1 && clock.progress('origin') > 0));
      const pending = delayed && i === origin;
      const latest = delayed && i === origin - 1;
      api.rect(
        ctx,
        left,
        top,
        211,
        114,
        C.panel,
        pending || latest ? C.yellow : targeted ? C.blue : C.muted,
        5,
      );
      text(ctx, api, row.date.slice(5).replace('-', '/'), left + 14, top + 32, 24, C.muted, 'left');
      if (future) {
        if (targeted)
          text(ctx, api, 'h = ' + (i - origin), left + 196, top + 32, 24, C.blue, 'right');
        text(
          ctx,
          api,
          row.launch_event ? 'launch planned' : 'unobserved',
          left + 105,
          top + 83,
          24,
          row.launch_event ? C.yellow : C.muted,
        );
      } else {
        text(
          ctx,
          api,
          pending ? 'pending' : row.volume,
          left + 105,
          top + 87,
          35,
          pending || latest ? C.yellow : C.ink,
        );
      }
    });
    const status = delayed
      ? 'Sunday report delayed   ·   last available count: Saturday, ' +
        FORECAST_ROWS[origin - 1].volume +
        ' jobs'
      : clock.progress('origin') > 0
        ? 'One origin on Sunday evening   ·   each target has its own horizon'
        : 'Last available count: Sunday, ' + FORECAST_ROWS[origin].volume + ' jobs';
    text(ctx, api, status, 960, 948, 34, C.ink);
  });
});

export const drawClockContract = scene.draw;
export default scene;
