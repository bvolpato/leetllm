import { lerp } from './arithmetic.mjs';
export function drawOriginalSlimeText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalSlimeEquation(ctx, api, v, x, y, size = 48) {
  return api.math(ctx, v, x, y, size, api.C.yellow, 'center');
}
export function drawOriginalSlimeCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 420,
  color = api.C.blue,
  height = 100,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawOriginalSlimeGrid(
  ctx,
  api,
  labels,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  fontSize = 32,
) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function drawSlimeText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawSlimeTile(
  ctx,
  api,
  value,
  x,
  y,
  width = 190,
  color = api.C.blue,
  height = 72,
  size = 28,
) {
  return api.components.card({
    label: String(value),
    x,
    y,
    width,
    height,
    fontSize: size,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 10,
  });
}
export function drawSlimeTitle(ctx, api, value, color = api.C.yellow) {
  return drawSlimeText(ctx, api, value, 960, 285, 36, color, 'center');
}
export function drawSlimeNote(ctx, api, value) {
  return drawSlimeText(ctx, api, value, 960, 1010, 27, api.C.muted, 'center');
}
export function drawSlimeRule(ctx, api, value, y = 925, color = api.C.cyan, size = 33) {
  return drawSlimeText(ctx, api, value, 960, y, size, color, 'center');
}
export function drawSlimeRow(
  ctx,
  api,
  values,
  y,
  { x = 390, width = 210, color = api.C.blue, colors, size = 30 } = {},
) {
  return values.map((v, i) =>
    drawSlimeTile(ctx, api, v, x + i * width, y, width - 16, colors?.[i] ?? color, 75, size),
  );
}
export function drawSlimeWire(ctx, api, x1, y1, x2, y2, p, color = api.C.cyan) {
  api.line(ctx, x1, y1, x2, y2, api.C.muted, 2);
  if (p > 0) {
    api.line(ctx, x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), color, 5);
    const distance = Math.hypot(x2 - x1, y2 - y1);
    if (p * distance > 12 && (1 - p) * distance > 12)
      api.circle(ctx, lerp(x1, x2, p), lerp(y1, y2, p), 7, color);
  }
}
export function drawSlimeBrace(ctx, api, x1, x2, y, label, color = api.C.cyan) {
  api.line(ctx, x1, y, x2, y, color, 3);
  api.line(ctx, x1, y - 12, x1, y, color, 3);
  api.line(ctx, x2, y - 12, x2, y, color, 3);
  drawSlimeText(ctx, api, label, (x1 + x2) / 2, y + 48, 29, color, 'center');
}
