export function extendedText(ctx, api, value, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function extendedEquation(ctx, api, value, x, y, size = 38, color = api.C.ink) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function extendedLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function extendedArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 3) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function extendedNote(ctx, api, value) {
  return extendedText(ctx, api, value, 960, 1010, 25, api.C.muted, 'center');
}
export function wordRibbon(
  ctx,
  api,
  words,
  y,
  { x = 155, width = 1610, colorFor = () => api.C.cyan, indices = true } = {},
) {
  const step = width / words.length;
  words.forEach((word, i) => {
    const color = colorFor(i);
    api.rect(ctx, x + i * step, y, step - 6, 61, api.C.panel, color, 4);
    extendedText(
      ctx,
      api,
      word.replace(/[.:,]/g, ''),
      x + (i + 0.5) * step - 3,
      y + 39,
      Math.min(23, step / 4.4),
      color,
      'center',
    );
    if (indices)
      extendedText(ctx, api, i, x + (i + 0.5) * step - 3, y + 91, 20, api.C.muted, 'center');
  });
  return (i) => x + i * step;
}
export function spanBracket(ctx, api, x1, x2, y, label, color = api.C.cyan) {
  extendedLine(ctx, api, x1, y, x2, y, color, 3);
  extendedLine(ctx, api, x1, y - 8, x1, y + 9, color, 3);
  extendedLine(ctx, api, x2, y - 8, x2, y + 9, color, 3);
  extendedText(ctx, api, label, (x1 + x2) / 2, y + 45, 25, color, 'center');
}
export function movingPacket(ctx, api, from, to, u, color) {
  extendedLine(ctx, api, from.x, from.y, to.x, to.y, api.C.border, 2);
  if (u > 0 && u < 1)
    api.circle(ctx, api.lerp(from.x, to.x, u), api.lerp(from.y, to.y, u), 7, color, color, 1);
}
export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 112,
  fontSize = 27,
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
    fontSize,
    padding: 13,
    opacity,
  });
}
export function footer(ctx, api, s) {
  return text(ctx, api, s, 960, 956, 26, api.C.muted, 'center');
}
