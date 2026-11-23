export function drawOriginalText(ctx, api, v, x, y, z = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 450,
  color = api.C.blue,
  height = 110,
  z = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 15,
  });
}
export function drawCoreText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    col,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawCoreRectangle(ctx, api, x, y, w, h, col, fill = true) {
  if (w > 0 && h > 0)
    api.rect(ctx, x, y, w, h, fill ? col : api.C.panel, fill ? undefined : col, 3);
}
export function drawCoreLine(ctx, api, x, y, u, v, col = api.C.muted) {
  return api.line(ctx, x, y, u, v, col, 2);
}
export function drawCoreCell(ctx, api, v, x, y, w = 420, h = 85, col = api.C.cyan) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fontSize: 28,
    font: String(v).includes('_') ? 'mono' : 'sans',
    padding: 10,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
  });
}
export function drawCoreNote(ctx, api, v, col = api.C.muted) {
  return drawCoreText(ctx, api, v, 960, 980, 27, col, 'center');
}
