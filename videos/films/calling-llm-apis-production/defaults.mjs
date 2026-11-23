import { phase } from './arithmetic.mjs';
export function legacyText(
  ctx,
  api,
  value,
  x,
  y,
  size = 27,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(value), x, y, size, color, align, font);
}
export function legacyMath(ctx, api, value, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function legacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 94,
  color = api.C.cyan,
  fontSize = 25,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize,
    padding: 12,
  });
}
export function chapterText(ctx, api, v, x, y, size = 28, col = api.C.ink, align = 'left') {
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
export function panel(ctx, api, v, x, y, w, h = 100, col = api.C.blue, size = 28) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 2, 12);
  const lines = String(v).split('\n');
  lines.forEach((line, i) =>
    chapterText(
      ctx,
      api,
      line,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.22 + size * 0.32,
      size,
      col,
      'center',
    ),
  );
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function strokeLine(ctx, api, x1, y1, x2, y2, col = api.C.cyan, w = 4) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function footer(ctx, api, v, col = api.C.muted) {
  return chapterText(ctx, api, v, 960, 1010, 25, col, 'center');
}
export function heading(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 320, 31, api.C.ink, 'center');
}
export function travel(ctx, api, label, start, end, q, col = api.C.cyan, w = 180) {
  const p = phase(q, 0, 1);
  return panel(
    ctx,
    api,
    label,
    start.x + (end.x - start.x) * p,
    start.y + (end.y - start.y) * p,
    w,
    64,
    col,
    23,
  );
}
export function refinedText(ctx, api, v, x, y, size = 28, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function refinedCard(ctx, api, v, x, y, w, h = 90, col = api.C.blue, size = 28) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    textColor: api.C.ink,
    fontSize: size,
    font: String(v).includes('_') ? 'mono' : 'sans',
    padding: 10,
  });
}
