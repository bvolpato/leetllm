import { lessonFont } from '../../lib/fonts.mjs';
export function text(ctx, api, C, v, x, y, z = 30, color = C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, C, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, C.yellow, 'center');
}
export function card(ctx, api, C, c, label, x, y, width, color = C.cyan, height = 95, z = 30) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function drawProfileChapterText(
  ctx,
  api,
  C,
  v,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawProfileChapterEquation(ctx, api, C, v, x, y, size = 45, color = C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawProfileChapterCard(
  ctx,
  api,
  C,
  c,
  v,
  x,
  y,
  w = 600,
  color = C.blue,
  h = 100,
  size = 30,
) {
  return c.card({
    ...profileWrap(ctx, v, w - 34, size),
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    fill: C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawProfileChapterFooter(ctx, api, C, v) {
  return drawProfileChapterText(ctx, api, C, v, 960, 1015, 26, C.muted, 'center');
}
export function drawProfileChapterTable(ctx, api, C, t, labels, x, y, w, h, size = 28) {
  return t.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: C.panel,
    stroke: C.muted,
    textColor: C.ink,
  });
}
export function profileWrap(ctx, label, width, size) {
  ctx.save();
  ctx.font = lessonFont(size);
  const lines = [];
  for (const paragraph of String(label).split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  ctx.restore();
  return {
    label: lines.join('\n'),
    baselineOffset: size * 0.25 - (lines.length - 1) * size * 0.7,
  };
}
