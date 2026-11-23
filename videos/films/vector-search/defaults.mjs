import { distance } from './arithmetic.mjs';
import { POINTS, QUERY } from './fixtures.mjs';
import { partition } from './model.mjs';
export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, w = 300, color = api.C.cyan, h = 84, fontSize = 32) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 12,
  });
}
export function caption(ctx, api, s) {
  return text(ctx, api, s, 960, 955, 28, api.C.muted, 'center');
}
export function coordinatePlane(ctx, api) {
  return api.teaching.axes({
    x: 230,
    y: 300,
    width: 1030,
    height: 600,
    equalUnits: true,
    xDomain: [0, 10],
    yDomain: [0, 10],
    xTicks: [0, 5, 10],
    yTicks: [0, 5, 10],
    fontSize: 26,
  });
}
export function drawVectorField(ctx, api, plot, highlight = []) {
  api.teaching.scatter({
    plot,
    points: POINTS.map((a) => ({
      ...a,
      color: highlight.includes(a.id) ? api.C.green : partition(a) ? api.C.pink : api.C.blue,
      radius: distance(a, QUERY) < 0.2 ? 5.5 : 8,
    })),
  });
  const z = plot.point(QUERY.x, QUERY.y);
  api.path(
    ctx,
    [
      {
        x: z.x,
        y: z.y - 5,
      },
      {
        x: z.x + 5,
        y: z.y,
      },
      {
        x: z.x,
        y: z.y + 5,
      },
      {
        x: z.x - 5,
        y: z.y,
      },
    ],
    {
      closed: true,
      fill: api.C.yellow,
      color: api.C.yellow,
      width: 1,
    },
  );
  text(ctx, api, 'query', z.x - 100, z.y - 36, 28, api.C.yellow);
}
export function detailText(ctx, api, v, x, y, z = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, col, align);
}
export function detailEquation(ctx, api, v, x, y, z = 44, col = api.C.ink) {
  return api.math(ctx, v, x, y, z, col, 'center');
}
