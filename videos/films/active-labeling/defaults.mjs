export function text(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width, color = api.C.blue, height = 90, fontSize = 28) {
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
export function detailText(ctx, api, s, x, y, n = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, n, col, align);
}
export function detailEquation(ctx, api, s, x, y, n = 40, col = api.C.yellow) {
  return api.math(ctx, s, x, y, n, col, 'center');
}
export function detailRectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 4);
}
export function detailLine(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function detailArrow(ctx, api, x, y, u, v, col = api.C.blue) {
  return api.arrow(ctx, x, y, u, v, col, 3);
}
export function detailTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function detailHeading(ctx, api, s) {
  return detailText(ctx, api, s, 960, 265, 35, api.C.blue, 'center');
}
export function detailFooter(ctx, api, s) {
  return detailText(ctx, api, s, 960, 1025, 27, api.C.yellow, 'center');
}
export function detailRow(ctx, api, s, x, y, w, col = api.C.blue) {
  const a = detailRectangle(ctx, api, x, y, w, 70, col);
  detailText(ctx, api, s, x + 18, y + 47, 27, col);
  return a;
}
export function cueComplete(ctx, api, id) {
  return cueProgress(ctx, api, id) === 1;
}
