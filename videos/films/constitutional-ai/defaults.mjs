export function drawText(ctx, api, v, x, y, z = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, col, align);
}
export function drawEquation(ctx, api, v, x, y, z = 42, col = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, z, col, align);
}
export function drawCard(ctx, api, label, x, y, width = 440, color = api.C.cyan, height = 94) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawAuditText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawAuditEquation(ctx, api, v, x, y, size = 43, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function withFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawAuditCard(ctx, api, v, x, y, w = 500, color = api.C.blue, h = 90, size = 29) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: size,
    padding: 14,
  });
}
export function drawFooter(ctx, api, v) {
  return drawAuditText(ctx, api, v, 960, 1010, 27, api.C.muted, 'center');
}
export function drawBlock(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, color, undefined, 6);
}
