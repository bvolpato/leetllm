import { ANGLES, START } from './fixtures.mjs';
import { formatValue, vector } from './arithmetic.mjs';
export function originalText(ctx, api, s, x, y, z = 34, col = api.C.ink, a = 'left') {
  return api.text(ctx, s, x, y, z, col, a);
}
export function originalMath(ctx, api, s, x, y, z = 46, col = api.C.ink, a = 'left') {
  return api.math(ctx, s, x, y, z, col, a);
}
export function originalCircle(ctx, api, colors, angle = START, vectorColors = colors) {
  const plot = api.teaching.axes({
      x: 330,
      y: 330,
      width: 530,
      height: 530,
      equalUnits: true,
      xDomain: [-1.25, 1.25],
      yDomain: [-1.25, 1.25],
      xTicks: [-1, 0, 1],
      yTicks: [-1, 0, 1],
      fontSize: 28,
    }),
    origin = plot.point(0, 0);
  api.teaching.curve({
    plot,
    points: Array.from(
      {
        length: 121,
      },
      (_, i) => ({
        x: Math.cos((i / 120) * Math.PI * 2),
        y: Math.sin((i / 120) * Math.PI * 2),
      }),
    ),
    color: '#8d9cb94d',
    width: 2,
  });
  [...ANGLES, angle].forEach((v, i) => {
    const xy = vector(v),
      at = plot.point(...xy);
    api.focus.target('candidate-vector-' + i, () =>
      api.arrow(
        ctx,
        origin.x,
        origin.y,
        at.x,
        at.y,
        i === 3 ? api.C.yellow : vectorColors[i],
        i === 3 ? 6 : 3,
      ),
    );
    api.focus.target('candidate-vector-' + i, () =>
      api.circle(ctx, at.x, at.y, 10, i === 3 ? api.C.yellow : vectorColors[i]),
    );
  });
  return plot;
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
export function drawNote(ctx, api, v, col = api.C.muted) {
  return drawText(ctx, api, v, 960, 1015, 26, col);
}
export function drawPill(ctx, api, v, x, y, w = 430, col = api.C.blue) {
  drawRectangle(ctx, api, x - w / 2, y - 34, w, 68, api.C.panel, col);
  drawText(ctx, api, v, x, y + 11, 29, col);
}
export function drawCells(ctx, api, values, x, y, w = 160, h = 70, col = api.C.blue, shown = true) {
  return values.forEach((v, i) => {
    drawRectangle(ctx, api, x + i * w, y, w - 12, h, api.C.panel, col);
    if (shown)
      drawText(
        ctx,
        api,
        typeof v === 'number' ? formatValue(v, 2) : v,
        x + i * w + (w - 12) / 2,
        y + h * 0.65,
        28,
        col,
      );
  });
}
export function drawMatrix(
  ctx,
  api,
  rows,
  x,
  y,
  w = 130,
  h = 85,
  highlight = () => false,
  visible = true,
) {
  return rows.forEach((row, i) =>
    row.forEach((v, j) => {
      drawRectangle(
        ctx,
        api,
        x + j * w,
        y + i * h,
        w - 8,
        h - 8,
        api.C.panel,
        highlight(i, j) ? api.C.green : api.C.border,
      );
      if (visible)
        drawText(
          ctx,
          api,
          typeof v === 'number' ? formatValue(v, 3) : v,
          x + j * w + (w - 8) / 2,
          y + i * h + (h - 8) * 0.64,
          27,
          highlight(i, j) ? api.C.green : api.C.ink,
        );
    }),
  );
}
export function drawAxis(ctx, api, x, y, w, h, xdom, ydom) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xdom,
    yDomain: ydom,
    xTicks: [],
    yTicks: [],
    equalUnits: false,
    fontSize: 25,
  });
}
export function drawRowBars(
  ctx,
  api,
  values,
  labels,
  y = 520,
  max = 1,
  cols = [api.C.green, api.C.pink, api.C.blue],
  visible = true,
) {
  values.forEach((v, i) => {
    const x = 300 + i * 540;
    drawText(ctx, api, labels[i], x + 210, y - 60, 29, cols[i]);
    drawRectangle(ctx, api, x, y, 420, 220, api.C.panel);
    if (v > 0) drawRectangle(ctx, api, x, y + 220 - (220 * v) / max, 420, (220 * v) / max, cols[i]);
    if (visible) drawText(ctx, api, formatValue(v, 4), x + 210, y + 280, 34, cols[i]);
  });
}
export function drawStrip(ctx, api, values, x, y, w = 150, col = api.C.blue) {
  return values.forEach((v, i) => {
    drawRectangle(ctx, api, x + i * w, y, w - 10, 70, api.C.panel, col);
    drawText(ctx, api, v, x + i * w + (w - 10) / 2, y + 46, 28, col);
  });
}
