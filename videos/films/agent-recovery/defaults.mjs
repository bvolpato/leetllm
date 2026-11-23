export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function centerText(ctx, api, s, x, y, n = 32, c = api.C.ink) {
  return api.text(ctx, s, x, y, n, c, 'center');
}
export function equation(ctx, api, s, x, y, n = 42, c = api.C.cyan) {
  return api.math(ctx, s, x, y, n, c, 'center');
}
export function rectangle(ctx, api, x, y, w, h, c) {
  return api.rect(ctx, x, y, w, h, c);
}
export function line(ctx, api, x1, y1, x2, y2, c = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, c, w);
}
export function arrow(ctx, api, x1, y1, x2, y2, c = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, c, 4);
}
export function tag(ctx, api, s, x, y, c = api.C.blue, w = 420) {
  rectangle(ctx, api, x - w / 2, y - 33, w, 66, api.C.panel);
  line(ctx, api, x - w / 2, y + 35, x + w / 2, y + 35, c, 2);
  centerText(ctx, api, s, x, y + 11, 30, c);
}
export function note(ctx, api, s) {
  return centerText(ctx, api, s, 960, 1005, 28, api.C.muted);
}
export function text(ctx, api, s, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width = 400,
  color = api.C.cyan,
  height = 104,
  fontSize = 30,
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
    baselineOffset: fontSize * (0.34 - 0.7 * (label.split('\n').length - 1)),
    padding: 12,
  });
}
