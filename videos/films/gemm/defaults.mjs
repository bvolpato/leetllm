export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 90,
    fontSize: 31,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
  });
}
export function matrix(ctx, api, values, x, y, cell = 105, col = api.C.cyan, highlight) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 8,
    format: String,
    style: {
      fill: api.C.panel,
      stroke: col,
      textColor: col,
      fontSize: 36,
      font: 'mono',
      padding: 8,
      radius: 6,
    },
    cellStyle: (_, i, j) => ({
      fill: highlight?.(i, j) ? '#f4d47730' : api.C.panel,
      textColor: highlight?.(i, j) ? api.C.yellow : col,
    }),
  });
}
export function detailText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, col, align);
}
export function detailEquation(ctx, api, v, x, y, size = 42, col = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, size, col, align);
}
export function borderedRect(ctx, api, x, y, w, h, color, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 0);
}
export function line(ctx, api, x, y, x2, y2, color, width = 3) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function compactMatrix(
  ctx,
  api,
  values,
  x,
  y,
  cell = 65,
  col = api.C.cyan,
  highlight = () => false,
) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 6,
    format: String,
    style: {
      fill: api.C.panel,
      stroke: col,
      textColor: col,
      fontSize: 28,
      font: 'mono',
      padding: 6,
      radius: 3,
    },
    cellStyle: (_, i, j) => ({
      fill: highlight(i, j) ? '#f4d47730' : api.C.panel,
      textColor: highlight(i, j) ? api.C.yellow : col,
    }),
  });
}
