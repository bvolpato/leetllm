import { lessonFont } from '../../lib/fonts.mjs';
export function drawText(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawEquation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 300,
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
export function drawChapterText(ctx, api, v, x, y, z = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawChapterEquation(ctx, api, v, x, y, z = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, z, color, 'center');
}
export function drawChapterCard(
  ctx,
  api,
  label,
  x,
  y,
  w = 450,
  color = api.C.blue,
  h = 100,
  z = 29,
) {
  return api.components.card({
    ...chapterWrap(ctx, label, w - 34, z),
    x,
    y,
    width: w,
    height: h,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawFooter(ctx, api, v) {
  return drawChapterText(ctx, api, v, 960, 1015, 26, api.C.muted, 'center');
}
export function formatCount(ctx, api, v) {
  return v.toLocaleString('en-US');
}
export function drawTable(ctx, api, labels, x, y, w, h, size = 27) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
  });
}
export function drawBars(ctx, api, values, labels, x, y, w, h, highlight = -1) {
  const slot = w / values.length;
  values.forEach((v, i) => {
    const height = Math.max(0, v) * h;
    api.rect(
      ctx,
      x + i * slot + slot * 0.18,
      y + h - height,
      slot * 0.64,
      height,
      i === highlight ? api.C.yellow : api.C.blue,
      undefined,
      0,
    );
    drawChapterText(
      ctx,
      api,
      labels[i],
      x + (i + 0.5) * slot,
      y + h + 46,
      28,
      i === highlight ? api.C.yellow : api.C.muted,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      v.toFixed(4),
      x + (i + 0.5) * slot,
      y + h - height - 20,
      26,
      i === highlight ? api.C.yellow : api.C.cyan,
      'center',
    );
  });
}
export function chapterWrap(ctx, label, width, size) {
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
