export function drawExtensionText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  const text = String(v);
  return text.includes('_')
    ? api.math(ctx, '\\text{' + text + '}', x, y, size, color, align)
    : api.text(ctx, text, x, y, size, color, align);
}
export function drawExtensionEquation(ctx, api, v, x, y, size = 43, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtensionF(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawExtensionLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function drawExtensionRect(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 2, 5);
}
export function drawExtensionCell(
  ctx,
  api,
  label,
  x,
  y,
  w = 240,
  h = 75,
  color = api.C.blue,
  size = 31,
) {
  drawExtensionRect(ctx, api, x, y, w, h, api.C.panel, color);
  drawExtensionText(ctx, api, label, x + w / 2, y + h * 0.65, size, color, 'center');
}
export function drawExtensionRow(
  ctx,
  api,
  a,
  x,
  y,
  step = 220,
  w = 200,
  color = api.C.blue,
  size = 30,
) {
  return a.forEach((v, i) =>
    drawExtensionCell(
      ctx,
      api,
      v,
      x + i * step,
      y,
      w,
      74,
      typeof color === 'function' ? color(i) : color,
      size,
    ),
  );
}
export function drawExtensionFoot(ctx, api, v) {
  return drawExtensionText(ctx, api, v, 960, 1000, 24, api.C.muted, 'center');
}
export function drawExtensionHeading(ctx, api, v) {
  return drawExtensionText(ctx, api, v, 180, 300, 35, api.C.ink);
}
export function drawExtensionOwnedStrip(ctx, api, parts, x, y, width = 1460, height = 65) {
  let at = x;
  for (const o of parts) {
    const w = width * o.mass;
    api.rect(ctx, at, y, w, height, o.color);
    if (w > 115)
      drawExtensionText(ctx, api, o.label, at + w / 2, y + height * 0.65, 28, api.C.bg, 'center');
    at += w;
  }
  drawExtensionLine(ctx, api, x, y + height + 20, x + width, y + height + 20);
  drawExtensionText(ctx, api, '0', x, y + height + 60, 25, api.C.muted);
  drawExtensionText(ctx, api, '1', x + width, y + height + 60, 25, api.C.muted, 'right');
}
export function drawExtensionTable(
  ctx,
  api,
  headers,
  rows,
  x = 180,
  y = 390,
  width = 1560,
  height = 105,
) {
  const cw = width / headers.length;
  headers.forEach((h, i) =>
    drawExtensionText(ctx, api, h, x + i * cw + 12, y - 35, 27, api.C.muted),
  );
  rows.forEach((r, j) =>
    r.forEach((v, i) =>
      drawExtensionText(ctx, api, v, x + i * cw + 12, y + j * height + 45, 29, api.C.ink),
    ),
  );
}
export function formatSigned(ctx, api, v) {
  return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(3);
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function equation(ctx, api, v, x, y, z = 46, col = api.C.ink, a = 'center') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width = 400,
  color = api.C.cyan,
  height = 92,
  baselineOffset = 0,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    baselineOffset,
    fontSize: 30,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
