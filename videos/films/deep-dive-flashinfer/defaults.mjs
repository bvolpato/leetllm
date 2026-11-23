export function extensionText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function rect(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, Math.max(0.1, w), Math.max(0.1, h), fill, stroke, 3);
}
export function line(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function extensionCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 650,
  color = api.C.blue,
  height = 90,
  size = 28,
) {
  return api.components.card({
    label: String(label),
    x,
    y,
    width,
    height,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
    baselineOffset: String(label).includes('\n') ? -0.35 * size : undefined,
  });
}
export function header(ctx, api, v) {
  return extensionText(ctx, api, v, 960, 285, 35, api.C.cyan, 'center');
}
export function footer(ctx, api, v) {
  return extensionText(ctx, api, v, 960, 1000, 26, api.C.muted, 'center');
}
export function grid(ctx, api, labels, x, y, w, h, color = api.C.cyan, size = 28, highlights = []) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: color,
    highlights,
  });
}
export function packet(ctx, api, v, x, y, color = api.C.yellow, w = 160) {
  return extensionCard(ctx, api, v, x, y, w, color, 70, 25);
}
export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 47, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 29,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
