import { FORECAST_ROWS, intervalHalfWidth } from './fixtures.mjs';
import { weeklyLookup } from './model.mjs';
import { text } from './defaults.mjs';

const target = 25;
const lookup = weeklyLookup(target);
const week = FORECAST_ROWS.slice(lookup.source, target + 1);
const observation = week.at(-1).volume;
const x = (day) => 218 + 165 * day;
const y = (jobs) => 745 - (jobs - 70) * 4.7;

export const friday = {
  forecast: lookup.value,
  observed: observation,
  error: observation - lookup.value,
  low: lookup.value - intervalHalfWidth,
  high: lookup.value + intervalHalfWidth,
};

export function fridayChart(ctx, api, { copy = 1, band = true, observed = true, gap = true } = {}) {
  const { C } = api;
  const last = week.length - 1;
  const forecastY = y(friday.forecast);
  const targetX = x(last);
  api.focus.target('friday-chart', () => {
    text(ctx, api, 'Daily batch jobs  ·  cluster fc-a', 115, 232, 33, C.ink, 'left');
    text(ctx, api, 'Issued Thu 29 Jan', x(last - 1) + 48, 228, 28, C.blue);
    for (const value of [80, 100, 120, 140, 160]) {
      text(ctx, api, value, 140, y(value) + 9, 26, C.muted, 'right');
      api.line(ctx, 164, y(value), targetX + 48, y(value), C.panel, 2);
    }
    const boundary = (x(last - 1) + targetX) / 2;
    api.line(ctx, boundary, 250, boundary, 718, C.muted, 2);
    week.forEach((row, i) => {
      const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][row.weekday];
      text(ctx, api, day + ' ' + row.date.slice(-2), x(i), 765, 26, i === last ? C.ink : C.muted);
      if (i === last) return;
      if (i > 0) api.line(ctx, x(i - 1), y(week[i - 1].volume), x(i), y(row.volume), C.cyan, 4);
      api.circle(ctx, x(i), y(row.volume), 8, C.cyan);
    });
    text(ctx, api, friday.forecast, x(0) - 19, forecastY + 10, 33, C.cyan, 'right');
    if (band) {
      api.rect(
        ctx,
        targetX - 54,
        y(friday.high),
        108,
        y(friday.low) - y(friday.high),
        '#273c58',
        C.blue,
        0,
      );
      text(
        ctx,
        api,
        'Band  ' + friday.low + '–' + friday.high,
        1490,
        forecastY + 57,
        30,
        C.blue,
        'left',
      );
    }
    if (copy > 0) {
      const currentX = api.lerp(x(0), targetX, copy);
      api.circle(ctx, currentX, forecastY, 13, C.bg, C.blue, 5);
      if (copy >= 1)
        text(ctx, api, 'Forecast  ' + friday.forecast, 1490, forecastY + 10, 32, C.blue, 'left');
    }
    if (observed) {
      api.circle(ctx, targetX, y(observation), 14, C.pink);
      text(ctx, api, 'Observed  ' + observation, 1490, y(observation) + 11, 32, C.pink, 'left');
    }
    if (gap) {
      const bx = targetX + 72;
      api.line(ctx, bx, y(observation), bx, forecastY, C.yellow, 4);
      for (const yy of [y(observation), forecastY])
        api.line(ctx, bx - 10, yy, bx + 10, yy, C.yellow, 4);
      text(
        ctx,
        api,
        '+' + friday.error + ' jobs',
        1490,
        (y(observation) + forecastY) / 2 + 10,
        36,
        C.yellow,
        'left',
      );
    }
  });
}
