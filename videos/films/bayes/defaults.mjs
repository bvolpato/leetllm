import { betaDensity } from './arithmetic.mjs';
import { observed } from './fixtures.mjs';
import { clamp } from './construction.mjs';
import { sampleFunction } from 'vizmatic';
export function text(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 42, color = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function target(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function caption(ctx, api, v) {
  return text(ctx, api, v, 960, 1010, 26, api.C.muted, 'center');
}
export function chart(
  ctx,
  api,
  {
    x = 150,
    y = 350,
    width = 1100,
    height = 480,
    max = 4,
    label = 'density',
    xLabel = 'unknown task success rate p',
    ticks = [0, 0.25, 0.5, 0.75, 1],
    yTicks = [0, max / 2, max],
  } = {},
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: [0, 1],
    yDomain: [0, max],
    xTicks: ticks,
    yTicks,
    xLabel,
    yLabel: label,
    fontSize: 25,
  });
}
export function curve(ctx, api, q, a, z, color, width = 5) {
  return api.teaching.curve({
    plot: q,
    points: sampleFunction((x) => betaDensity(a, z, x), 0, 1, 240),
    color,
    width,
  });
}
export function areaFill(ctx, api, q, fn, low, high, color, alpha = '28') {
  if (high <= low) return;
  api.path(
    ctx,
    [
      q.point(low, 0),
      ...sampleFunction(fn, low, high, 160).map((v) => q.point(v.x, v.y)),
      q.point(high, 0),
    ],
    {
      fill: color + alpha,
      color: color + '88',
      width: 1,
      closed: true,
      clip: q.bounds,
    },
  );
}
export function ring(ctx, api, p, color, r = 9) {
  return api.circle(ctx, p.x, p.y, r, '#00000000', color, 3);
}
export function tile(ctx, api, row, x, y, width = 100, height = 62, opacity = 1, fontSize = 23) {
  return api.components.card({
    label: row.id + ' ' + (row.pass ? 'pass' : 'fail'),
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: row.pass ? api.C.green : api.C.red,
    textColor: row.pass ? api.C.green : api.C.red,
    fontSize,
    padding: 7,
    opacity,
  });
}
export function ledger(
  ctx,
  api,
  progress,
  { x = 180, y = 255, gap = 156, width = 132, height = 68 } = {},
) {
  return observed.forEach((row, i) => {
    const travel = clamp(progress * 10 - i);
    target(ctx, api, 'outcome-' + row.id, () =>
      tile(ctx, api, row, x + i * gap, y, width, height, travel),
    );
  });
}
