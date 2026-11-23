export function parallelText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function parallelRectangle(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 8);
}
export function parallelLine(ctx, api, x, y, z, v, color = api.C.muted) {
  return api.line(ctx, x, y, z, v, color, 3);
}
export function parallelArrow(ctx, api, x, y, z, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, v, color, 3);
}
export function formatParallelNumber(ctx, api, v, d = 4) {
  return Number(v.toFixed(d)).toString();
}
export function vector(values) {
  return '[' + values.map((v) => Number(v.toFixed(4))).join(', ') + ']';
}
export function parallelFooter(ctx, api, v, color = api.C.muted) {
  return parallelText(ctx, api, v, 960, 1010, 25, color, 'center');
}
export function parallelTile(ctx, api, label, x, y, w = 170, h = 74, color = api.C.blue) {
  parallelRectangle(ctx, api, x, y, w, h, color);
  parallelText(ctx, api, label, x + w / 2, y + h / 2 + 11, 28, color, 'center');
}
export function parallelMatrix(
  ctx,
  api,
  values,
  x,
  y,
  size = 76,
  color = api.C.cyan,
  format = (v) => (typeof v === 'number' ? formatParallelNumber(ctx, api, v) : v),
) {
  return values.forEach((row, i) =>
    row.forEach((v, j) => {
      const col = typeof color === 'function' ? color(i, j) : color;
      parallelRectangle(ctx, api, x + j * (size + 6), y + i * (size + 6), size, size, col);
      parallelText(
        ctx,
        api,
        format(v),
        x + j * (size + 6) + size / 2,
        y + i * (size + 6) + size / 2 + 10,
        Math.min(28, size * 0.34),
        col,
        'center',
      );
    }),
  );
}
export function parallelBar(ctx, api, value, max, x, y, w, h, color, label) {
  parallelRectangle(ctx, api, x, y, w, h, api.C.muted, api.C.bg);
  if (value > 0) api.rect(ctx, x, y, w * Math.min(value / max, 1.18), h, color);
  if (label) parallelText(ctx, api, label, x + w + 25, y + h / 2 + 11, 29, color);
}
export function drawOriginalText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function drawOriginalEquation(ctx, api, v, x, y, z = 45, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function drawOriginalCard(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
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
export function drawOriginalMatrix(ctx, api, values, x, y, cell = 92, col = api.C.cyan, active) {
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
      fontSize: 34,
      font: 'mono',
      padding: 8,
      radius: 6,
    },
    cellStyle: (_, i, j) => ({
      fill: active?.[0] === i || active?.[1] === j ? '#f4d47728' : api.C.panel,
      textColor: active?.[0] === i || active?.[1] === j ? api.C.yellow : col,
    }),
  });
}
