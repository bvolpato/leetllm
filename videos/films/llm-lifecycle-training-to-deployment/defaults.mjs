export function drawLegacyText(
  ctx,
  api,
  value,
  x,
  y,
  size = 27,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawLegacyMath(ctx, api, value, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function drawLegacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 86,
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
export function drawText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    z,
    color,
    align,
    String(v).includes('_') ? 'mono' : undefined,
  );
}
export function drawCard(ctx, api, label, x, y, w, h = 90, color = api.C.blue, z = 29) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize: z,
    padding: 14,
    labelBaselineY: y + h / 2 + z * (0.34 - 0.7 * (String(label).split('\n').length - 1)),
  });
}
export function drawArrow(ctx, api, x, y, u, v, color = api.C.cyan) {
  api.line(ctx, x, y, u, v, color, 3);
  const a = Math.atan2(v - y, u - x);
  api.line(ctx, u, v, u - 14 * Math.cos(a - 0.45), v - 14 * Math.sin(a - 0.45), color, 3);
  api.line(ctx, u, v, u - 14 * Math.cos(a + 0.45), v - 14 * Math.sin(a + 0.45), color, 3);
}
export function drawFooter(ctx, api, v) {
  return drawText(ctx, api, v, 960, 1015, 24, api.C.muted, 'center');
}
export function drawTable(ctx, api, rows, x = 150, y = 350, w = 1620, h = 100) {
  const n = rows[0].length,
    cw = w / n;
  rows.forEach((row, i) =>
    row.forEach((v, j) => {
      api.rect(ctx, x + j * cw, y + i * h, cw, h, api.C.panel, api.C.muted, 1);
      drawText(
        ctx,
        api,
        v,
        x + (j + 0.5) * cw,
        y + (i + 0.63) * h,
        Math.min(29, cw / 8),
        api.C.ink,
        'center',
      );
    }),
  );
}
export function drawDocument(ctx, api, head, rows, x, y, w, color = api.C.blue) {
  const h = 100 + rows.length * 58;
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 12);
  drawText(ctx, api, head, x + 22, y + 43, 31, color);
  api.line(ctx, x + 18, y + 62, x + w - 18, y + 62, color, 2);
  rows.forEach((v, i) => drawText(ctx, api, v, x + 23, y + 110 + i * 58, 28));
}
