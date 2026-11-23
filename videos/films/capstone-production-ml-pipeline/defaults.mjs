export function text(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function legacyCard(ctx, api, v, x, y, w = 430, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function panel(ctx, api, x, y, w, h, col = api.C.muted, fill = api.C.panel) {
  return w > 0 && h > 0
    ? api.components.panel({
        x,
        y,
        width: w,
        height: h,
        fill,
        stroke: col,
        padding: 12,
      })
    : null;
}
export function card(ctx, api, v, x, y, w = 600, h = 90, col = api.C.blue, z = 29) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
    fontSize: z,
    font: String(v).includes('_') ? 'mono' : 'sans',
    baselineOffset: z * (0.34 - 0.7 * (String(v).split('\n').length - 1)),
    padding: 14,
  });
}
export function arrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan, q = 1) {
  if (q > 0) api.arrow(ctx, x1, y1, x1 + (x2 - x1) * q, y1 + (y2 - y1) * q, col, 4);
}
export function line(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
