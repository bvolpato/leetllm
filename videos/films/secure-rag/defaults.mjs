export function drawOriginalText(
  ctx,
  api,
  text,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, text, x, y, size, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 86,
  fontSize = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
export function drawOriginalLink(ctx, api, a, z, progress, color = api.C.cyan) {
  return api.components.fade(progress, () => {
    const route = api.connect(ctx, a, z, {
      color,
      width: 3,
      fromGap: 20,
      toGap: 20,
    });
    api.components.particle({
      points: [route.from, route.to],
      progress,
      fill: color,
      radius: 7,
    });
  });
}
export function drawText(
  ctx,
  api,
  v,
  x,
  y,
  z = 28,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, z, color, align, font);
}
export function drawRectangle(ctx, api, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 8);
}
export function drawLine(ctx, api, x, y, z, v, col = api.C.muted) {
  return api.line(ctx, x, y, z, v, col, 3);
}
export function drawArrow(ctx, api, x, y, z, v, col = api.C.cyan) {
  return api.arrow(ctx, x, y, z, v, col, 3);
}
export function interpolateScalar(ctx, api, a, z, q) {
  return a + (z - a) * q;
}
export function drawParagraph(ctx, api, v, x, y, w = 1540, z = 25, col = api.C.muted) {
  const words = v.split(' ');
  let row = '',
    n = 0;
  for (const word of words) {
    if ((row + ' ' + word).length > w / (z * 0.56)) {
      drawText(ctx, api, row, x, y + n * z * 1.35, z, col);
      row = word;
      n++;
    } else row += (row ? ' ' : '') + word;
  }
  if (row) drawText(ctx, api, row, x, y + n * z * 1.35, z, col);
}
export function drawFooter(ctx, api, v, c = api.C.muted) {
  return drawParagraph(ctx, api, v, 155, 1008, 1600, 25, c);
}
export function drawHeading(ctx, api, v, x = 170, y = 295, color = api.C.ink) {
  return drawText(ctx, api, v, x, y, 31, color);
}
export function drawSourceRecord(
  ctx,
  api,
  row,
  x,
  y,
  w = 350,
  col = api.C.blue,
  { version = true, grant = true } = {},
) {
  drawRectangle(ctx, api, x, y, w, 135, col);
  drawLine(ctx, api, x + w - 38, y, x + w - 38, y + 32, col);
  drawLine(ctx, api, x + w - 38, y + 32, x + w, y + 32, col);
  drawText(ctx, api, row.id, x + 18, y + 38, 27, col, 'left', 'mono');
  if (version)
    drawText(
      ctx,
      api,
      'v' + row.revision + ' · tenant ' + row.tenant,
      x + 18,
      y + 77,
      25,
      api.C.ink,
    );
  if (grant)
    drawText(
      ctx,
      api,
      row.grant ?? 'no grant',
      x + 18,
      y + 115,
      24,
      row.grant ? api.C.muted : api.C.pink,
    );
  return {
    x,
    y,
    w,
    h: 135,
  };
}
export function drawTag(ctx, api, name, value, x, y, w = 420, col = api.C.cyan) {
  drawRectangle(ctx, api, x, y, w, 96, col);
  drawText(ctx, api, name, x + 16, y + 33, 23, api.C.muted);
  drawText(ctx, api, value, x + 16, y + 73, 28, col);
}
export function drawNode(ctx, api, name, x, y, w = 330, col = api.C.blue) {
  drawRectangle(ctx, api, x, y, w, 78, col);
  drawText(ctx, api, name, x + w / 2, y + 49, 26, col, 'center');
  return {
    x,
    y,
    w,
    h: 78,
  };
}
export function drawFlow(ctx, api, from, to, q, col = api.C.cyan) {
  const ax = from.x + from.w,
    ay = from.y + from.h / 2,
    bx = to.x,
    by = to.y + to.h / 2;
  if (q <= 0) return;
  drawLine(ctx, api, ax + 8, ay, bx - 10, by, col);
  api.rect(
    ctx,
    interpolateScalar(ctx, api, ax + 16, bx - 26, q) - 7,
    interpolateScalar(ctx, api, ay, by, q) - 7,
    14,
    14,
    col,
    col,
    2,
  );
}
export function drawDecisionMark(ctx, api, yes, x, y) {
  return drawText(ctx, api, yes ? '✓' : '×', x, y, 36, yes ? api.C.green : api.C.pink, 'center');
}
