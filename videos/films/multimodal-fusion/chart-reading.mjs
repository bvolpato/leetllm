import { DASHBOARD } from './fixtures.mjs';
import { chartEvidence } from './model.mjs';

export const originalKey = ['Search', 'Checkout', 'Login'];
export const secondKey = [originalKey[1], originalKey[0], originalKey[2]];
const trend = chartEvidence();
export const risingRow = DASHBOARD.series.findIndex((series) => series.name === trend.name);

export function traceAtHour(values, hour) {
  const visible = DASHBOARD.hours.flatMap((x, i) => (x <= hour ? [{ x, y: values[i] }] : []));
  const last = visible.at(-1);
  if (last.x < hour && visible.length < values.length) {
    const next = visible.length;
    const fraction = (hour - last.x) / (DASHBOARD.hours[next] - last.x);
    visible.push({ x: hour, y: last.y + (values[next] - last.y) * fraction });
  }
  return visible;
}

export function trendPlot(
  ctx,
  api,
  { hour = 6, readings = false, title = 'Afternoon dashboard' } = {},
) {
  const { C, teaching, components } = api;
  return components.panel(
    {
      x: 110,
      y: 266,
      width: 962,
      height: 518,
      fill: C.panel,
      stroke: C.muted,
      padding: 8,
      radius: 12,
    },
    () => {
      api.text(ctx, title, 165, 326, 35, C.ink);
      const plot = teaching.axes({
        x: 200,
        y: 375,
        width: 780,
        height: 316,
        xDomain: [1, 6],
        yDomain: [0, 10],
        xTicks: [1, 3, 6],
        yTicks: [0, 5, 10],
        formatX: (h) => `${h} pm`,
        fontSize: 28,
      });
      api.path(ctx, [plot.point(3, 0), plot.point(3, 10)], { color: C.yellow, width: 2 });
      DASHBOARD.series.forEach(({ values, tone }) => {
        teaching.curve({ plot, points: traceAtHour(values, hour), color: C[tone], width: 5 });
      });
      if (readings) {
        for (const { x, y } of [trend.before, trend.after]) {
          const pt = plot.point(x, y);
          api.circle(ctx, pt.x, pt.y, 9, C.green, C.ink, 2);
          api.text(
            ctx,
            y.toFixed(1),
            pt.x + (x === 3 ? -16 : 12),
            pt.y - 15,
            31,
            C.green,
            x === 3 ? 'right' : 'left',
          );
        }
      }
    },
  );
}

export function legendCrop(
  ctx,
  api,
  { reveal = 1, title = 'Legend from the same screenshot', names = originalKey } = {},
) {
  const { C } = api;
  return api.components.panel(
    {
      x: 1160,
      y: 266,
      width: 642,
      height: 518,
      fill: C.panel,
      stroke: C.muted,
      radius: 12,
      padding: 10,
    },
    () => {
      api.text(ctx, title, 1200, 326, 32, C.ink);
      const edge = 1260 + 515 * reveal;
      DASHBOARD.series.forEach(({ tone }, i) => {
        const y = 430 + i * 126;
        api.line(ctx, 1220, y, Math.min(edge, 1330), y, C[tone], 9);
        if (edge > 1650) api.text(ctx, names[i], 1385, y + 16, 51, C[tone]);
      });
      if (reveal < 1) {
        api.line(ctx, edge, 367, edge, 738, C.yellow, 3);
        api.line(ctx, edge - 18, 367, edge, 367, C.yellow, 3);
        api.line(ctx, edge - 18, 738, edge, 738, C.yellow, 3);
      }
      if (reveal === 0) api.text(ctx, 'Names outside crop', 1520, 552, 39, C.muted, 'center');
    },
  );
}
