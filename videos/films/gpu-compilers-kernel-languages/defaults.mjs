export function text(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 95, z = 30) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function transfer(ctx, api, source, target, color = api.C.cyan) {
  return api.connect(ctx, source, target, {
    color,
    gap: 16,
  });
}
export function detailText(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function codeText(ctx, api, v, x, y, z = 27, color = api.C.ink) {
  return api.text(ctx, String(v), x, y, z, color, 'left', 'mono');
}
export function detailEquation(ctx, api, v, x, y, z = 42, color = api.C.cyan) {
  return api.math(ctx, v, x, y, z, color, 'center');
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function visible(ctx, api, id) {
  return api.focus.visible(id);
}
export function after(api, id) {
  return api.focus.cue(id)?.phase === 'after';
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id);
}
export function footer(ctx, api, v) {
  return detailText(ctx, api, v, 960, 1020, 25, api.C.muted, 'center');
}
export function box(ctx, api, x, y, w, h, color = api.C.cyan) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 10);
}
export function line(ctx, api, x, y, xx, yy, color = api.C.cyan, w = 3) {
  return api.line(ctx, x, y, xx, yy, color, w);
}
export function arrow(ctx, api, x, y, xx, yy, color = api.C.cyan) {
  line(ctx, api, x, y, xx, yy, color);
  const angle = Math.atan2(yy - y, xx - x);
  line(ctx, api, xx, yy, xx - 13 * Math.cos(angle - 0.5), yy - 13 * Math.sin(angle - 0.5), color);
  line(ctx, api, xx, yy, xx - 13 * Math.cos(angle + 0.5), yy - 13 * Math.sin(angle + 0.5), color);
}
export function bar(ctx, api, x, y, w, h, value, max, color) {
  box(ctx, api, x, y, w, h, api.C.muted);
  if (value > 0) api.rect(ctx, x, y, (w * value) / max, h, color, null, 0, 3);
}
