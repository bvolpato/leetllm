export function text(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function code(ctx, api, v, x, y, z = 32, color = api.C.ink) {
  return api.text(ctx, v, x, y, z, color, 'left', 'mono');
}
export function card(ctx, api, v, x, y, w = 570, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function completionText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function completionCode(ctx, api, v, x, y, size = 30, color = api.C.ink) {
  return api.text(ctx, v, x, y, size, color, 'left', 'mono');
}
export function completionBox(ctx, api, v, x, y, w = 440, h = 82, color = api.C.cyan) {
  const r = api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 6);
  completionText(ctx, api, v, x + w / 2, y + h / 2 + 10, 30, color, 'center');
  return r;
}
export function completionFooter(ctx, api, v) {
  return completionText(ctx, api, v, 960, 1010, 27, api.C.muted, 'center');
}
export function completionHeading(ctx, api, v) {
  return completionText(ctx, api, v, 960, 280, 35, api.C.yellow, 'center');
}
