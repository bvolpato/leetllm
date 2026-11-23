import { clamp01 } from './arithmetic.mjs';
export function drawOriginalText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalEquation(ctx, api, v, x, y, size = 48) {
  return api.math(ctx, v, x, y, size, api.C.yellow, 'center');
}
export function drawOriginalCard(
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
export function drawOriginalGrid(
  ctx,
  api,
  labels,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  cellFocusTarget,
) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    cellFocusTarget,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: 36,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function drawText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawEquation(ctx, api, v, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawCard(ctx, api, label, x, y, w = 420, color = api.C.blue, h = 90) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: 27,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
    ...(label.includes('\n')
      ? {
          baselineOffset: -15,
        }
      : {}),
  });
}
export function drawGrid(ctx, api, labels, x, y, w, h, color = api.C.blue, size = 29, focus) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    cellFocusTarget: focus,
  });
}
export function drawLine(ctx, api, x, y, x2, y2, color = api.C.cyan, width = 3) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawArrow(ctx, api, x, y, x2, y2, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x, y, x2, y2, color, width);
}
export function drawBar(ctx, api, x, y, w, h, f, color) {
  api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: api.C.muted,
  });
  if (f > 0)
    api.components.panel({
      x: x + 2,
      y: y + 2,
      width: Math.max(0.01, (w - 4) * clamp01(f)),
      height: h - 4,
      fill: color,
      stroke: color,
    });
}
export function drawPathParticle(ctx, api, points, progress, color) {
  api.path(ctx, points, {
    color,
    width: 3,
  });
  api.components.particle({
    points,
    progress: clamp01(progress),
    fill: color,
    radius: 6,
  });
}
export function drawFooter(ctx, api, text) {
  return drawText(ctx, api, text, 960, 1035, 26, api.C.muted, 'center');
}
export function drawRows(ctx, api, items, y = 360, dy = 130) {
  return items.forEach((q, i) => {
    drawCard(ctx, api, q[0], 170, y + i * dy, 490, q[2] ?? api.C.blue, 80);
    drawText(ctx, api, q[1], 740, y + 52 + i * dy, 31, q[2] ?? api.C.cyan);
  });
}
