export function retainedDrawText(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function retainedDrawEquation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function retainedDrawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 420,
  color = api.C.cyan,
  height = 95,
  z = 32,
) {
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
export function cue(ctx, api, id, f) {
  return api.focus.progress(id, f);
}
export function text(ctx, api, v, x, y, size = 33, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, col, align);
}
export function equation(ctx, api, v, x, y, size = 43, col = api.C.yellow) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function rectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 8);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function cell(ctx, api, v, x, y, w = 600, col = api.C.blue, h = 105) {
  rectangle(ctx, api, x, y, w, h, col);
  text(ctx, api, v, x + w / 2, y + h * 0.64, 31, col, 'center');
}
