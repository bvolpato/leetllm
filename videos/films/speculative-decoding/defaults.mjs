import { WORDS } from './fixtures.mjs';
export function originalText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function originalEquation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function originalCard(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
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
export function originalBars(ctx, api, values, x, y, color, label, height = 270) {
  originalText(ctx, api, label, x + 300, y - 65, 34, color, 'center');
  return api.teaching.bars({
    x,
    y,
    width: 600,
    height,
    values,
    labels: WORDS,
    color,
    max: 0.6,
    showValues: true,
    format: (v) => v.toFixed(2),
    fontSize: 29,
    gap: 55,
  });
}
export function drawConstructionsText(
  ctx,
  api,
  s,
  x,
  y,
  z = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, z, color, align);
}
export function drawConstructionsEquation(ctx, api, s, x, y, z = 43, color = api.C.ink) {
  return api.math(ctx, s, x, y, z, color, 'center');
}
export function drawConstructionsLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function drawConstructionsBox(ctx, api, s, x, y, w = 350, color = api.C.blue, h = 78) {
  return api.components.card({
    label: s,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 10,
  });
}
export function drawConstructionsCenter(ctx, api, s, y, color = api.C.muted, z = 29) {
  return drawConstructionsText(ctx, api, s, 960, y, z, color, 'center');
}
export function drawConstructionsMass(
  ctx,
  api,
  values,
  x,
  y,
  w = 650,
  h = 270,
  color = api.C.blue,
  labels = ['ID 0', 'ID 1', 'ID 2'],
  max = 1,
) {
  return api.teaching.bars({
    x,
    y,
    width: w,
    height: h,
    values,
    labels,
    max,
    color,
    showValues: true,
    format: (v) => v.toFixed(3),
    fontSize: 28,
    gap: 50,
  });
}
