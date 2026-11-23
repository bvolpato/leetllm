export function incidentText(ctx, api, value, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function incidentMath(
  ctx,
  api,
  value,
  x,
  y,
  size = 38,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function formatNumber(ctx, api, value, digits = 3) {
  return Number(value).toFixed(digits);
}
export function formatVector(ctx, api, values) {
  return '[' + values.map((value) => formatNumber(ctx, api, value)).join(', ') + ']';
}
export function incidentMatrix(ctx, api, values, x, y, color = api.C.cyan, cellSize = 68) {
  return api.components.matrix({
    values: values.map((row) =>
      row.map((value) => (typeof value === 'number' ? Number(value.toFixed(3)) : value)),
    ),
    x,
    y,
    cellSize,
    gap: 7,
    style: {
      fill: api.C.panel,
      stroke: color,
      textColor: color,
      fontSize: Math.min(24, cellSize * 0.22),
      padding: 8,
    },
  });
}
export function strokeLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function strokeArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 3) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function incidentNote(ctx, api, value) {
  return incidentText(ctx, api, value, 960, 1007, 26, api.C.muted, 'center');
}
export function incidentAxis(ctx, api, x, y, width, min, max) {
  strokeLine(ctx, api, x, y, x + width, y, api.C.muted, 2);
  [min, 0, max]
    .filter((v, i, a) => a.indexOf(v) === i)
    .forEach((value) => {
      const px = x + (width * (value - min)) / (max - min);
      strokeLine(ctx, api, px, y - 8, px, y + 8, api.C.muted, 2);
      incidentText(
        ctx,
        api,
        formatNumber(ctx, api, value, 1),
        px,
        y + 38,
        23,
        api.C.muted,
        'center',
      );
    });
  return (value) => x + (width * (value - min)) / (max - min);
}
export function incidentRoute(ctx, api, from, to, progress, color) {
  strokeLine(ctx, api, from.x, from.y, to.x, to.y, api.C.border, 3);
  if (progress > 0 && progress < 1)
    api.circle(
      ctx,
      api.lerp(from.x, to.x, progress),
      api.lerp(from.y, to.y, progress),
      8,
      color,
      color,
      1,
    );
}
export function resetText(ctx, api, v, x, y, z = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, color, align);
}
export function resetMath(ctx, api, v, x, y, z = 36, color = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, z, color, align);
}
export function resetGrid(ctx, api, values, x, y, color, width = 400) {
  return api.teaching.grid({
    x,
    y,
    width,
    height: 65,
    rows: 1,
    columns: 2,
    labels: [values.map((value) => (typeof value === 'number' ? value.toFixed(3) : value))],
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 28,
  });
}
export function text(ctx, api, v, x, y, z = 36, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, k, a);
}
export function math(ctx, api, v, x, y, z = 48, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, k, a);
}
export function card(ctx, api, label, x, y, width = 240, color = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 94,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 36,
    padding: 16,
  });
}
export function footer(ctx, api, v) {
  return text(ctx, api, v, 960, 945, 36, api.C.muted, 'center');
}
