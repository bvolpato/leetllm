export function cueAtEnd(ctx, api, key) {
  return api.focus.progress('dp-result-' + key, 0) === 1;
}
export function cueAmount(ctx, api, key) {
  return api.focus.progress('dp-result-' + key, 0);
}
export function detailText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function detailEquation(ctx, api, v, x, y, size = 43, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function box(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 2);
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, col, align);
}
export function equation(ctx, api, v, x, y, z = 42, col = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, z, col, align);
}
export function card(ctx, api, label, x, y, width = 420, color = api.C.cyan, height = 90) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
