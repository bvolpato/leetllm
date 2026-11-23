export function drawOriginalFlashText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function drawOriginalFlashEquation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function drawOriginalFlashCard(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 90,
    fontSize: 31,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
  });
}
export function drawOriginalFlashMatrix(ctx, api, values, x, y, cell = 90, color = api.C.cyan) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 8,
    format: (v) => (typeof v === 'number' ? Number(v.toFixed(3)).toString() : v),
    style: {
      fill: api.C.panel,
      stroke: color,
      textColor: color,
      fontSize: 31,
      font: 'mono',
      radius: 6,
      padding: 6,
    },
  });
}
export function drawFlashExtensionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawFlashExtensionEquation(
  ctx,
  api,
  v,
  x,
  y,
  size = 40,
  color = api.C.ink,
  align = 'left',
) {
  return api.math(ctx, v, x, y, size, color, align);
}
export function drawFlashExtensionRectangle(ctx, api, x, y, w, h, color = api.C.blue, stroke) {
  return api.rect(ctx, x, y, Math.max(0.5, w), Math.max(0.5, h), color, stroke, 3);
}
export function drawFlashExtensionL(ctx, api, pts, color = api.C.muted, width = 3) {
  return api.path(ctx, pts, {
    color,
    width,
  });
}
export function drawFlashExtensionDot(ctx, api, x, y, color = api.C.cyan, r = 10) {
  return api.circle(ctx, x, y, r, color);
}
export function drawFlashExtensionFooter(ctx, api, s, col = api.C.muted) {
  return drawFlashExtensionText(ctx, api, s, 960, 988, 27, col, 'center');
}
export function drawFlashExtensionNum(ctx, api, label, value, y, color = api.C.cyan) {
  drawFlashExtensionText(ctx, api, label, 1540, y, 28, api.C.muted, 'center');
  drawFlashExtensionText(ctx, api, value, 1540, y + 58, 39, color, 'center');
}
export function drawFlashExtensionPlot(ctx, api, xd, yd, xLabel = '', yLabel = '') {
  return api.teaching.axes({
    x: 250,
    y: 365,
    width: 1030,
    height: 455,
    xDomain: xd,
    yDomain: yd,
    xTicks: Array.from(
      {
        length: 5,
      },
      (_, i) => Number((xd[0] + (i * (xd[1] - xd[0])) / 4).toPrecision(5)),
    ),
    yTicks: Array.from(
      {
        length: 3,
      },
      (_, i) => Number((yd[0] + (i * (yd[1] - yd[0])) / 2).toPrecision(5)),
    ),
    xLabel,
    yLabel,
  });
}
export function drawFlashExtensionCurve(ctx, api, q, fn, min, max, col = api.C.blue) {
  return api.teaching.curve({
    plot: q,
    points: Array.from(
      {
        length: 151,
      },
      (_, i) => {
        const x = min + ((max - min) * i) / 150;
        return {
          x,
          y: fn(x),
        };
      },
    ),
    color: col,
    width: 4,
  });
}
