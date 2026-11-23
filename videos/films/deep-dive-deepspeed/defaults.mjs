import { clamp } from './arithmetic.mjs';
export function drawOriginalText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalEquation(ctx, api, v, x, y, size = 48, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 350,
  color = api.C.blue,
  height = 95,
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
export function drawChapterText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawChapterCard(
  ctx,
  api,
  v,
  x,
  y,
  width = 400,
  color = api.C.blue,
  height = 90,
  size = 29,
) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width,
    height,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function drawChapterGrid(
  ctx,
  api,
  labels,
  x,
  y,
  width = 1400,
  height = 100,
  color = api.C.blue,
  size = 31,
  highlights = [],
) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    highlights,
  });
}
export function drawChapterFooter(ctx, api, text, y = 1005, color = api.C.muted) {
  return drawChapterText(ctx, api, text, 960, y, 27, color, 'center');
}
export function drawChapterValues(ctx, api, labels, items, y, color = api.C.cyan) {
  drawChapterText(ctx, api, labels, 150, y + 55, 29, color);
  return drawChapterGrid(ctx, api, [items], 660, y, 1070, 95, color, 33);
}
export function drawChapterBar(ctx, api, label, n, den, x, y, width, color) {
  drawChapterText(ctx, api, label, x, y - 14, 29, color);
  api.rect(ctx, x, y, width, 48, api.C.panel, api.C.muted, 1);
  if (n > 0) api.rect(ctx, x, y, Math.max(0.01, (width * n) / den), 48, color, undefined, 0);
}
export function drawChapterSend(ctx, api, x1, y1, x2, y2, progress, color = api.C.cyan) {
  api.line(ctx, x1, y1, x2, y2, api.C.muted, 2);
  api.components.particle({
    points: [
      {
        x: x1,
        y: y1,
      },
      {
        x: x2,
        y: y2,
      },
    ],
    progress: clamp(progress),
    radius: 8,
    fill: color,
  });
}
