import { sum } from './arithmetic.mjs';
export function drawText(ctx, api, v, x, y, z = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawEquation(ctx, api, v, x, y, z = 48) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 450,
  color = api.C.blue,
  height = 110,
  z = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 16,
  });
}
export function drawChapterText(
  ctx,
  api,
  v,
  x,
  y,
  z = 30,
  color = api.C.ink,
  align = 'left',
  family = 'sans',
) {
  return api.text(ctx, String(v), x, y, z, color, align, family);
}
export function drawRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = api.C.muted,
  width = 2,
) {
  api.rect(ctx, x, y, w, h, fill);
  if (stroke) {
    api.line(ctx, x, y, x + w, y, stroke, width);
    api.line(ctx, x + w, y, x + w, y + h, stroke, width);
    api.line(ctx, x + w, y + h, x, y + h, stroke, width);
    api.line(ctx, x, y + h, x, y, stroke, width);
  }
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function withTarget(ctx, api, name, paint) {
  return api.focus.target(name, paint);
}
export function drawChapterCard(
  ctx,
  api,
  label,
  lines,
  x,
  y,
  w = 680,
  color = api.C.blue,
  h = 145,
  z = 28,
) {
  drawRectangle(ctx, api, x, y, w, h, api.C.panel, color);
  drawChapterText(ctx, api, label, x + 22, y + 38, z, color);
  (Array.isArray(lines) ? lines : [lines])
    .filter((v) => v !== undefined && v !== '')
    .forEach((v, i) => drawChapterText(ctx, api, v, x + 22, y + 82 + i * 37, z - 1, api.C.ink));
}
export function drawHeading(ctx, api, v) {
  return drawChapterText(ctx, api, v, 140, 286, 30, api.C.cyan);
}
export function drawTable(
  ctx,
  api,
  headers,
  rows,
  x = 140,
  y = 350,
  widths = [430, 550, 660],
  rowHeight = 115,
) {
  let xx = x;
  headers.forEach((v, i) => {
    drawChapterText(ctx, api, v, xx + 16, y + 34, 25, api.C.muted);
    xx += widths[i];
  });
  rows.forEach((row, i) => {
    let xx = x;
    row.forEach((v, j) => {
      drawChapterText(
        ctx,
        api,
        v,
        xx + 16,
        y + rowHeight * (i + 1) + 29,
        27,
        j ? api.C.ink : api.C.blue,
      );
      xx += widths[j];
    });
    drawLine(
      ctx,
      api,
      x,
      y + rowHeight * (i + 1) + 49,
      x + sum(widths),
      y + rowHeight * (i + 1) + 49,
      api.C.muted,
      1,
    );
  });
}
export function drawCells(ctx, api, labels, x, y, width = 1620, height = 90, colors = []) {
  const step = width / labels.length;
  labels.forEach((label, i) => {
    drawRectangle(
      ctx,
      api,
      x + i * step,
      y,
      step - 16,
      height,
      api.C.panel,
      colors[i] ?? api.C.blue,
    );
    drawChapterText(
      ctx,
      api,
      label,
      x + i * step + (step - 16) / 2,
      y + height / 2 + 10,
      27,
      colors[i] ?? api.C.ink,
      'center',
    );
  });
}
