import { boundedContext } from './arithmetic.mjs';
export function drawVisualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawOriginalText(
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
export function drawOriginalCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 90) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    font: label.includes('_') ? 'mono' : 'sans',
    baselineOffset: label.includes('\n') ? -15 : 0,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawPacketFocus(ctx, api, id, fn) {
  return api.focus ? api.focus.target(id, fn) : fn();
}
export function drawPacketText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, size, color, align, font);
}
export function drawPacketRectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 2, 6);
}
export function drawPacketLine(ctx, api, x, y, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawPacketFrame(ctx, api, label = 'NEXT MODEL INPUT') {
  drawPacketText(ctx, api, label, 1060, 335, 29, api.C.cyan);
  drawPacketLine(ctx, api, 1040, 355, 1780, 355, api.C.cyan, 3);
  drawPacketLine(ctx, api, 1780, 355, 1780, 960, api.C.cyan, 3);
  drawPacketLine(ctx, api, 1040, 960, 1780, 960, api.C.cyan, 3);
}
export function drawPacketRow(ctx, api, label, detail, x, y, color = api.C.blue, w = 650, h = 90) {
  drawPacketRectangle(ctx, api, x, y, w, h, color);
  drawPacketText(
    ctx,
    api,
    label,
    x + 20,
    y + 34,
    27,
    color,
    'left',
    String(label).includes('_') ? 'mono' : 'sans',
  );
  if (detail) drawPacketText(ctx, api, detail, x + 20, y + 68, 24, api.C.ink);
}
export function movePacketRow(ctx, api, label, detail, from, to, q, color = api.C.blue, w = 620) {
  q = boundedContext(q);
  const u = q * q * (3 - 2 * q);
  drawPacketRow(
    ctx,
    api,
    label,
    detail,
    from[0] + (to[0] - from[0]) * u,
    from[1] + (to[1] - from[1]) * u,
    color,
    w,
  );
}
export function movePacketVia(ctx, api, label, detail, to, q, color = api.C.blue) {
  const first = boundedContext(q / 0.65),
    second = boundedContext((q - 0.65) / 0.35);
  if (q <= 0.65) movePacketRow(ctx, api, label, detail, [150, 700], [1080, 700], first, color, 650);
  else movePacketRow(ctx, api, label, detail, [1080, 700], to, second, color, 650);
}
export function drawPacketFooter(ctx, api, text) {
  return drawPacketText(ctx, api, text, 150, 1020, 26, api.C.muted);
}
export function drawCompleteFocus(ctx, api, id, fn) {
  return api.focus ? api.focus.target(id, fn) : fn();
}
export function drawCompleteText(
  ctx,
  api,
  text,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(text), x, y, size, color, align, font);
}
export function drawCompleteRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = api.C.muted,
  width = 1.5,
) {
  return api.rect(ctx, x, y, w, h, fill, stroke, width, 6);
}
export function drawCompleteLine(ctx, api, x, y, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawCompleteEquation(ctx, api, text, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, text, x, y, size, color, {
    align: 'center',
  });
}
export function drawCompleteHeading(ctx, api, text) {
  return drawCompleteText(ctx, api, text, 150, 280, 32, api.C.ink);
}
export function drawCompleteFooter(ctx, api, text) {
  return drawCompleteText(ctx, api, text, 150, 1030, 25, api.C.muted);
}
export function drawCompleteRecord(
  ctx,
  api,
  label,
  detail,
  x,
  y,
  w = 590,
  color = api.C.blue,
  h = 100,
) {
  drawCompleteRectangle(ctx, api, x, y, w, h, api.C.panel, color, 2);
  drawCompleteText(ctx, api, label, x + 22, y + 37, 28, color);
  const rows = Array.isArray(detail) ? detail : [detail];
  rows.forEach((s, i) => drawCompleteText(ctx, api, s, x + 22, y + 72 + i * 33, 24, api.C.ink));
  return {
    x,
    y,
    w,
    h,
  };
}
export function drawCompleteStatus(ctx, api, text, x, y, color = api.C.yellow) {
  return drawCompleteText(ctx, api, text, x, y, 29, color);
}
export function drawCompletePacket(
  ctx,
  api,
  x = 1080,
  y = 365,
  w = 660,
  h = 590,
  label = 'NEXT MODEL CALL',
) {
  api.rect(ctx, x, y, w, h, api.C.panel);
  drawCompleteLine(ctx, api, x, y, x + w, y, api.C.cyan, 3);
  drawCompleteLine(ctx, api, x + w, y, x + w, y + h, api.C.cyan, 3);
  drawCompleteLine(ctx, api, x, y + h, x + w, y + h, api.C.cyan, 3);
  for (const [a, z] of [
    [0, 22],
    [135, 152],
    [265, 282],
    [395, 412],
    [525, 590],
  ])
    if (a < h) drawCompleteLine(ctx, api, x, y + a, x, y + Math.min(z, h), api.C.cyan, 3);
  drawCompleteText(ctx, api, label, x + 20, y - 25, 25, api.C.cyan);
  return {
    x,
    y,
    w,
    h,
  };
}
export function moveCompleteRecord(
  ctx,
  api,
  label,
  detail,
  start,
  end,
  q,
  w = 560,
  color = api.C.blue,
) {
  const u = boundedContext(q),
    e = u * u * (3 - 2 * u),
    x = start[0] + (end[0] - start[0]) * e,
    y = start[1] + (end[1] - start[1]) * e;
  if (u < 1) {
    api.rect(ctx, start[0], start[1], w, 100, api.C.panel);
    drawCompleteLine(
      ctx,
      api,
      start[0],
      start[1] + 101,
      start[0] + w,
      start[1] + 101,
      api.C.muted,
      1,
    );
  }
  return drawCompleteRecord(ctx, api, label, detail, x, y, w, color);
}
export function drawCompleteColumns(
  ctx,
  api,
  headers,
  rows,
  x = 150,
  y = 390,
  widths = [560, 420, 420],
  height = 105,
) {
  let a = x;
  headers.forEach((h, i) => {
    drawCompleteText(ctx, api, h, a, y, 25, api.C.muted);
    a += widths[i];
  });
  rows.forEach((row, i) => {
    let a = x;
    const yy = y + 70 + i * height;
    row.forEach((v, j) => {
      drawCompleteText(
        ctx,
        api,
        v,
        a,
        yy,
        28,
        j === 0 ? api.C.ink : api.C.cyan,
        'left',
        String(v).includes('_') ? 'mono' : 'sans',
      );
      a += widths[j];
    });
    drawCompleteLine(
      ctx,
      api,
      x,
      yy + 25,
      x + widths.reduce((s, v) => s + v, 0),
      yy + 25,
      api.C.muted,
      1,
    );
  });
}
export function drawFieldCells(ctx, api, values, x, y, w = 145, h = 70, color = api.C.blue) {
  return values.forEach((v, i) => {
    drawCompleteRectangle(ctx, api, x + i * (w + 12), y, w, h, api.C.panel, color, 1.5);
    drawCompleteText(ctx, api, v, x + i * (w + 12) + w / 2, y + h / 2 + 10, 25, color, 'center');
  });
}
