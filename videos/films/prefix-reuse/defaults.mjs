export function drawText(ctx, api, value, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function mark(ctx, api, id, fn) {
  return api.focus.target(id + '-mark', fn);
}
export function line(ctx, api, x, y, xx, yy, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function frame(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 2);
}
export function pill(ctx, api, value, x, y, w, color = api.C.blue, size = 28) {
  frame(ctx, api, x, y, w, 66, color);
  drawText(ctx, api, value, x + w / 2, y + 43, size, color, 'center');
}
export function tokenRail(ctx, api, x, y, w, values, max, colors, height = 62) {
  frame(ctx, api, x, y, w, height);
  let start = x;
  values.forEach((v, i) => {
    const width = (w * v) / max;
    if (width > 0) api.rect(ctx, start, y, width, height, colors[i], undefined, 0);
    start += width;
  });
}
export function arrow(ctx, api, x, y, xx, yy, color = api.C.cyan, progress = 1) {
  const endX = x + (xx - x) * progress,
    endY = y + (yy - y) * progress;
  api.arrow(ctx, x, y, endX, endY, color, 3);
}
export function footer(ctx, api, text) {
  return drawText(ctx, api, text, 960, 1005, 27, api.C.muted, 'center');
}
export function drawLegacyText(
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
export function drawCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 82) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function connectShapes(ctx, api, source, target, color) {
  return api.connect(ctx, source, target, {
    color,
    gap: 20,
  });
}
