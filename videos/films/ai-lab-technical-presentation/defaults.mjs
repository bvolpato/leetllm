export function chapterText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 39, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function panel(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
  });
}
export function focusTargets(ctx, api, ids, fn) {
  const recurse = (i) =>
    i < ids.length ? api.focus.target(ids[i] + '-state', () => recurse(i + 1)) : fn();
  return recurse(0);
}
export function footer(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 1005, 25, api.C.muted, 'center');
}
export function sheet(ctx, api, x, y, w, h, title, color = api.C.blue) {
  panel(ctx, api, x, y, w, h, color);
  chapterText(ctx, api, title, x + 24, y + 45, 29, color);
  api.line(ctx, x + 20, y + 67, x + w - 20, y + 67, api.C.muted, 1);
}
export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 94, fontSize = 29) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
