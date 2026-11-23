export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 46, col = api.C.ink, a = 'center') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, label, x, y, width = 420, color = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 92,
    fontSize: 29,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function extensionEquation(ctx, api, v, x, y, z = 44, col = api.C.ink) {
  return api.math(ctx, v, x, y, z, col, 'center');
}
export function matrix(ctx, api, values, x, y, color, size = 150) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: size,
    gap: 10,
    format: (v) => Number(v.toFixed(2)).toString(),
    style: {
      fill: api.C.panel,
      stroke: color,
      textColor: color,
      fontSize: 44,
      font: 'mono',
    },
  });
}
