import { data } from './fixtures.mjs';
import { sampleFunction } from 'vizmatic';
export function text(ctx, api, v, x, y, z = 32, c = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, c, a);
}
export function equation(ctx, api, v, x, y, z = 42, c = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, c, a);
}
export function target(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function plot(
  ctx,
  api,
  x = 210,
  y = 350,
  width = 900,
  height = 470,
  xd = [0, 7],
  yd = [80, 250],
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: [0, 1, 3, 5, 6].filter((v) => v >= xd[0] && v <= xd[1]),
    yTicks: yd[0] === 80 ? [100, 150, 200] : [-4, 0, 4],
    xLabel: 'context (100 tokens)',
    yLabel: yd[0] === 80 ? 'latency (ms)' : 'residual (ms)',
  });
}
export function curve(
  ctx,
  api,
  q,
  fn,
  color = api.C.cyan,
  start = 0,
  end = 7,
  width = 5,
  progress = 1,
) {
  return api.teaching.curve({
    plot: q,
    points: sampleFunction(fn, start, end, 90),
    color,
    width,
    progress,
  });
}
export function point(ctx, api, q, row, color = api.C.yellow, radius = 10) {
  const at = q.point(row.x, row.y);
  api.circle(ctx, at.x, at.y, radius, color);
  return at;
}
export function observations(ctx, api, q, count = 5, identity = false) {
  return data.slice(0, count).forEach((row, i) => {
    const at = point(ctx, api, q, row, i === 2 ? api.C.cyan : api.C.yellow);
    if (identity)
      text(
        ctx,
        api,
        String.fromCharCode(65 + i),
        at.x,
        at.y - 23,
        24,
        i === 2 ? api.C.cyan : api.C.muted,
        'center',
      );
  });
}
export function box(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    radius: 12,
  });
}
