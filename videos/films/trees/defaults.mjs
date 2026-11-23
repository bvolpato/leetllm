import { rows } from './fixtures.mjs';
export function text(ctx, api, v, x, y, z = 34, c = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, c, a);
}
export function equation(ctx, api, v, x, y, z = 48, c = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, c, a);
}
export function plane(ctx, api) {
  return api.teaching.axes({
    x: 235,
    y: 340,
    width: 870,
    height: 450,
    xDomain: [0.5, 5],
    yDomain: [0, 9],
    xTicks: [1, 2, 3, 4, 5],
    yTicks: [0, 3, 6, 9],
    xLabel: 'ambiguity',
    yLabel: 'policy support',
  });
}
export function scatter(ctx, api, q) {
  return api.teaching.scatter({
    plot: q,
    points: rows.map(([x, y, label]) => ({
      x,
      y,
      color: label ? api.C.pink : api.C.blue,
    })),
    radius: 10,
  });
}
export function drawConstructionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawConstructionEquation(ctx, api, v, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawConstructionFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawConstructionDot(ctx, api, x, y, label, r = 13) {
  return api.circle(ctx, x, y, r, label ? api.C.pink : api.C.blue);
}
export function drawConstructionReceipt(ctx, api, entries, x = 230, y = 830) {
  return entries.forEach((row, i) => {
    const at = x + i * 190;
    api.rect(ctx, at, y, 150, 85, api.C.panel, row.cost ? api.C.pink : api.C.green, 2);
    drawConstructionText(ctx, api, row.id, at + 75, y + 30, 27, api.C.muted);
    drawConstructionText(
      ctx,
      api,
      row.cost ? '$' + row.cost : '✓',
      at + 75,
      y + 68,
      31,
      row.cost ? api.C.pink : api.C.green,
    );
  });
}
