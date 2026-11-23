export function text(ctx, api, text, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function equation(ctx, api, text, x, y, size = 42, color = api.C.ink) {
  return api.math(ctx, text, x, y, size, color, 'center');
}
export function target(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width = 210,
  height = 90,
  color = api.C.cyan,
  size = 38,
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
    fontSize: size,
    font: 'sans',
    padding: 12,
    radius: 12,
    baselineOffset: size * 0.32,
  });
}
export function row(
  ctx,
  api,
  values,
  y,
  { left = 350, width = 260, gap = 40, color = api.C.cyan, fontSize = 39 } = {},
) {
  return values.forEach((w, i) =>
    card(ctx, api, w, left + i * (width + gap), y, width, 90, color, fontSize),
  );
}
export function heading(ctx, api, label) {
  return text(ctx, api, label, 960, 260, 36, api.C.ink, 'center');
}
export function highlight(ctx, api, x, y, width, height, before, after, strength, color, paint) {
  return api.teaching.changeCue(
    {
      x,
      y,
      width,
      height,
      from: before,
      to: after,
      progress: 1,
      emphasis: strength,
      color,
    },
    paint,
  );
}
export function drawExtendedText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawExtendedEquation(ctx, api, v, x, y, size = 36, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtendedBox(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  api.rect(ctx, x, y, w, h, fill, color, 2, 8);
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function drawExtendedCell(
  ctx,
  api,
  v,
  x,
  y,
  w = 170,
  h = 70,
  color = api.C.cyan,
  size = 28,
) {
  const bounds = drawExtendedBox(ctx, api, x, y, w, h, color);
  api.labelScope(
    ctx,
    bounds,
    () => drawExtendedText(ctx, api, v, x + w / 2, y + h / 2 + size * 0.32, size, color, 'center'),
    {
      padding: 8,
    },
  );
  return bounds;
}
export function drawExtendedHead(ctx, api, v) {
  return drawExtendedText(ctx, api, v, 960, 258, 35, api.C.ink, 'center');
}
export function drawExtendedFoot(ctx, api, v) {
  return drawExtendedText(ctx, api, v, 960, 1020, 26, api.C.muted, 'center');
}
export function drawExtendedTokenRow(
  ctx,
  api,
  values,
  x,
  y,
  w = 180,
  gap = 16,
  color = api.C.cyan,
) {
  return values.map((v, i) => drawExtendedCell(ctx, api, v, x + i * (w + gap), y, w, 70, color));
}
export function drawExtendedGrid(
  ctx,
  api,
  labels,
  x,
  y,
  w,
  h,
  color = api.C.blue,
  fontSize = 25,
  highlights = [],
) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize,
    padding: 8,
    highlights,
  });
}
export function drawExtendedBar(ctx, api, value, x, y, w, h, color, label, visible = true) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 1);
  if (visible) {
    api.rect(ctx, x, y, w * value, h, color);
    if (label) drawExtendedText(ctx, api, label, x + w / 2, y + h + 34, 25, color, 'center');
  }
}
export function drawExtendedRail(ctx, api, x, y, w, values, labels, colors) {
  let left = x;
  values.forEach((v, i) => {
    api.rect(ctx, left, y, w * v, 65, colors[i]);
    if (w * v > 80)
      drawExtendedText(ctx, api, labels[i], left + (w * v) / 2, y + 43, 25, api.C.bg, 'center');
    left += w * v;
  });
}
export function mixLanguage(ctx, api, a, z, p) {
  return a + (z - a) * p;
}
export function formatLanguage(ctx, api, x, n = 3) {
  return Math.abs(x) < 1e-10 ? '0' : Number(x.toFixed(n)).toString();
}
