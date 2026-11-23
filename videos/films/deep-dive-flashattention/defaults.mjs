import { clamp } from './arithmetic.mjs';
export function drawOriginalText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalEquation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 360,
  color = api.C.blue,
  height = 100,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 29,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawExtensionText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawExtensionRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  color = api.C.blue,
  fill = api.C.panel,
) {
  return api.rect(ctx, x, y, w, h, fill, color, 6);
}
export function drawExtensionL(ctx, api, x, y, xx, yy, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function drawExtensionDot(ctx, api, x, y, color = api.C.yellow, r = 8) {
  return api.circle(ctx, x, y, r, color);
}
export function drawExtensionEquation(ctx, api, v, x, y, size = 38, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtensionCell(ctx, api, label, x, y, w = 240, h = 82, color = api.C.blue) {
  drawExtensionRectangle(ctx, api, x, y, w, h, color);
  if (String(label).includes('_'))
    drawExtensionEquation(
      ctx,
      api,
      String.raw`\mathtt{` + String(label).replaceAll('_', String.raw`\_`) + String.raw`}`,
      x + w / 2,
      y + h / 2 + 10,
      28,
      color,
    );
  else drawExtensionText(ctx, api, label, x + w / 2, y + h / 2 + 10, 28, color, 'center');
}
export function drawExtensionVector(ctx, api, vs, x, y, w = 1450, h = 85, color = api.C.blue) {
  const cw = w / vs.length;
  vs.forEach((v, i) => drawExtensionCell(ctx, api, v, x + i * cw, y, cw - 8, h, color));
}
export function drawExtensionBar(ctx, api, x, y, w, h, f, color) {
  drawExtensionRectangle(ctx, api, x, y, w, h, api.C.muted);
  if (f > 0)
    api.rect(ctx, x + 2, y + 2, Math.max(0.01, (w - 4) * clamp(f)), h - 4, color, undefined, 0);
}
export function drawExtensionTravelling(ctx, api, x, y, xx, yy, q, color = api.C.cyan) {
  drawExtensionL(ctx, api, x, y, xx, yy, api.C.muted);
  const d = Math.hypot(xx - x, yy - y),
    r = Math.min(12, d / 3),
    a = r / d,
    z = 1 - a,
    k = a + (z - a) * clamp(q);
  drawExtensionDot(ctx, api, x + (xx - x) * k, y + (yy - y) * k, color);
}
export function drawExtensionFooter(ctx, api, v) {
  return drawExtensionText(ctx, api, v, 960, 1020, 26, api.C.muted, 'center');
}
