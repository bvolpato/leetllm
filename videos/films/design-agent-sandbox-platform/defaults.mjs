export function drawLegacyText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawLegacyEquation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawLegacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 95,
  z = 30,
) {
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
export function drawText(
  ctx,
  api,
  v,
  x,
  y,
  size = 29,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, size, color, align, font);
}
export function drawRectangle(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 9);
}
export function drawLine(ctx, api, x, y, z, v, col = api.C.muted) {
  return api.line(ctx, x, y, z, v, col, 3);
}
export function drawArrow(ctx, api, x, y, z, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, z, v, col, 3);
}
export function drawParagraph(ctx, api, v, x, y, width = 1600, size = 28, color = api.C.ink) {
  let row = '',
    n = 0;
  for (const w of v.split(' ')) {
    if ((row + ' ' + w).length > width / (size * 0.56)) {
      drawText(ctx, api, row, x, y + n * size * 1.4, size, color);
      row = w;
      n++;
    } else row += (row ? ' ' : '') + w;
  }
  if (row) drawText(ctx, api, row, x, y + n * size * 1.4, size, color);
}
export function drawFooter(ctx, api, v, col = api.C.muted) {
  return drawParagraph(ctx, api, v, 155, 1010, 1610, 26, col);
}
export function drawCell(ctx, api, name, value, x, y, w = 350, col = api.C.cyan) {
  drawRectangle(ctx, api, x, y, w, 105, col);
  drawText(
    ctx,
    api,
    name,
    x + 18,
    y + 35,
    25,
    api.C.muted,
    'left',
    name.includes('_') ? 'mono' : 'sans',
  );
  drawText(ctx, api, value, x + 18, y + 80, 29, col);
}
export function drawPage(ctx, api, v, x, y, col = api.C.blue, label = '') {
  drawRectangle(ctx, api, x, y, 130, 115, col);
  if (label) drawText(ctx, api, label, x + 65, y + 32, 22, api.C.muted, 'center');
  drawText(ctx, api, v, x + 65, y + 83, 35, col, 'center');
}
