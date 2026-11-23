export function withLegacyFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawLegacyText(ctx, api, s, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawLegacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 420,
  color = api.C.cyan,
  height = 105,
  fontSize = 29,
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
    baselineOffset: fontSize * 0.34 - (String(label).split('\n').length - 1) * fontSize * 0.7,
  });
}
export function drawLegacyFooter(ctx, api, text) {
  return drawLegacyText(ctx, api, text, 960, 957, 26, api.C.muted, 'center');
}
export function drawText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v).replaceAll('_', ' '), x, y, size, color, align);
}
export function drawEquation(ctx, api, v, x, y, size = 42, color = api.C.yellow, align = 'center') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function drawCard(ctx, api, v, x, y, w = 500, h = 100, color = api.C.blue, size = 29) {
  return api.components.card({
    label: String(v).replaceAll('_', ' '),
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize: size,
    padding: 12,
    baselineOffset: size * 0.34 - (String(v).split('\n').length - 1) * size * 0.7,
  });
}
export function drawArrow(ctx, api, x, y, u, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, color, 3);
}
export function drawFooter(ctx, api, s) {
  return drawText(ctx, api, s, 960, 1020, 25, api.C.muted, 'center');
}
