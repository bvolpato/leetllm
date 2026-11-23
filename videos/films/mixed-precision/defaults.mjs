export function extensionText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function extensionEquation(ctx, api, v, x, y, size = 43, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function extensionBox(ctx, api, x, y, w, h, col) {
  return api.rect(ctx, x, y, w, h, api.C.panel, col, 2);
}
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
export function numberGrid(ctx, api, values, low, high, y, color, label) {
  text(ctx, api, label, 250, y - 125, 33, color);
  api.line(ctx, 280, y, 1650, y, api.C.muted, 3);
  values.forEach((v) => {
    const x = 280 + ((v - low) / (high - low)) * 1370;
    api.line(ctx, x, y - 18, x, y + 18, color, 3);
    api.circle(ctx, x, y, 5, color);
  });
  return (v) => 280 + ((v - low) / (high - low)) * 1370;
}

export function valueBox(ctx, api, value, x, y, width, color, size = 30, height = 90) {
  api.rect(ctx, x, y, width, height, api.C.panel, color, 2);
  text(ctx, api, String(value), x + width / 2, y + height / 2 + size * 0.32, size, color, 'center');
}

export function movingValue(ctx, api, from, to, progress, color) {
  if (progress <= 0 || progress >= 1) return;
  const x = from[0] + (to[0] - from[0]) * progress;
  const y = from[1] + (to[1] - from[1]) * progress;
  api.circle(ctx, x, y, 10, color);
}
