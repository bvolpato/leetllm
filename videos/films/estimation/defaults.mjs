export function text(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 46, color = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function focusTarget(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function panel(ctx, api, x, y, w, h, paint, color = api.C.muted) {
  return api.components.panel(
    {
      x,
      y,
      width: w,
      height: h,
      fill: api.C.panel,
      stroke: color,
      radius: 12,
      padding: 10,
      scope: 'label',
    },
    paint,
  );
}
export function axes(ctx, api, x, y, width, height, xd, yd, xt, yt, xl = '', yl = '') {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: xt,
    yTicks: yt,
    xLabel: xl,
    yLabel: yl,
    fontSize: 26,
  });
}
export function interval(ctx, api, plot, v, row, color, amount = 1, point = null) {
  const a = plot.point(v.low, row),
    z = plot.point(v.high, row);
  api.path(
    ctx,
    [
      a,
      {
        x: api.lerp(a.x, z.x, amount),
        y: a.y,
      },
    ],
    {
      color,
      width: 7,
      clip: plot.bounds,
    },
  );
  api.line(ctx, a.x, a.y - 11, a.x, a.y + 11, color, 3);
  if (amount >= 1) api.line(ctx, z.x, z.y - 11, z.x, z.y + 11, color, 3);
  if (point !== null) {
    const p = plot.point(point, row);
    api.circle(ctx, p.x, p.y, 9, api.C.yellow);
  }
}
export function labelGrid(ctx, api, rows, shown, colored, x, y, gap = 34, radius = 10) {
  rows
    .slice(0, shown)
    .forEach((row, i) =>
      api.circle(
        ctx,
        x + (i % 10) * gap,
        y + Math.floor(i / 10) * gap,
        radius,
        i < colored ? (row.specialist ? api.C.pink : api.C.blue) : api.C.muted,
      ),
    );
}
export function dots(ctx, api, plot, rates, color, row) {
  return rates.forEach((r, i) => {
    const p = plot.point(r, row + ((i % 5) - 2) * 0.055);
    api.circle(ctx, p.x, p.y, 7, color);
  });
}
export function caption(ctx, api, v) {
  return text(ctx, api, v, 960, 995, 28, api.C.muted, 'center');
}

export const percent = (v) => (100 * v).toFixed(1) + '%';
