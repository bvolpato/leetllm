export function legacyText(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function legacyEquation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 420,
  color = api.C.cyan,
  height = 95,
  z = 32,
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
    padding: 12,
  });
}
export function mark(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawText(ctx, api, s, x, y, size = 31, color = api.C.ink) {
  return api.text(ctx, String(s), x, y, size, color, 'center');
}
export function drawLeftText(ctx, api, s, x, y, size = 31, color = api.C.ink) {
  return api.text(ctx, String(s), x, y, size, color, 'left');
}
export function drawEquation(ctx, api, s, x, y, size = 44, color = api.C.yellow) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function drawBox(ctx, api, label, x, y, w = 400, h = 90, color = api.C.blue, size = 29) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 10);
  drawText(ctx, api, label, x + w / 2, y + h / 2 + 10, size, color);
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function drawArrow(ctx, api, x1, y1, x2, y2, c = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, c, 4);
}
export function footer(ctx, api, s) {
  return drawText(ctx, api, s, 960, 1005, 26, api.C.muted);
}
export function drawMatrix(
  ctx,
  api,
  a,
  x,
  y,
  { cw = 100, ch = 74, color = api.C.blue, mask, known = true, label } = {},
) {
  if (label) drawLeftText(ctx, api, label, x, y - 35, 28, color);
  const data = Array.isArray(a[0]) ? a : [a];
  for (const [i, row] of data.entries())
    for (const [j, v] of row.entries()) {
      const cc = mask && !mask[i]?.[j] ? api.C.muted : color;
      api.rect(ctx, x + j * cw, y + i * ch, cw - 5, ch - 5, api.C.panel, cc, 2, 5);
      drawText(
        ctx,
        api,
        known ? (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(4)) : v) : '?',
        x + j * cw + (cw - 5) / 2,
        y + i * ch + ch * 0.63,
        29,
        cc,
      );
    }
  return {
    x,
    y,
    width: data[0].length * cw,
    height: data.length * ch,
  };
}
