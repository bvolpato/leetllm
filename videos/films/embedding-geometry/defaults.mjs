export function geometryText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function line(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function heading(ctx, api, t) {
  return geometryText(ctx, api, t, 960, 260, 29, api.C.muted, 'center');
}
export function cell(ctx, api, v, x, y, w = 180, h = 70, col = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 4);
  geometryText(ctx, api, v, x + w / 2, y + h / 2 + 10, 28, col, 'center');
}
export function vector(ctx, api, plot, v, col, part = 1) {
  const a = plot.point(0, 0),
    z = plot.point(v[0] * part, v[1] * part);
  api.arrow(ctx, a.x, a.y, z.x, z.y, col, 5);
  api.circle(ctx, z.x, z.y, 10, col);
  return z;
}
export function text(ctx, api, value, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 42, color = api.C.ink) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function plane(
  ctx,
  api,
  { x = 260, y = 365, width = 900, height = 500, domain = [-1, 5], yDomain = [-1, 3] } = {},
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    equalUnits: true,
    xDomain: domain,
    yDomain,
    xTicks: [],
    yTicks: [],
    xLabel: 'coordinate 1',
    yLabel: 'coordinate 2',
    fontSize: 24,
  });
}
export function vectorLine(ctx, api, graph, vector, color, progress = 1, width = 5) {
  const end = {
    x: vector[0] * progress,
    y: vector[1] * progress,
  };
  api.path(ctx, [graph.point(0, 0), graph.point(end.x, end.y)], {
    color,
    width,
    clip: graph.bounds,
  });
  api.circle(ctx, ...Object.values(graph.point(end.x, end.y)), 10, color);
}
