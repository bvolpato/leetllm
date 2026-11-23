import { loss } from './arithmetic.mjs';
import { curve, point, rectangle, text } from './defaults.mjs';

const plans = [
  { n: 5, d: 20, name: 'Tall' },
  { n: 10, d: 10, name: 'Square' },
];

// The same plotting scales, plan order and colors survive the change of fitted law.
export function comparePlans(ctx, api, { n, b, showSquare, totals, conclusion }) {
  const { C } = api;
  const x = 205,
    bottom = 835,
    unit = 24;
  const d = 100 / n;
  api.focus.target('allocation-map', () => {
    rectangle(ctx, api, x, bottom - d * unit, n * unit, d * unit, C.blue + '24', C.blue);
    const axes = api.teaching.axes({
      x,
      y: bottom - 22 * unit,
      width: 22 * unit,
      height: 22 * unit,
      xDomain: [0, 22],
      yDomain: [0, 22],
      xTicks: [5, 10, 20],
      yTicks: [5, 10, 20],
      xLabel: 'Parameter units',
      yLabel: 'Token units',
      color: C.muted,
    });
    curve(ctx, api, axes, (v) => 100 / v, 100 / 22, 22, C.cyan);
    for (const plan of plans) point(ctx, api, axes, plan.n, plan.d, C.muted, 7);
    point(ctx, api, axes, n, d, C.yellow, 12);
    text(ctx, api, 'N × D = 100', x + 340, 408, 41, C.cyan);
  });
  api.focus.target('loss-terms', () => {
    text(
      ctx,
      api,
      'Fitted loss = 1 + parameter penalty + data penalty',
      1370,
      268,
      34,
      C.ink,
      'center',
    );
    text(ctx, api, '2 / √N', 1010, 371, 50, C.blue);
    text(ctx, api, Number(b.toFixed(2)) + ' / √D', 1335, 371, 50, C.cyan);
    const start = 975,
      scale = 367;
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i],
        y = 491 + i * 215;
      text(ctx, api, plan.name + '   ' + plan.n + ' × ' + plan.d, start, y - 27, 39, C.ink);
      if (i === 1 && !showSquare) {
        text(ctx, api, '?', start, y + 60, 55, C.muted);
        continue;
      }
      const terms = [2 / Math.sqrt(plan.n), b / Math.sqrt(plan.d)];
      let edge = start;
      terms.forEach((value, j) => {
        const width = value * scale;
        rectangle(ctx, api, edge, y, width, 80, j ? C.cyan : C.blue, j ? C.cyan : C.blue);
        text(ctx, api, value.toFixed(3), edge + width / 2, y + 52, 32, C.bg, 'center');
        edge += width;
      });
      if (totals)
        text(ctx, api, loss(plan.n, plan.d, 2, b).toFixed(3), 1810, y + 52, 38, C.ink, 'right');
    }
    if (totals) {
      text(ctx, api, 'Total loss', 1810, 454, 29, C.muted, 'right');
      text(ctx, api, 'Totals use unrounded penalties', 1390, 862, 30, C.muted, 'center');
    }
  });
  text(ctx, api, conclusion, 960, 986, 38, C.yellow, 'center');
}
