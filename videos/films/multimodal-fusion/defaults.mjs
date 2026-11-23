export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawOriginalEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 42,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 88,
  color = api.C.cyan,
  fontSize = 30,
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
    radius: 14,
    padding: 12,
    fontSize,
    opacity,
  });
}
export function drawExpandedLine(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function drawExpandedBox(ctx, api, x, y, w, h, col = api.C.cyan, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 10);
}
export function drawExpandedTile(ctx, api, label, x, y, w = 300, h = 80, col = api.C.cyan) {
  drawExpandedBox(ctx, api, x, y, w, h, col);
  text(ctx, api, label, x + w / 2, y + h / 2 + 10, 28, col, 'center');
}
export function drawExpandedCells(
  ctx,
  api,
  x,
  y,
  columns,
  rows,
  size,
  col,
  count = columns * rows,
) {
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < columns; i++) {
      const k = j * columns + i;
      if (k < count)
        api.rect(ctx, x + i * size, y + j * size, size - 2, size - 2, col, api.C.panel, 0);
    }
}
export function drawExpandedFooter(ctx, api, v, color = api.C.muted) {
  return text(ctx, api, v, 960, 1015, 28, color, 'center');
}
export function drawExpandedBadge(ctx, api, v, color = api.C.yellow) {
  return text(ctx, api, v, 960, 930, 34, color, 'center');
}
export function drawExpandedArrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan, amount = 1) {
  if (amount <= 0) return;
  const x = x1 + (x2 - x1) * amount,
    y = y1 + (y2 - y1) * amount;
  drawExpandedLine(ctx, api, x1, y1, x, y, col, 4);
  if (amount > 0.98) {
    const a = Math.atan2(y - y1, x - x1),
      r = 11;
    drawExpandedLine(ctx, api, x, y, x - r * Math.cos(a - 0.5), y - r * Math.sin(a - 0.5), col, 4);
    drawExpandedLine(ctx, api, x, y, x - r * Math.cos(a + 0.5), y - r * Math.sin(a + 0.5), col, 4);
  }
}
export function drawExpandedChart(ctx, api, x, y, w = 630, h = 360) {
  drawExpandedBox(ctx, api, x, y, w, h, api.C.blue);
  text(ctx, api, 'I17 · authored incident screenshot', x + 25, y + 42, 27, api.C.blue);
  const xx = (i) => x + 75 + (i * (w - 120)) / 5,
    yy = (v) => y + h - 60 - (v * (h - 140)) / 10;
  drawExpandedLine(ctx, api, xx(0), yy(0), xx(5), yy(0));
  drawExpandedLine(ctx, api, xx(0), yy(0), xx(0), yy(10));
  const incidentTraces = [
    [3, 3, 3.1, 3, 3, 3.1],
    [4.6, 4.6, 4.6, 7.3, 8.0, 8.1],
    [8.4, 8.3, 8.4, 8.3, 8.4, 8.3],
  ];
  for (const [j, values] of incidentTraces.entries()) {
    const pts = values.map((v, i) => ({
        x: xx(i),
        y: yy(v),
      }));
    api.path(ctx, pts, {
      color: [api.C.blue, api.C.green, api.C.pink][j],
      width: 4,
    });
  }
  text(ctx, api, '14:00', xx(0), y + h - 20, 24, api.C.muted, 'center');
  text(ctx, api, '14:03', xx(3), y + h - 20, 24, api.C.muted, 'center');
  text(ctx, api, '14:05', xx(5), y + h - 20, 24, api.C.muted, 'center');
}
export function centeredText(ctx, api, v, x, y, size = 29, col = api.C.ink, a = 'center') {
  return api.text(ctx, String(v), x, y, size, col, a);
}
export function drawConnectorConstructionRectangle(ctx, api, x, y, w, h, col, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 5);
}
export function drawFusionConstructionRectangle(ctx, api, x, y, w, h, col, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 6);
}
export function drawFusionConstructionToken(ctx, api, name, x, y, col) {
  drawFusionConstructionRectangle(ctx, api, x, y, 78, 65, col, col);
  centeredText(ctx, api, name, x + 39, y + 42, 27, api.C.bg);
}
