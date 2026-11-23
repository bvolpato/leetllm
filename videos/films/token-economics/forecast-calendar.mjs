import { budgetMicro, forecastWithColdNights } from './fixtures.mjs';
import { text } from './defaults.mjs';

export const usd = (micro, digits = 2) => '$' + (micro / 1e6).toFixed(digits);

export function drawForecastCalendar(
  ctx,
  api,
  { cold = 0, marked = 0, allowance, calculation, note },
) {
  const { C } = api;
  const forecast = forecastWithColdNights(cold);
  const room = budgetMicro - forecast;
  text(ctx, api, 'Nightly evaluation', 160, 270, 42, C.ink, 'left');
  text(ctx, api, '2,000 calls each night', 160, 326, 31, C.muted, 'left');
  api.focus.target('calendar', () => {
    for (let night = 1; night <= 30; night++) {
      const x = 160 + ((night - 1) % 10) * 101;
      const y = 372 + Math.floor((night - 1) / 10) * 108;
      const color = night <= marked ? C.yellow : C.blue;
      api.rect(ctx, x, y, 86, 84, night <= cold ? C.yellow : C.panel, color, 6);
      text(ctx, api, String(night), x + 43, y + 55, 35, night <= cold ? C.bg : color);
    }
  });
  text(ctx, api, 'Prefix read assumed', 160, 742, 29, C.blue, 'left');
  if (marked > 0)
    text(
      ctx,
      api,
      cold
        ? cold + ' cold' + (cold < marked ? ' · next night outlined' : ' nights')
        : 'Test without reads',
      638,
      742,
      29,
      C.yellow,
      'left',
    );

  api.focus.target('forecast', () => {
    const x = 1240;
    text(ctx, api, 'Generation budget', x, 330, 33, C.muted, 'left');
    text(ctx, api, usd(budgetMicro), x, 400, 63, C.ink, 'left');
    text(
      ctx,
      api,
      allowance ? 'Extra available per night' : '30-day forecast',
      x,
      491,
      33,
      C.muted,
      'left',
    );
    text(ctx, api, allowance ?? usd(forecast), x, 565, 65, room < 0 ? C.pink : C.cyan, 'left');
    text(
      ctx,
      api,
      usd(Math.abs(room)) + (room < 0 ? ' over budget' : ' left'),
      x,
      659,
      37,
      room < 0 ? C.pink : C.yellow,
      'left',
    );
  });
  if (calculation) text(ctx, api, calculation, 960, 880, 41, C.ink);
  if (note) text(ctx, api, note, 960, 972, 32, C.muted);
}
