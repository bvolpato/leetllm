export function detailText(ctx, api, text, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(text).replaceAll('_', ' '), x, y, size, color, align);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 5);
}
export function line(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function arrow(ctx, api, x, y, u, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, color, 3);
}
export function equation(ctx, api, text, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, text, x, y, size, color, 'center');
}
export function cueStarted(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function fade(ctx, api, amount, fn) {
  return api.components.fade(amount, fn);
}
export function heading(ctx, api, text) {
  return detailText(ctx, api, text, 960, 277, 35, api.C.blue, 'center');
}
export function footer(ctx, api, text) {
  return detailText(ctx, api, text, 960, 1024, 26, api.C.yellow, 'center');
}
export function sourcePage(ctx, api, x, y, w, h, label, lines = [], color = api.C.blue) {
  const box = rectangle(ctx, api, x, y, w, h, color);
  detailText(ctx, api, label, x + 22, y + 43, 27, color);
  line(ctx, api, x + 18, y + 64, x + w - 18, y + 64, api.C.muted, 1);
  lines.forEach((line, i) => detailText(ctx, api, line, x + 22, y + 112 + i * 44, 25, api.C.ink));
  return box;
}
export function recordField(ctx, api, label, value, x, y, w = 650, color = api.C.blue) {
  rectangle(ctx, api, x, y, w, 67, color);
  detailText(ctx, api, label, x + 16, y + 24, 21, api.C.muted);
  detailText(ctx, api, value, x + w - 16, y + 55, 27, color, 'right');
}
export function optionalFocusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, text, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function labelCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 84,
  fontSize = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
export function connectRoute(ctx, api, from, to, progress, color = api.C.cyan) {
  return api.components.fade(progress, () =>
    api.connect(ctx, from, to, {
      color,
      gap: 15,
    }),
  );
}
