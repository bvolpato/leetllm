export function drawText(ctx, api, v, x, y, n = 32, k = api.C.ink, a = 'left') {
  return api.text(ctx, String(v), x, y, n, k, a);
}
export function line(ctx, api, x, y, z, w, k = api.C.muted, n = 3) {
  return api.line(ctx, x, y, z, w, k, n);
}
export function box(ctx, api, v, x, y, w, h, k = api.C.blue, n = 30) {
  api.rect(ctx, x, y, w, h, api.C.panel, k, 2);
  drawText(ctx, api, v, x + w / 2, y + h / 2 + n * 0.32, n, k, 'center');
}
export function focus(ctx, api, id, fn) {
  return api.focus ? api.focus.target(id, fn) : fn();
}
export function sub(ctx, api, t) {
  return drawText(ctx, api, t, 960, 270, 30, api.C.muted, 'center');
}
export function drawExtendedText(ctx, api, v, x, y, n = 30, c = api.C.ink, a = 'left') {
  return api.text(ctx, String(v), x, y, n, c, a);
}
export function drawExtendedLine(ctx, api, x, y, z, w, c = api.C.muted, n = 3) {
  return api.line(ctx, x, y, z, w, c, n);
}
export function drawExtendedBox(ctx, api, v, x, y, w = 300, h = 80, c = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, c, 3);
  drawExtendedText(ctx, api, v, x + w / 2, y + h / 2 + 10, 28, c, 'center');
}
export function drawExtendedTitle(ctx, api, t) {
  return drawExtendedText(ctx, api, t, 960, 265, 29, api.C.muted, 'center');
}
