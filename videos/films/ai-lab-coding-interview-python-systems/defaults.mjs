import { clamp, smooth } from './arithmetic.mjs';
export function drawText(ctx, api, value, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 42,
  color = api.C.yellow,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 92,
  fontSize = 30,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawChapterText(ctx, api, v, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawChapterCard(ctx, api, v, x, y, w, h = 90, color = api.C.blue, size = 27) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: size,
    padding: 12,
  });
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function drawArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 4);
}
export function drawHeading(ctx, api, v) {
  return drawChapterText(ctx, api, v, 960, 295, 31, api.C.ink, 'center');
}
export function drawFooter(ctx, api, v, color = api.C.muted) {
  return drawChapterText(ctx, api, v, 960, 1015, 25, color, 'center');
}
export function drawRow(ctx, api, values, x, y, w = 1320, h = 90, color = api.C.blue, size = 27) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: 1,
    columns: values.length,
    labels: [values],
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize: size,
  });
}
export function drawMovingCard(
  ctx,
  api,
  label,
  x0,
  y0,
  x1,
  y1,
  progress,
  color = api.C.cyan,
  w = 200,
) {
  return drawChapterCard(
    ctx,
    api,
    label,
    x0 + (x1 - x0) * smooth(clamp(progress)),
    y0 + (y1 - y0) * smooth(clamp(progress)),
    w,
    70,
    color,
    25,
  );
}
