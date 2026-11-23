export function mechanismText(ctx, api, v, x, y, size = 32, col = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    col,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function mechanismEquation(ctx, api, v, x, y, size = 44, col = api.C.ink) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function mechanismBox(ctx, api, x, y, w, h, col) {
  return api.rect(ctx, x, y, w, h, api.C.panel, col, 2);
}
export function mechanismFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, value, x, y, size = 25, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function math(ctx, api, value, x, y, size = 38, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width, height = 78, color = api.C.cyan, fontSize = 23) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize,
    padding: 12,
  });
}
export function bar(ctx, api, x, y, value, max, color, label, total) {
  text(ctx, api, label, x, y + 28, 23, api.C.ink);
  api.rect(ctx, x + 260, y, (750 * value) / max, 48, color, api.C.panel, 2);
  text(ctx, api, total, x + 1040, y + 32, 25, color, 'right');
}
