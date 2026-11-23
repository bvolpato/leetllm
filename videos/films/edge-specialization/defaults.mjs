export function edgeOriginalText(
  ctx,
  api,
  value,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, value, x, y, size, color, align);
}
export function edgeOriginalCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 90) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 14,
    baselineOffset: label.includes('\n') ? -15 : 0,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function edgeOriginalTransfer(ctx, api, from, to, color) {
  return api.connect(ctx, from, to, {
    color,
    gap: 16,
  });
}
export function drawEdgeText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawEdgeRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke) {
  return api.rect(ctx, x, y, Math.max(0.01, w), Math.max(0.01, h), fill, stroke, 0);
}
export function drawEdgeL(ctx, api, x, y, z, w, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function drawEdgeCard(ctx, api, v, x, y, w = 360, color = api.C.blue, h = 90) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fontSize: 27,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawEdgeRow(ctx, api, values, x, y, w = 1500, h = 75, color = api.C.blue) {
  return values.map((v, i) =>
    drawEdgeCard(ctx, api, v, x + (i * w) / values.length, y, w / values.length - 8, color, h),
  );
}
export function drawEdgeEquation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawEdgeMove(ctx, api, a, z, p, color = api.C.yellow) {
  drawEdgeL(ctx, api, a.x, a.y, z.x, z.y, api.C.muted, 2);
  const x = a.x + (z.x - a.x) * p,
    y = a.y + (z.y - a.y) * p;
  drawEdgeRectangle(ctx, api, x - 9, y - 9, 18, 18, color);
}
