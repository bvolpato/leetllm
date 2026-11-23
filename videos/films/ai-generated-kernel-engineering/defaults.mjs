export function drawText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawEquation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 95, z = 30) {
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
export function drawChapterText(ctx, api, s, x, y, n = 30, c = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, n, c, align);
}
export function formatValue(ctx, api, x, d = 4) {
  return Number.isFinite(x) ? x.toFixed(d) : String(x);
}
export function drawRow(ctx, api, v, x, y, w = 1200, color = api.C.cyan, h = 72) {
  const step = w / v.length;
  v.forEach((z, i) => {
    api.rect(ctx, x + i * step, y, step - 8, h, api.C.panel, color, 2, 6);
    drawChapterText(
      ctx,
      api,
      typeof z === 'number' ? formatValue(ctx, api, z) : z,
      x + (i + 0.5) * step - 4,
      y + h / 2 + 10,
      v.length > 8 ? 25 : 30,
      color,
      'center',
    );
  });
}
export function drawTitle(ctx, api, a, z) {
  drawChapterText(ctx, api, a, 960, 275, 35, api.C.yellow, 'center');
  if (z) drawChapterText(ctx, api, z, 960, 330, 27, api.C.muted, 'center');
}
export function drawNote(ctx, api, s) {
  return drawChapterText(ctx, api, s, 960, 980, 27, api.C.muted, 'center');
}
export function drawArrow(ctx, api, x, y, xx, yy, c = api.C.cyan) {
  return api.arrow(ctx, x, y, xx, yy, c, 4);
}
