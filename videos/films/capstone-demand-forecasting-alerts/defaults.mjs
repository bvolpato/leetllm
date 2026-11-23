import { clip } from './model.mjs';
export function text(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, v, x, y, w = 400, color = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 100,
    fontSize: 29,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function equation(ctx, api, v) {
  return api.math(ctx, v, 960, 920, 42, api.C.yellow, 'center');
}
export function drawForecastChapterText(
  ctx,
  api,
  v,
  x,
  y,
  z = 30,
  col = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, z, col, align);
}
export function drawForecastChapterEquation(ctx, api, v, x, y, z = 38, col = api.C.yellow) {
  return api.math(ctx, v, x, y, z, col, 'center');
}
export function drawForecastChapterLine(ctx, api, x, y, xx, yy, col = api.C.muted, w = 2) {
  return api.line(ctx, x, y, xx, yy, col, w);
}
export function drawForecastChapterBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 360,
  h = 80,
  col = api.C.cyan,
  z = 29,
) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, api.C.panel, col, 2);
  drawForecastChapterText(ctx, api, v, x, y + z * 0.34, z, col, 'center');
}
export function drawForecastChapterHead(ctx, api, v) {
  return drawForecastChapterText(ctx, api, v, 960, 270, 35, api.C.ink, 'center');
}
export function drawForecastChapterNote(ctx, api, v) {
  return drawForecastChapterText(ctx, api, v, 960, 1030, 25, api.C.muted, 'center');
}
export function drawForecastChapterPlot(ctx, api, x, y, w, h, xd, yd, xt, yt, xl, yl) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xd,
    yDomain: yd,
    xTicks: xt,
    yTicks: yt,
    xLabel: xl,
    yLabel: yl,
    fontSize: 24,
  });
}
export function drawForecastChapterBar(ctx, api, v, max, x, y, w, col) {
  api.rect(ctx, x, y, w, 45, api.C.panel);
  api.rect(ctx, x, y, w * clip(v / max), 45, col);
}
