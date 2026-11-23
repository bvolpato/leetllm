export function drawSkyText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawSkyEquation(ctx, api, v, x, y, size = 48, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawSkyCard(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawSkyChapterText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  const str = String(v);
  return api.text(ctx, str, x, y, size, color, align, str.includes('_') ? 'mono' : 'sans');
}
export function drawSkyChapterEquation(ctx, api, v, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawSkyChapterL(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 2) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function drawSkyChapterArrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, col, 3);
}
export function drawSkyChapterTitle(ctx, api, v) {
  return drawSkyChapterText(ctx, api, v, 960, 275, 36, api.C.yellow, 'center');
}
export function drawSkyChapterFoot(ctx, api, v, col = api.C.muted) {
  return drawSkyChapterText(ctx, api, v, 960, 1020, 26, col, 'center');
}
export function drawSkyChapterBox(ctx, api, v, x, y, w = 300, h = 90, col = api.C.blue, size = 30) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 3);
  const lines = String(v).split('\n');
  lines.forEach((line, i) =>
    drawSkyChapterText(
      ctx,
      api,
      line,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.2 + size * 0.3,
      size,
      col,
      'center',
    ),
  );
}
export function drawSkyChapterRow(
  ctx,
  api,
  values,
  y,
  { x = 400, width = 1320, color = api.C.blue, size = 30, colors = [], height = 80 } = {},
) {
  return values.forEach((v, i) =>
    drawSkyChapterBox(
      ctx,
      api,
      v,
      x + (i * width) / values.length,
      y,
      width / values.length - 10,
      height,
      colors[i] ?? color,
      size,
    ),
  );
}
export function drawSkyChapterTable(ctx, api, rows, x, y, w, h, size = 29) {
  const ch = h / rows.length,
    cw = w / rows[0].length;
  rows.forEach((r, i) =>
    r.forEach((v, j) =>
      drawSkyChapterBox(
        ctx,
        api,
        v,
        x + j * cw,
        y + i * ch,
        cw,
        ch,
        i ? api.C.blue : api.C.cyan,
        size,
      ),
    ),
  );
}
export function drawSkyChapterTokenRows(
  ctx,
  api,
  values,
  labelsAt = [11, 12, 90, 21, 22],
  action = [1, 1, 0, 1, 1],
) {
  drawSkyChapterText(ctx, api, 'response position', 135, 395, 27, api.C.muted);
  drawSkyChapterRow(
    ctx,
    api,
    labelsAt.map((_, i) => i),
    350,
    {
      color: api.C.muted,
      height: 70,
    },
  );
  drawSkyChapterText(ctx, api, 'token identity', 135, 505, 29, api.C.blue);
  drawSkyChapterRow(ctx, api, labelsAt, 450, {
    colors: labelsAt.map((_, i) => (action[i] ? api.C.blue : api.C.pink)),
  });
  drawSkyChapterText(ctx, api, 'direct loss mask', 135, 615, 27, api.C.cyan);
  drawSkyChapterRow(ctx, api, action, 560, {
    colors: action.map((v) => (v ? api.C.cyan : api.C.muted)),
  });
  if (values) {
    drawSkyChapterText(ctx, api, 'log probability', 135, 725, 27, api.C.blue);
    drawSkyChapterRow(ctx, api, values, 670, {
      colors: values.map((_, i) => (action[i] ? api.C.blue : api.C.muted)),
    });
  }
}
