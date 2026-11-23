export function text(ctx, api, C, value, x, y, size = 34, color = C.ink, align = 'center') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function math(ctx, api, C, value, x, y, size = 48, color = C.ink) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function box(ctx, api, C, value, x, y, width, height = 90, color = C.blue, size = 32) {
  return api.components.card({
    x,
    y,
    width,
    height,
    label: String(value),
    fill: C.panel,
    stroke: color,
    textColor: color,
    radius: 10,
    fontSize: size,
    padding: 12,
    baselineOffset: String(value).includes('\n')
      ? size * (0.34 - 0.7 * (String(value).split('\n').length - 1))
      : undefined,
  });
}
export function focus(ctx, api, C, id, paint) {
  return api.focus.target(id, paint);
}
export function cells(
  ctx,
  api,
  C,
  rows,
  columns,
  x,
  y,
  cell,
  completed,
  color = C.cyan,
  retainedRows = 0,
  retainedCols = 0,
) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      const i = r * columns + c,
        old = r < retainedRows && c < retainedCols;
      api.rect(
        ctx,
        x + c * cell,
        y + r * cell,
        cell - 6,
        cell - 6,
        i < completed ? (old ? C.blue : color) : C.panel,
        C.bg,
        4,
      );
    }
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  if (Math.hypot(x2 - x1, y2 - y1) > 1) api.arrow(ctx, x1, y1, x2, y2, color, width);
}
