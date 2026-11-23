export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function cueComplete(ctx, api, id) {
  return cueProgress(ctx, api, id) === 1;
}
export function contractText(ctx, api, v, x, y, size = 32, color = api.C.ink) {
  return api.text(ctx, v, x, y, size, color, 'center');
}
export function rectangle(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, color);
}
export function arrow(ctx, api, x, y, a, z, color = api.C.cyan) {
  return api.arrow(ctx, x, y, a, z, color, 4);
}
export function line(ctx, api, x, y, a, z, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, a, z, color, width);
}
export function tag(ctx, api, v, x, y, color = api.C.blue, width = 620) {
  rectangle(ctx, api, x - width / 2, y - 36, width, 72, api.C.panel);
  line(ctx, api, x - width / 2, y + 37, x + width / 2, y + 37, color, 2);
  contractText(ctx, api, v, x, y + 11, 29, color);
}
export function footer(ctx, api, v) {
  return contractText(ctx, api, v, 960, 1005, 27, api.C.muted);
}
function drawText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export { drawText };
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
    baselineOffset: fontSize * (0.34 - 0.7 * (label.split('\n').length - 1)),
    padding: 12,
  });
}
