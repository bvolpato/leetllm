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
export function drawOriginalEquation(ctx, api, value, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function drawOriginalCard(ctx, api, label, x, y, width, color = api.C.cyan, height = 86) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 29,
    baselineOffset: label.includes('\n') ? -16 : 0,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawOriginalBar(ctx, api, segments, x, y, width, height, total) {
  let offset = 0;
  segments.forEach((segment) => {
    const w = (segment.value / total) * width;
    if (w > 0) {
      api.focus.target('memory-partition', () =>
        api.rect(ctx, x + offset, y, w, height, segment.color, undefined, 0),
      );
      offset += w;
    }
  });
  return segments;
}
export function drawCapacityText(
  ctx,
  api,
  value,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawCenteredText(ctx, api, value, x, y, size = 32, color = api.C.ink) {
  return drawCapacityText(ctx, api, value, x, y, size, color, 'center');
}
export function wrapCardText(ctx, api, text, max) {
  const rows = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) {
      rows.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) rows.push(line);
  return rows;
}
export function drawCapacityCard(
  ctx,
  api,
  value,
  x,
  y,
  width,
  height = 95,
  color = api.C.cyan,
  size = 28,
) {
  const r = api.components.panel({
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    radius: 10,
  });
  const rows = String(value)
    .split('\n')
    .flatMap((s) => wrapCardText(ctx, api, s, Math.floor((width - 36) / (size * 0.59))));
  rows.forEach((s, i) =>
    drawCenteredText(
      ctx,
      api,
      s,
      x + width / 2,
      y + height / 2 + (i - (rows.length - 1) / 2) * size * 1.3 + size * 0.32,
      size,
      color,
    ),
  );
  return r;
}
export function drawLine(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function drawArrow(ctx, api, x, y, u, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, u, v, color, 4);
}
export function drawFooter(ctx, api, value) {
  return drawCenteredText(ctx, api, value, 960, 1030, 25, api.C.muted);
}
export function drawCells(ctx, api, values, x, y, w = 90, h = 72, color = api.C.cyan) {
  return values.forEach((value, i) => {
    api.rect(ctx, x + i * w, y, w - 6, h, api.C.panel, color, 0);
    if (value !== null && value !== undefined)
      drawCenteredText(ctx, api, value, x + i * w + (w - 6) / 2, y + h / 2 + 10, 28, color);
  });
}
export function drawStrip(ctx, api, segments, x, y, width, height, total) {
  let off = 0;
  for (const s of segments) {
    if (s.value > 0) {
      const w = (s.value / total) * width;
      api.rect(ctx, x + off, y, w, height, s.color, undefined, 0);
      off += w;
    }
  }
  api.rect(ctx, x, y, width, height, null, api.C.muted, 0);
}
export function drawNode(ctx, api, text, x, y, color = api.C.cyan) {
  api.circle(ctx, x, y, 38, api.C.panel, color, 3);
  drawCenteredText(ctx, api, text, x, y + 9, 27, color);
}
