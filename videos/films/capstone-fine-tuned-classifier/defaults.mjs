import { format, mix } from './arithmetic.mjs';
export function text(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, v, x, y, w = 560, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 28,
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawExpandedClassifierText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawExpandedClassifierCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 520,
  color = api.C.cyan,
  height = 88,
  size = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: size,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawExpandedClassifierRect(
  ctx,
  api,
  x,
  y,
  w,
  h,
  color = api.C.muted,
  fill = api.C.panel,
) {
  return api.rect(ctx, x, y, w, h, fill, color, 2);
}
export function drawExpandedClassifierMatrix(
  ctx,
  api,
  values,
  x,
  y,
  { cell = 90, height = 74, color = api.C.cyan, visible = () => true, size = 28 } = {},
) {
  return values.forEach((row, r) =>
    row.forEach((v, col) => {
      drawExpandedClassifierRect(ctx, api, x + col * cell, y + r * height, cell, height, color);
      drawExpandedClassifierText(
        ctx,
        api,
        visible(r, col) ? (typeof v === 'number' ? format(v) : v) : '?',
        x + (col + 0.5) * cell,
        y + (r + 0.61) * height,
        size,
        visible(r, col) ? color : api.C.muted,
        'center',
      );
    }),
  );
}
export function drawExpandedClassifierNote(ctx, api, v, color = api.C.muted) {
  return drawExpandedClassifierText(ctx, api, v, 960, 1000, 27, color, 'center');
}
export function drawExpandedClassifierLine(
  ctx,
  api,
  x1,
  y1,
  x2,
  y2,
  color = api.C.cyan,
  width = 4,
) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawExpandedClassifierArrow(
  ctx,
  api,
  x1,
  y1,
  x2,
  y2,
  color = api.C.cyan,
  width = 4,
) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawExpandedClassifierBar(
  ctx,
  api,
  v,
  x,
  y,
  width = 530,
  max = 1,
  color = api.C.cyan,
  label = true,
) {
  drawExpandedClassifierRect(ctx, api, x, y, width, 34, api.C.muted);
  if (v > 0) api.rect(ctx, x, y, Math.max(0.01, (width * v) / max), 34, color);
  if (label) drawExpandedClassifierText(ctx, api, format(v), x + width + 18, y + 30, 27, color);
}
export function drawExpandedClassifierTransfer(ctx, api, from, to, p, color = api.C.yellow) {
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    length = Math.hypot(dx, dy),
    pad = Math.min(14, length / 3),
    a = [from[0] + (dx / length) * pad, from[1] + (dy / length) * pad],
    z = [to[0] - (dx / length) * pad, to[1] - (dy / length) * pad],
    x = mix(a[0], z[0], p),
    y = mix(a[1], z[1], p);
  drawExpandedClassifierLine(ctx, api, from[0], from[1], to[0], to[1], api.C.muted, 2);
  api.circle(ctx, x, y, 8, color);
}
export function drawExpandedClassifierProbabilityRows(ctx, api, values, x, y, width = 530) {
  ['0 · Guarded', '1 · Human'].forEach((name, i) => {
    drawExpandedClassifierText(
      ctx,
      api,
      name,
      x,
      y + i * 115 - 15,
      28,
      i ? api.C.pink : api.C.blue,
    );
    drawExpandedClassifierBar(
      ctx,
      api,
      values[i],
      x,
      y + i * 115,
      width,
      1,
      i ? api.C.pink : api.C.blue,
    );
  });
}
export function drawExpandedClassifierScoreRows(
  ctx,
  api,
  data,
  threshold,
  { y = 350, left = 190, axis = 720, width = 850, visible = true, prefix = 'G' } = {},
) {
  data.forEach((r, i) => {
    const yy = y + i * 84;
    colorRow(r, yy);
    function colorRow(r, yy) {
      drawExpandedClassifierText(
        ctx,
        api,
        prefix + (i + 1) + ' · ' + r.label,
        left,
        yy + 25,
        27,
        r.gold ? api.C.pink : api.C.blue,
      );
      drawExpandedClassifierLine(ctx, api, axis, yy + 12, axis + width, yy + 12, api.C.muted, 2);
      drawExpandedClassifierLine(
        ctx,
        api,
        axis + threshold * width,
        yy - 8,
        axis + threshold * width,
        yy + 34,
        api.C.yellow,
        4,
      );
      if (visible) {
        const score = r.p ?? r.score;
        api.circle(
          ctx,
          axis + score * width,
          yy + 12,
          10,
          score >= threshold ? api.C.yellow : api.C.blue,
        );
        drawExpandedClassifierText(
          ctx,
          api,
          format(score),
          axis + score * width,
          yy - 12,
          23,
          api.C.ink,
          'center',
        );
      }
    }
  });
  drawExpandedClassifierText(ctx, api, '0', axis, y - 40, 25, api.C.muted, 'center');
  drawExpandedClassifierText(ctx, api, '1', axis + width, y - 40, 25, api.C.muted, 'center');
  drawExpandedClassifierText(
    ctx,
    api,
    'cutoff ' + format(threshold, 2),
    axis + threshold * width,
    y + data.length * 84 + 20,
    27,
    api.C.yellow,
    'center',
  );
}
