export function drawLegacyText(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawLegacyEquation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawLegacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 420,
  color = api.C.cyan,
  height = 95,
  z = 32,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawText(
  ctx,
  api,
  v,
  x,
  y,
  z = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, z, color, align, font);
}
export function drawBox(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    stroke: color,
    fill,
    radius: 10,
  });
}
export function drawCell(ctx, api, value, x, y, w = 100, h = 70, color = api.C.cyan, size = 30) {
  drawBox(ctx, api, x, y, w, h, color);
  drawText(ctx, api, value, x + w / 2, y + h / 2 + size * 0.34, size, color, 'center', 'mono');
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawRow(ctx, api, values, x, y, w, color) {
  return values.forEach((v, i) =>
    drawCell(ctx, api, v, x + i * (w + 9), y, w, 65, Array.isArray(color) ? color[i] : color, 26),
  );
}
export function drawFooter(ctx, api, v) {
  return drawText(ctx, api, v, 960, 1015, 27, api.C.muted, 'center');
}
