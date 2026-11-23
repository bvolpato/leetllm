export function writeText(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function writeEquation(ctx, api, v, x, y, size = 46, color = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function withFocus(ctx, api, id, draw) {
  return api.focus ? api.focus.target(id, draw) : draw();
}
export function drawFlow(ctx, api, nodes, edges) {
  return api.teaching.flowGraph({
    nodes,
    edges,
    fill: api.C.panel,
    textColor: api.C.ink,
    padding: 16,
  });
}
export function drawAxes(ctx, api, x, y, width, height, xd, yd, xl, yl, xt, yt) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xLabel: xl,
    yLabel: yl,
    xTicks: xt,
    yTicks: yt,
    fontSize: 25,
  });
}
export function writeExpansionText(
  ctx,
  api,
  value,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(value), x, y, size, color, align, font);
}
export function withExpansionFocus(ctx, api, target, fn) {
  return api.focus.target(target, fn);
}
export function drawExpansionBox(ctx, api, x, y, width, height, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    radius: 10,
  });
}
export function drawExpansionCell(
  ctx,
  api,
  value,
  x,
  y,
  w = 450,
  h = 110,
  color = api.C.cyan,
  size = 30,
) {
  drawExpansionBox(ctx, api, x, y, w, h, color);
  const lines = String(value).split('\n');
  lines.forEach((v, i) =>
    writeExpansionText(
      ctx,
      api,
      v,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.3 + size * 0.34,
      size,
      color,
      'center',
    ),
  );
}
export function drawExpansionLine(ctx, api, a, b, color = api.C.muted, width = 3) {
  return api.line(ctx, a.x, a.y, b.x, b.y, color, width);
}
export function drawExpansionNote(ctx, api, value) {
  return writeExpansionText(ctx, api, value, 960, 1015, 25, api.C.muted, 'center');
}
export function drawExpansionPlot(
  ctx,
  api,
  x,
  y,
  width,
  height,
  xd,
  yd,
  xt,
  yt,
  xLabel = '',
  yLabel = '',
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: xt,
    yTicks: yt,
    xLabel,
    yLabel,
    fontSize: 25,
  });
}
export function drawExpansionPath(ctx, api, points, color = api.C.cyan, width = 4, clip) {
  return points.length > 1
    ? api.path(ctx, points, {
        color,
        width,
        ...(clip
          ? {
              clip,
            }
          : {}),
      })
    : undefined;
}
