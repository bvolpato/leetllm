export function text(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 110,
  fontSize = 27,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 12,
  });
}
export function foot(ctx, api, s) {
  return text(ctx, api, s, 960, 956, 25, api.C.muted, 'center');
}
export function drawAdvancedText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawAdvancedEquation(ctx, api, v, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawAdvancedTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawAdvancedCard(
  ctx,
  api,
  v,
  x,
  y,
  width = 520,
  color = api.C.blue,
  height = 96,
  size = 30,
) {
  return api.components.card({
    label: v,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: size,
    padding: 12,
  });
}
export function drawAdvancedFooter(ctx, api, v) {
  return drawAdvancedText(ctx, api, v, 960, 1015, 27, api.C.muted, 'center');
}
export function drawAdvancedArrow(ctx, api, a, z, color = api.C.yellow) {
  return api.arrow(ctx, a.x, a.y, z.x, z.y, color, 5);
}
