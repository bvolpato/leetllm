export function largeText(ctx, api, v, x, y, n = 36, k = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, n, k, align);
}
export function largeEquation(ctx, api, v, x, y, n = 48, k = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, n, k, align);
}
export function largeMatrix(ctx, api, values, x, y, size = 105, k = api.C.cyan) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: size,
    gap: 8,
    format: (v) => (typeof v === 'number' ? Number(v.toFixed(3)) : v),
    style: {
      fill: api.C.panel,
      stroke: k,
      textColor: k,
      fontSize: 36,
      padding: 10,
      font: 'mono',
    },
  });
}
export function attentionText(ctx, api, v, x, y, z = 30, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function detailText(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 4);
}
export function card(ctx, api, v, x, y, w = 300, h = 85, col = api.C.blue, z = 30) {
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
export function title(ctx, api, v) {
  return detailText(ctx, api, v, 960, 285, 34, api.C.muted, 'center');
}
export function footer(ctx, api, v) {
  return detailText(ctx, api, v, 960, 1020, 27, api.C.muted, 'center');
}
export function patchGrid(ctx, api, rows, cols, x, y, w, h, mark = -1, col = api.C.blue) {
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++)
      api.rect(
        ctx,
        x + (k * w) / cols,
        y + (r * h) / rows,
        w / cols - 2,
        h / rows - 2,
        r * cols + k === mark ? api.C.pink : api.C.panel,
        r * cols + k === mark ? api.C.pink : col,
        1,
      );
}
export function vectorLabel(ctx, api, v) {
  return '[' + v.map((x) => (typeof x === 'number' ? Number(x.toFixed(3)) : x)).join(', ') + ']';
}
