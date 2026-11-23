export function drawOriginalText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 90) {
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
export function constructionText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function constructionRectangle(ctx, api, x, y, w, h, col, fill = false) {
  if (w > 0 && h > 0) api.rect(ctx, x, y, w, h, fill ? col : undefined, fill ? undefined : col, 2);
}
export function constructionCell(ctx, api, v, x, y, w = 240, h = 70, col = api.C.cyan) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fontSize: 27,
    font: String(v).includes('_') ? 'mono' : 'sans',
    padding: 8,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
    baselineOffset: String(v).includes('\n') ? -14 : 9,
  });
}
export function constructionLine(ctx, api, x1, y1, x2, y2, col = api.C.muted) {
  return api.line(ctx, x1, y1, x2, y2, col, 2);
}
export function constructionNote(ctx, api, v, col = api.C.muted) {
  return constructionText(ctx, api, v, 960, 980, 27, col, 'center');
}
export function constructionBar(ctx, api, name, value, max, y, col = api.C.blue, show = true) {
  constructionText(ctx, api, name, 150, y, 29, col);
  constructionRectangle(ctx, api, 630, y - 30, 900, 42, api.C.muted);
  if (show && value > 0)
    constructionRectangle(ctx, api, 630, y - 30, 900 * Math.min(value / max, 1), 42, col, true);
  if (show)
    constructionText(
      ctx,
      api,
      value.toLocaleString('en-US', {
        maximumFractionDigits: 3,
      }),
      1750,
      y,
      30,
      col,
      'right',
    );
}
