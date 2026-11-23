export function cueProgress(ctx, api, sceneId, key) {
  return api.focus?.progress(`m-${sceneId}-${key}`, 0) ?? 0;
}
export function cueVisible(ctx, api, sceneId, key) {
  return Boolean(api.focus?.visible(`m-${sceneId}-${key}`));
}
export function text(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function panel(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill,
    stroke: color,
    radius: 14,
  });
}
export function chip(ctx, api, v, x, y, w = 250, color = api.C.cyan, h = 66, size = 28) {
  panel(ctx, api, x, y, w, h, color);
  text(ctx, api, v, x + w / 2, y + h / 2 + 10, size, color);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function dot(ctx, api, x, y, color = api.C.cyan, r = 10) {
  return api.circle(ctx, x, y, r, color);
}
export function fade(ctx, api, q, draw) {
  if (q > 0) api.components.fade(q, draw);
}
export function footer(ctx, api, v, color = api.C.muted) {
  return text(ctx, api, v, 960, 936, 27, color);
}
export function columns(ctx, api, headings, ys = 290) {
  return headings.forEach(([v, x]) => text(ctx, api, v, x, ys, 25, api.C.muted));
}
