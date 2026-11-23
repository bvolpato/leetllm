import { sampleFunction } from 'vizmatic';
export function withTrainingFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawTrainingText(
  ctx,
  api,
  C,
  value,
  x,
  y,
  size = 33,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawTrainingCode(ctx, api, C, value, x, y, size = 30, color = C.ink) {
  return api.text(ctx, value, x, y, size, color, 'center', 'mono');
}
export function drawTrainingMath(
  ctx,
  api,
  C,
  value,
  x,
  y,
  size = 46,
  color = C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawTrainingPanel(ctx, api, C, c, x, y, width, height, color, fn) {
  return c.panel(
    {
      x,
      y,
      width,
      height,
      fill: C.panel,
      stroke: color,
      radius: 16,
    },
    fn,
  );
}
export function drawTrainingLine(ctx, api, C, x1, y1, x2, y2, color = C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawTrainingArrow(ctx, api, C, x1, y1, x2, y2, color = C.cyan, width = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawTrainingDot(ctx, api, C, x, y, color = C.yellow, radius = 13) {
  return api.circle(ctx, x, y, radius, color);
}
export function formatTrainingNumber(ctx, api, value, places = 3) {
  return Number(value.toFixed(places)).toString();
}
export function drawTrainingMatrix(ctx, api, C, c, values, x, y, color, cell = 100) {
  return c.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 8,
    style: {
      fill: C.panel,
      stroke: color,
      textColor: color,
      fontSize: 33,
      padding: 8,
    },
  });
}
export function trainingAxes(ctx, api, t, options) {
  return t.axes({
    fontSize: 27,
    ...options,
  });
}
export function drawTrainingCurve(ctx, api, t, plot, fn, min, max, color, progress = 1) {
  return t.curve({
    plot,
    points: sampleFunction(fn, min, max, 101),
    color,
    progress,
    width: 4,
  });
}
export function drawTrainingRuler(ctx, api, C, y, prediction, target = 6, x0 = 270, scale = 220) {
  drawTrainingLine(ctx, api, C, x0, y, x0 + 7 * scale, y);
  [0, 2, 4, 6].forEach((value) => {
    drawTrainingLine(ctx, api, C, x0 + value * scale, y - 10, x0 + value * scale, y + 10);
    drawTrainingText(ctx, api, C, value, x0 + value * scale, y + 52, 27, C.muted, 'center');
  });
  drawTrainingDot(ctx, api, C, x0 + target * scale, y, C.pink);
  drawTrainingDot(ctx, api, C, x0 + prediction * scale, y, C.blue);
}
