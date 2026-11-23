export function drawOriginalVisualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawOriginalText(
  ctx,
  api,
  value,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, value, x, y, size, color, align);
}
export function drawOriginalEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 46,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawText(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'center') {
  return api.text(ctx, String(v), x, y, z, col, a);
}
export function drawRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 8);
}
export function drawLine(ctx, api, x, y, u, v, col = api.C.border, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function drawPill(ctx, api, v, x, y, w = 500, col = api.C.blue, h = 75, z = 29) {
  drawRectangle(ctx, api, x - w / 2, y - h / 2, w, h, api.C.panel, col);
  drawText(ctx, api, v, x, y + z * 0.34, z, col);
}
export function drawFooter(ctx, api, v, col = api.C.muted) {
  return drawText(ctx, api, v, 960, 1017, 26, col);
}
export function drawCenteredLine(ctx, api, v, y, col = api.C.muted) {
  return drawText(ctx, api, v, 960, y, 32, col);
}
export function drawArrow(ctx, api, x, y, u, v, col = api.C.blue) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function withFocus(ctx, api, name, paint) {
  return api.focus.target(name, paint);
}
export function drawAxis(ctx, api, min, max, y, x = 300, w = 1320) {
  drawLine(ctx, api, x, y, x + w, y, api.C.border, 3);
  return (minute) => x + ((minute - min) / (max - min)) * w;
}
