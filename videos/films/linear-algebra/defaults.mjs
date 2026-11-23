export function text(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 44, color = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function target(ctx, api, name, paint) {
  return api.focus.target(name, paint);
}
export function caption(ctx, api, value) {
  return text(ctx, api, value, 960, 1010, 26, api.C.muted, 'center');
}
export function plane(
  ctx,
  api,
  bounds,
  x = 190,
  y = 315,
  width = 1540,
  height = 550,
  xLabel = '',
  yLabel = '',
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: bounds.slice(0, 2),
    yDomain: bounds.slice(2),
    xTicks: [0],
    yTicks: [0],
    gridColor: '#8d9cb92b',
    xLabel,
    yLabel,
    equalUnits: true,
    fontSize: 27,
  });
}
export function line(ctx, api, plot, from, to, color, width = 3) {
  const a = plot.point(...from),
    z = plot.point(...to);
  api.line(ctx, a.x, a.y, z.x, z.y, color, width);
}
export function arrow(ctx, api, plot, from, to, color, width = 7) {
  const a = plot.point(...from),
    z = plot.point(...to);
  if (Math.hypot(z.x - a.x, z.y - a.y) > 0.001) api.arrow(ctx, a.x, a.y, z.x, z.y, color, width);
}
export function ring(ctx, api, p, color, r = 12) {
  return api.circle(ctx, p.x, p.y, r, '#00000000', color, 3);
}
export function curve(ctx, api, plot, values, color, width = 3, name) {
  return api.teaching.curve({
    plot,
    points: values.map((v) => ({
      x: v[0],
      y: v[1],
    })),
    color,
    width,
    ...(name
      ? {
          id: name,
        }
      : {}),
  });
}
export function drawExtensionsText(ctx, api, v, x, y, size = 34, color = api.C.ink) {
  return api.text(ctx, String(v), x, y, size, color, 'center');
}
export function drawExtensionsEquation(ctx, api, v, x, y, size = 46, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtensionsFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}

export function scoreRail(ctx, api, x, y, width, limit, score, color) {
  const zero = x + width / 2;
  api.line(ctx, x, y, x + width, y, api.C.muted, 2);
  api.line(ctx, zero, y - 16, zero, y + 16, api.C.muted, 3);
  api.circle(ctx, zero + score * width / (2 * limit), y, 12, color, api.C.panel, 2);
}
