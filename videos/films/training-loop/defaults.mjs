export function optionalFocusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, value, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 42, color = api.C.ink, align = 'center') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 86,
  color = api.C.cyan,
  opacity = 1,
  fontSize = 30,
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
    opacity,
  });
}
export function constructionText(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 4);
}
export function box(ctx, api, v, x, y, w = 330, h = 90, col = api.C.blue, z = 30) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: z,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
    baselineOffset: z * 0.34 - (String(v).split('\n').length - 1) * z * 0.7,
  });
}
export function matrix(ctx, api, values, x, y, col = api.C.blue, size = 105) {
  return api.components.matrix({
    values: values.map((row) => row.map((v) => (Number.isFinite(v) ? +v.toFixed(3) : v))),
    x,
    y,
    cellSize: size,
    gap: 7,
    style: {
      fill: api.C.panel,
      stroke: col,
      textColor: col,
      fontSize: 32,
      padding: 8,
    },
  });
}
export function heading(ctx, api, v) {
  return constructionText(ctx, api, v, 960, 285, 34, api.C.muted, 'center');
}
export function footer(ctx, api, v) {
  return constructionText(ctx, api, v, 960, 1020, 27, api.C.muted, 'center');
}
export const vectorLabel = (v) =>
  '[' + v.map((x) => (typeof x === 'number' ? Number(x.toFixed(3)) : x)).join(', ') + ']';
