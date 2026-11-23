import { timedForecastScene } from '../construction.mjs';
import { pinball } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

const scene = timedForecastScene('quantile-target', (ctx, api, clock) => {
  const { C } = api;
  const forecast = 100,
    q = 0.9;
  const x = (v) => 960 + (v - forecast) * 45;
  const cases = [
    { actual: 110, cost: q, move: 'under', answer: 'nine', name: 'Short by', color: C.pink },
    { actual: 90, cost: 1 - q, move: 'over', answer: 'one', name: 'Over by', color: C.blue },
  ];
  api.focus.target('loss-ruler', () => {
    text(ctx, api, 'Demand in batch jobs', 165, 260, 34, C.ink, 'left');
    api.line(ctx, 250, 419, 1670, 419, C.muted, 3);
    for (const v of [85, 90, 95, 100, 105, 110, 115]) {
      api.line(ctx, x(v), 411, x(v), 432, C.muted, 3);
      text(ctx, api, v, x(v), 471, 30, C.ink);
    }
    api.circle(ctx, x(forecast), 419, 12, C.bg, C.yellow, 4);
    text(ctx, api, 'Forecast 100', x(forecast), 358, 38, C.yellow);
    for (const c of cases) {
      if (clock.progress(c.move) <= 0) continue;
      const pos = x(c.actual);
      api.line(ctx, x(forecast), 398, pos, 398, c.color, 5);
      api.circle(ctx, pos, 398, 12, c.color);
      text(ctx, api, 'Actual ' + c.actual, pos, 358, 34, c.color);
    }
    if (clock.progress('rates') > 0) {
      text(ctx, api, 'Surplus × ' + (1 - q).toFixed(2), x(90), 548, 33, C.blue);
      text(ctx, api, 'Shortfall × ' + q.toFixed(2), x(110), 548, 33, C.pink);
    }
  });
  api.focus.target('loss-score', () => {
    text(ctx, api, 'Pinball loss per outcome', 165, 657, 34, C.ink, 'left');
    cases.forEach((c, i) => {
      if (clock.progress(c.move) <= 0) return;
      const yy = 749 + 99 * i,
        n = Math.abs(c.actual - forecast);
      const loss = pinball(c.actual, forecast, q);
      text(ctx, api, c.name + ' ' + n + ' jobs', 175, yy + 10, 32, c.color, 'left');
      text(
        ctx,
        api,
        n + ' × ' + c.cost.toFixed(2) + ' = ' + (clock.after(c.answer) ? loss.toFixed(0) : '?'),
        690,
        yy + 10,
        39,
        C.ink,
      );
      if (clock.after(c.answer)) {
        api.rect(ctx, 951, yy - 23, 75 * loss, 34, c.color, undefined, 2);
        text(ctx, api, loss.toFixed(0), 978 + 75 * loss, yy + 9, 36, c.color, 'left');
      }
    });
    if (clock.after('one'))
      text(
        ctx,
        api,
        'Target q = 0.90   ·   each row scores one possible outcome',
        960,
        961,
        30,
        C.muted,
      );
  });
});

export const drawQuantileTarget = scene.draw;
export default scene;
