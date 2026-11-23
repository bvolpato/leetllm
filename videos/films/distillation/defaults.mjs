import { WORDS } from './fixtures.mjs';
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function contractText(ctx, api, s, x, y, n = 32, c = api.C.ink) {
  return api.text(ctx, s, x, y, n, c, 'center');
}
export function contractEquation(ctx, api, s, x, y, n = 42, c = api.C.cyan) {
  return api.math(ctx, s, x, y, n, c, 'center');
}
export function contractRectangle(ctx, api, x, y, w, h, c) {
  return api.rect(ctx, x, y, w, h, c);
}
export function contractLine(ctx, api, a, b, c, d, col = api.C.muted, w = 3) {
  return api.line(ctx, a, b, c, d, col, w);
}
export function contractArrow(ctx, api, a, b, c, d, col = api.C.cyan) {
  return api.arrow(ctx, a, b, c, d, col, 4);
}
export function contractNote(ctx, api, s) {
  return contractText(ctx, api, s, 960, 1000, 28, api.C.muted);
}
export function contractTag(ctx, api, s, x, y, c = api.C.blue, w = 420) {
  contractRectangle(ctx, api, x - w / 2, y - 33, w, 66, api.C.panel);
  contractLine(ctx, api, x - w / 2, y + 35, x + w / 2, y + 35, c, 2);
  contractText(ctx, api, s, x, y + 11, 29, c);
}
export function cueComplete(ctx, api, id) {
  return cueProgress(ctx, api, id) === 1;
}
export function probabilityBar(ctx, api, v, x, y, w, h, c) {
  return contractRectangle(ctx, api, x, y - h * v, w, h * v, c);
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
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
export function distribution(
  ctx,
  api,
  values,
  x,
  y,
  color,
  label,
  progress = 1,
  height = 300,
  highlight = null,
) {
  text(ctx, api, label, x + 300, y - 65, 34, color, 'center');
  api.components.fade(progress, () =>
    api.teaching.bars({
      x,
      y,
      width: 600,
      height,
      values,
      labels: WORDS,
      color,
      colors: values.map((_, i) => (i === highlight ? api.C.yellow : color)),
      max: 1,
      progress: 1,
      showValues: true,
      format: (v) => v.toFixed(highlight === null ? 2 : 3),
      fontSize: 28,
      gap: 38,
    }),
  );
}
