export function text(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.ink, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function line(ctx, api, x, y, X, Y, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, X, Y, color, width);
}
export function caption(ctx, api, s, color = api.C.muted) {
  return text(ctx, api, s, 960, 985, 28, color, 'center');
}
export function dot(ctx, api, x, y, color, r = 9) {
  return api.circle(ctx, x, y, r, color);
}
export function panel(ctx, api, x, y, width, height, paint, stroke = api.C.border) {
  return api.components.panel(
    {
      x,
      y,
      width,
      height,
      stroke,
      fill: api.C.panel,
      padding: 8,
    },
    paint,
  );
}
export function arrow(ctx, api, x, y, X, Y, color = api.C.cyan, width = 3) {
  line(ctx, api, x, y, X, Y, color, width);
  const a = Math.atan2(Y - y, X - x);
  line(ctx, api, X, Y, X - 12 * Math.cos(a - 0.5), Y - 12 * Math.sin(a - 0.5), color, width);
  line(ctx, api, X, Y, X - 12 * Math.cos(a + 0.5), Y - 12 * Math.sin(a + 0.5), color, width);
}
export function axis(
  ctx,
  api,
  domain = [20, 90],
  y = 700,
  label = 'response latency · milliseconds',
  ticks = [20, 30, 40, 50, 60, 70, 80, 90],
) {
  return api.teaching.axes({
    x: 300,
    y,
    width: 1320,
    height: 40,
    xDomain: domain,
    yDomain: [0, 1],
    xTicks: ticks,
    yTicks: [],
    xLabel: label,
    fontSize: 25,
  });
}
export function intervalRow(
  ctx,
  api,
  plot,
  y,
  center,
  radius,
  outcome,
  { showEndpoints = true, showOutcome = true, color = api.C.cyan, scaleLabel } = {},
) {
  const at = plot.point(center, 0.5).x,
    left = plot.point(center - radius, 0.5).x,
    right = plot.point(center + radius, 0.5).x;
  line(ctx, api, left, y, right, y, color, 10);
  line(ctx, api, left, y - 13, left, y + 13, color, 3);
  line(ctx, api, right, y - 13, right, y + 13, color, 3);
  dot(ctx, api, at, y, api.C.yellow, 8);
  if (showEndpoints) {
    text(ctx, api, Number((center - radius).toFixed(1)), left, y + 44, 25, color, 'center');
    text(ctx, api, Number((center + radius).toFixed(1)), right, y + 44, 25, color, 'center');
  }
  if (showOutcome) {
    const x = plot.point(outcome, 0.5).x,
      hit = Math.abs(outcome - center) <= radius;
    dot(ctx, api, x, y, hit ? api.C.green : api.C.pink, 12);
    text(ctx, api, `observed ${outcome}`, x, y - 30, 25, hit ? api.C.green : api.C.pink, 'center');
  }
  if (scaleLabel) text(ctx, api, scaleLabel, 1740, y + 8, 25, api.C.muted, 'right');
}
