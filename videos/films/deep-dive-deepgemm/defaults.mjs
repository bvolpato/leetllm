import { bounded } from './arithmetic.mjs';
export const fmt = (value) =>
  Number.isInteger(value) ? String(value) : Number(value.toFixed(3)).toString();
export function drawOriginalText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalEquation(ctx, api, v, x, y, size = 47, color = api.C.yellow) {
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
export function drawText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawEquation(ctx, api, v, x, y, size = 46, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawBox(
  ctx,
  api,
  label,
  x,
  y,
  width = 350,
  height = 85,
  color = api.C.blue,
  size = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: size,
    padding: 14,
    baselineOffset: size * (0.34 - 0.7 * (label.split('\n').length - 1)),
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawLink(ctx, api, from, to, p = 1, color = api.C.blue) {
  return api.teaching.transfer({
    source: {
      shape: from,
      opacity: 1,
    },
    target: {
      shape: to,
      opacity: 1,
    },
    progress: bounded(p),
    color,
    particle: {
      radius: 6,
      fill: color,
    },
    gap: 20,
  });
}
export function drawGrid(
  ctx,
  api,
  labels,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  size = 32,
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
export function drawSubtitle(ctx, api, text, color = api.C.blue) {
  return drawText(ctx, api, text, 960, 275, 34, color, 'center');
}
export function drawFooter(ctx, api, text, color = api.C.muted) {
  return drawText(ctx, api, text, 960, 1005, 28, color, 'center');
}
