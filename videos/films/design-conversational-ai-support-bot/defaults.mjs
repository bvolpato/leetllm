export function text(ctx, api, value, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width = 440, color = api.C.blue, height = 100) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function supportCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function supportCueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function drawSupportText(ctx, api, s, x, y, n = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, n, col, align);
}
export function drawSupportRectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 6);
}
export function drawSupportLine(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function drawSupportArrow(ctx, api, x, y, u, v, col = api.C.blue) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function withSupportFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawSupportHeading(ctx, api, s) {
  return drawSupportText(ctx, api, s, 960, 275, 36, api.C.blue, 'center');
}
export function drawSupportFooter(ctx, api, s) {
  return drawSupportText(ctx, api, s, 960, 1020, 28, api.C.yellow, 'center');
}
export function drawSupportRow(ctx, api, s, x, y, w, col = api.C.blue) {
  const a = drawSupportRectangle(ctx, api, x, y, w, 64, col);
  drawSupportText(ctx, api, s, x + 18, y + 43, 27, col);
  return a;
}
export function drawSupportPill(ctx, api, s, x, y, w, col = api.C.blue) {
  const a = drawSupportRectangle(ctx, api, x, y, w, 86, col);
  drawSupportText(ctx, api, s, x + w / 2, y + 54, 28, col, 'center');
  return a;
}
