export function text(ctx, api, value, x, y, size = 34, color = api.C.ink, align = 'center') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 46, color = api.C.ink, align = 'center') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  color = api.C.blue,
  width = 390,
  height = 82,
  opacity = 1,
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
    fontSize: 30,
    padding: 12,
    opacity,
  });
}
export function drawChapterText(ctx, api, s, x, y, size = 31, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawChapterRectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, Math.max(0.01, w), h, fill, color, 5);
}
export function drawChapterLine(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function drawChapterFooter(ctx, api, s) {
  return drawChapterText(ctx, api, s, 960, 1020, 25, api.C.muted);
}
export function drawChapterBar(ctx, api, x, y, w, h, f, color) {
  if (f > 0) api.rect(ctx, x, y, Math.max(0.01, w * api.clamp(f)), h, color, undefined, 0);
}
export function drawChapterTag(ctx, api, s, x, y, color = api.C.blue, w = 420) {
  drawChapterRectangle(ctx, api, x - w / 2, y - 40, w, 72, color);
  drawChapterText(ctx, api, s, x, y + 7, 28, color);
}
export function drawChapterRows(ctx, api, items, y = 390, step = 145) {
  return items.forEach((r, i) => {
    drawChapterText(ctx, api, r.label, 200, y + i * step, 28, r.color ?? api.C.ink, 'left');
    drawChapterText(ctx, api, r.value, 1720, y + i * step, 31, r.color ?? api.C.ink, 'right');
  });
}
export function drawChapterFlow(ctx, api, a, z, p, color = api.C.yellow) {
  drawChapterLine(ctx, api, a.x, a.y, z.x, z.y, color, 2);
  const t = api.clamp(p);
  api.circle(ctx, a.x + (z.x - a.x) * t, a.y + (z.y - a.y) * t, 8, color);
}
