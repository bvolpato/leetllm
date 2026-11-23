export function drawOriginalText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawOriginalEquation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawOriginalCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 95) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 30,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function drawText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function drawCenteredText(ctx, api, v, x, y, size = 33, col = api.C.ink) {
  return drawText(ctx, api, v, x, y, size, col, 'center');
}
export function drawLine(ctx, api, x, y, u, v, col = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, col, width);
}
export function drawArrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 4);
}
export function drawPanel(ctx, api, x, y, w, h, col = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    radius: 12,
  });
}
export function wrapText(ctx, api, text, max) {
  const out = [];
  let row = '';
  for (const word of String(text).split(/\s+/)) {
    if ((row + ' ' + word).trim().length > max) {
      out.push(row);
      row = word;
    } else row = (row + ' ' + word).trim();
  }
  if (row) out.push(row);
  return out;
}
export function drawCard(ctx, api, value, x, y, w, h = 100, col = api.C.cyan, size = 29) {
  const sh = drawPanel(ctx, api, x, y, w, h, col),
    lines = String(value)
      .split('\n')
      .flatMap((v) => wrapText(ctx, api, v, Math.max(8, Math.floor((w - 40) / (size * 0.59)))));
  lines.forEach((v, i) =>
    drawCenteredText(
      ctx,
      api,
      v,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.3 + size * 0.32,
      size,
      col,
    ),
  );
  return sh;
}
export function drawFooter(ctx, api, value) {
  return drawCenteredText(ctx, api, value, 960, 1030, 25, api.C.muted);
}
export function drawBar(ctx, api, x, y, w, value, capacity, col) {
  api.rect(ctx, x, y, w, 42, api.C.panel, api.C.muted, 0);
  if (value > 0) api.rect(ctx, x, y, w * Math.min(1, value / capacity), 42, col, undefined, 0);
}
