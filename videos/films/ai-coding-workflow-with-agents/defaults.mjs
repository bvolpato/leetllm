export function text(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width = 420, color = api.C.cyan, height = 95, z = 32) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function instructionText(ctx, api, v, x, y, size = 31, col = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function heading(ctx, api, s) {
  return instructionText(ctx, api, s, 960, 280, 35, api.C.yellow);
}
export function footer(ctx, api, s) {
  return instructionText(ctx, api, s, 960, 1030, 27, api.C.muted);
}
export function box(ctx, api, v, x, y, w = 300, h = 85, col = api.C.blue, size = 31) {
  const shape = api.rect(ctx, x, y, w, h, api.C.panel, col, 7);
  instructionText(ctx, api, v, x + w / 2, y + h / 2 + size * 0.32, size, col);
  return shape;
}
export function arrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, col, 3);
}
export function line(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
