import { fmt } from './arithmetic.mjs';
export function text(
  ctx,
  api,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, value, x, y, size, color, align, font);
}
export function math(ctx, api, value, x, y, size = 44, color = api.C.ink, align = 'left') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function rect(ctx, api, x, y, w, h, fill = api.C.panel, stroke, radius = 14) {
  return api.rect(ctx, x, y, w, h, fill, stroke, radius);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function circle(ctx, api, x, y, r = 12, fill = api.C.cyan, stroke, width = 2) {
  return api.circle(ctx, x, y, r, fill, stroke, width);
}
export function path(ctx, api, points, color = api.C.muted, width = 3) {
  return api.path(ctx, points, {
    color,
    width,
  });
}
export function node(ctx, api, bounds, title, color = api.C.blue, size = 32) {
  Object.assign(
    bounds,
    api.components.card({
      label: title,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      fill: api.C.panel,
      stroke: color,
      radius: 14,
      padding: 12,
      fontSize: size,
      textColor: color,
      baselineOffset: size * 0.35,
    }),
  );
  return bounds;
}
export function link(ctx, api, from, to, color = api.C.muted, width = 3) {
  from.radius ??= 14;
  to.radius ??= 14;
  return api.connect(ctx, from, to, {
    color,
    width,
    gap: 8,
  });
}
export function packet(ctx, api, points, progress, color, radius = 11) {
  return api.components.particle({
    points,
    progress,
    fill: color,
    stroke: api.C.bg,
    strokeWidth: 2,
    radius,
  });
}
export function traced(ctx, api, points, progress, color, width = 4) {
  if (progress > 0) api.trace(ctx, points, progress, color, width);
}
export function subtitle(ctx, api, value) {
  return text(ctx, api, value, 960, 965, 29, api.C.muted, 'center');
}
export function mechanismText(ctx, api, v, x, y, n = 31, c = api.C.ink) {
  return api.text(ctx, String(v), x, y, n, c, 'center');
}
export function mechanismMath(ctx, api, v, x, y, n = 43, c = api.C.ink) {
  return api.math(ctx, v, x, y, n, c, 'center');
}
export function rectangle(ctx, api, x, y, w, h, c = api.C.panel, s) {
  return w > 0 && h > 0 ? api.rect(ctx, x, y, w, h, c, s, 5) : null;
}
export function mechanismLine(ctx, api, x, y, a, z, c = api.C.muted, w = 3) {
  return api.line(ctx, x, y, a, z, c, w);
}
export function arrow(ctx, api, x, y, a, z, c = api.C.cyan, w = 4) {
  return Math.hypot(a - x, z - y) > 0.1 ? api.arrow(ctx, x, y, a, z, c, w) : null;
}
export function tag(ctx, api, v, x, y, w = 350, c = api.C.blue) {
  rectangle(ctx, api, x - w / 2, y - 30, w, 60, api.C.panel, c);
  mechanismText(ctx, api, v, x, y + 10, 28, c);
}
export function footer(ctx, api, v) {
  return mechanismText(ctx, api, v, 960, 1015, 26, api.C.muted);
}
export function tiles(ctx, api, n, x, y, color, across = 10, dx = 35, dy = 35, size = 22) {
  for (let i = 0; i < n; i++)
    rectangle(ctx, api, x + (i % across) * dx, y + Math.floor(i / across) * dy, size, size, color);
}
export function matrix(ctx, api, expertPalette, rows, x, y, cell = 65, colors = expertPalette) {
  const height = Math.min(cell, 80);
  rows.forEach((row, i) =>
    row.forEach((v, j) => {
      rectangle(
        ctx,
        api,
        x + j * cell,
        y + i * height,
        cell - 8,
        height - 8,
        api.C.panel,
        colors[j % colors.length],
      );
      mechanismText(
        ctx,
        api,
        typeof v === 'number' ? fmt(v) : v,
        x + j * cell + (cell - 8) / 2,
        y + i * height + (height - 8) / 2 + 10,
        26,
        colors[j % colors.length],
      );
    }),
  );
}
export function proportionStrip(
  ctx,
  api,
  expertPalette,
  values,
  x,
  y,
  totalWidth,
  colors = expertPalette,
) {
  let cursor = x;
  const sum = values.reduce((n, v) => n + v, 0);
  values.forEach((v, i) => {
    const w = (totalWidth * v) / sum;
    rectangle(ctx, api, cursor, y, w, 75, colors[i % colors.length]);
    cursor += w;
  });
}
