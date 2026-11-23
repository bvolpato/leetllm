import { clamp01 } from './arithmetic.mjs';
export function drawText(
  ctx,
  api,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, value, x, y, size, color, align, font);
}
export function drawEquation(ctx, api, tex, x, y, size = 48, color = api.C.ink, align = 'left') {
  return api.math(ctx, tex, x, y, size, color, align);
}
export function drawRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = undefined,
  radius = 14,
) {
  return api.rect(ctx, x, y, w, h, fill, stroke, radius);
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawCircle(ctx, api, x, y, r, fill = api.C.cyan, stroke = undefined, width = 3) {
  return api.circle(ctx, x, y, r, fill, stroke, width);
}
export function drawConnection(ctx, api, from, to, color = api.C.cyan, width = 4) {
  return api.connect(ctx, from, to, {
    color,
    width,
    gap: 8,
  });
}
export function withLabelBounds(ctx, api, bounds, draw, padding = 8) {
  return api.labelScope(ctx, bounds, draw, {
    padding,
  });
}
export function drawDetailText(
  ctx,
  api,
  s,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(s), x, y, size, color, align, font);
}
export function drawDetailEquation(ctx, api, s, x, y, size = 46, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawDetailLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawDetailRectangle(ctx, api, x, y, w, h, color = api.C.cyan) {
  return w > 0 && h > 0 ? api.rect(ctx, x, y, w, h, color, undefined, 5) : null;
}
export function drawDetailArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 4);
}
export function formatValue(ctx, api, v) {
  return Number(v.toFixed(4)).toString();
}
export function drawFooter(ctx, api, s) {
  return drawDetailText(ctx, api, s, 960, 1015, 26, api.C.muted, 'center');
}
export function fadeDetail(ctx, api, amount, fn) {
  return api.components.fade(clamp01(amount), fn);
}
export function drawEarnedNumber(
  ctx,
  api,
  value,
  x,
  y,
  earned = true,
  color = api.C.green,
  size = 54,
) {
  return drawDetailText(
    ctx,
    api,
    earned ? value : '?',
    x,
    y,
    size,
    earned ? color : api.C.muted,
    'center',
  );
}
export function drawRow(ctx, api, values, x, y, color = api.C.cyan, step = 145, size = 38) {
  return values.forEach((v, i) =>
    drawDetailText(ctx, api, v, x + i * step, y, size, color, 'center'),
  );
}
export function drawMatrix(ctx, api, values, x, y, label, color = api.C.cyan, cell = 100) {
  const width = values[0].length * cell,
    height = values.length * cell;
  drawDetailText(ctx, api, label, x + width / 2, y - 35, 29, color, 'center');
  for (const side of [x - 9, x + width + 9]) {
    drawDetailLine(ctx, api, side, y, side, y + height, color);
    drawDetailLine(ctx, api, side, y, side + (side < x ? 10 : -10), y, color);
    drawDetailLine(ctx, api, side, y + height, side + (side < x ? 10 : -10), y + height, color);
  }
  values.forEach((r, i) =>
    r.forEach((v, j) =>
      drawDetailText(
        ctx,
        api,
        typeof v === 'number' ? formatValue(ctx, api, v) : v,
        x + (j + 0.5) * cell,
        y + (i + 0.5) * cell + 12,
        34,
        color,
        'center',
      ),
    ),
  );
}
export function drawAxis(ctx, api, x, y, width, max, label) {
  drawDetailLine(ctx, api, x, y, x + width, y);
  for (let n = 0; n <= 4; n++) {
    const value = (max * n) / 4,
      px = x + (width * n) / 4;
    drawDetailLine(ctx, api, px, y - 6, px, y + 7);
    drawDetailText(ctx, api, formatValue(ctx, api, value), px, y + 43, 26, api.C.muted, 'center');
  }
  if (label) drawDetailText(ctx, api, label, x + width / 2, y + 88, 28, api.C.muted, 'center');
}
