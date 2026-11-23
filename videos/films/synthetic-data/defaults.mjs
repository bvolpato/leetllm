export function clauseProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function clauseComplete(ctx, api, id) {
  return clauseProgress(ctx, api, id) === 1;
}
export function centeredText(ctx, api, v, x, y, size = 32, color = api.C.ink) {
  return api.text(ctx, v, x, y, size, color, 'center');
}
export function filledRectangle(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, color);
}
export function arrow(ctx, api, x, y, a, z, color = api.C.cyan) {
  return api.arrow(ctx, x, y, a, z, color, 4);
}
export function line(ctx, api, x, y, a, z, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, a, z, color, width);
}
export function tag(ctx, api, v, x, y, color = api.C.blue, width = 650) {
  filledRectangle(ctx, api, x - width / 2, y - 39, width, 78, api.C.panel);
  line(ctx, api, x - width / 2, y + 40, x + width / 2, y + 40, color, 2);
  centeredText(ctx, api, v, x, y + 10, 30, color);
}
export function footer(ctx, api, v) {
  return centeredText(ctx, api, v, 960, 1005, 26, api.C.muted);
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, col, align);
}
export function equation(ctx, api, v, x, y, z = 42, col = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, z, col, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width = 430,
  color = api.C.cyan,
  height = 92,
  fontSize = 28,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
