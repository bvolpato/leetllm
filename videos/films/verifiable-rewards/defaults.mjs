export function drawText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawEquation(ctx, api, v, x, y, size = 39, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawLine(ctx, api, x, y, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawRectangle(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 2, 5);
}
export function drawCell(ctx, api, v, x, y, w = 270, h = 80, color = api.C.blue, size = 30) {
  drawRectangle(ctx, api, x, y, w, h, color);
  drawText(ctx, api, v, x + w / 2, y + h * 0.66, size, color, 'center');
}
export function drawHeading(ctx, api, v) {
  return drawText(ctx, api, v, 170, 285, 34, api.C.ink);
}
export function drawFooter(ctx, api, v) {
  return drawText(ctx, api, v, 960, 1005, 24, api.C.muted, 'center');
}
export function drawTable(ctx, api, headers, rows, x = 170, y = 385, width = 1580, rowH = 125) {
  const w = width / headers.length;
  headers.forEach((h, i) => drawText(ctx, api, h, x + i * w + 12, y, 26, api.C.muted));
  rows.forEach((r, j) => {
    drawLine(ctx, api, x, y + 25 + j * rowH, x + width, y + 25 + j * rowH, api.C.muted, 1);
    r.forEach((v, i) =>
      drawText(
        ctx,
        api,
        v,
        x + i * w + 12,
        y + 80 + j * rowH,
        29,
        i === 0 ? api.C.blue : api.C.ink,
      ),
    );
  });
}
export function drawSignedValue(
  ctx,
  api,
  v,
  x,
  y,
  scale = 260,
  color = v >= 0 ? api.C.green : api.C.pink,
) {
  drawLine(ctx, api, x, y - 23, x, y + 23);
  if (Math.abs(v) > 1e-9) api.arrow(ctx, x, y, x + v * scale, y, color, 5);
  drawText(ctx, api, v.toFixed(3), x + v * scale, y - 35, 28, color, 'center');
}
export function drawCurve(
  ctx,
  api,
  fn,
  domain,
  range,
  x = 250,
  y = 410,
  w = 1090,
  h = 390,
  color = api.C.cyan,
) {
  const plot = api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: domain,
    yDomain: range,
    xTicks: [domain[0], (domain[0] + domain[1]) / 2, domain[1]],
    yTicks: [range[0], (range[0] + range[1]) / 2, range[1]],
    fontSize: 24,
  });
  api.teaching.curve({
    plot,
    points: Array.from(
      {
        length: 121,
      },
      (_, i) => {
        const x = domain[0] + (i * (domain[1] - domain[0])) / 120;
        return {
          x,
          y: fn(x),
        };
      },
    ),
    color,
    width: 5,
    progress: 1,
  });
  return plot;
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 46, col = api.C.ink, a = 'center') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, label, x, y, width = 380, color = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 94,
    fontSize: 31,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
