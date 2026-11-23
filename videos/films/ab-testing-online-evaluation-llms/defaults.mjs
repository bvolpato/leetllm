export function text(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 95, z = 30) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    baselineOffset: z * (0.34 - 0.7 * (label.split('\n').length - 1)),
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.border) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 12);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.border, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function box(ctx, api, lines, x, y, w, h, color = api.C.cyan, size = 29) {
  rectangle(ctx, api, x, y, w, h, api.C.panel, color);
  const list = Array.isArray(lines) ? lines : [lines],
    gap = size * 1.45,
    top = y + h / 2 - ((list.length - 1) * gap) / 2 + size * 0.32;
  list.forEach((v, i) => text(ctx, api, v, x + w / 2, top + i * gap, size, color, 'center'));
}
export function caption(ctx, api, v, color = api.C.muted) {
  return text(ctx, api, v, 960, 980, 28, color, 'center');
}
export function chip(ctx, api, v, x, y, w = 270, color = api.C.cyan) {
  return box(ctx, api, v, x, y, w, 65, color, 27);
}
export function proportionBar(
  ctx,
  api,
  label,
  value,
  x,
  y,
  w = 1100,
  color = api.C.cyan,
  showValue = true,
) {
  text(ctx, api, label, x, y - 18, 28, color);
  rectangle(ctx, api, x, y, w, 54, api.C.panel, api.C.border);
  if (value > 0) api.rect(ctx, x + 3, y + 3, (w - 6) * value, 48, color, undefined, 8);
  if (showValue) text(ctx, api, (100 * value).toFixed(1) + '%', x + w + 35, y + 38, 32, color);
}
export function axis(ctx, api, x, y, w, min, max, ticks, label) {
  line(ctx, api, x, y, x + w, y, api.C.muted, 3);
  for (const v of ticks) {
    const px = x + (w * (v - min)) / (max - min);
    line(ctx, api, px, y - 8, px, y + 8, api.C.muted, 2);
    text(ctx, api, v, px, y + 42, 25, api.C.muted, 'center');
  }
  if (label) text(ctx, api, label, x + w / 2, y + 88, 27, api.C.muted, 'center');
  return (v) => x + (w * (v - min)) / (max - min);
}
