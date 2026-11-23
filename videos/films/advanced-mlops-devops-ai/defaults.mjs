import { lessonFont } from '../../lib/fonts.mjs';
export function drawOriginalText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 95,
  z = 30,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    baselineOffset: z * (0.34 - 0.7 * (label.split('\n').length - 1)),
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function drawReleaseText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawReleaseEquation(ctx, api, v, x, y, size = 40, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawReleaseBox(ctx, api, v, x, y, w = 420, h = 90, color = api.C.blue, size = 30) {
  const lines = [];
  ctx.save();
  ctx.font = lessonFont(size);
  for (const paragraph of String(v).split('\n')) {
    let row = '';
    for (const word of paragraph.split(/\s+/)) {
      if (row && ctx.measureText(row + ' ' + word).width > w - 34) {
        lines.push(row);
        row = word;
      } else row += (row ? ' ' : '') + word;
    }
    lines.push(row);
  }
  ctx.restore();
  return api.components.card({
    label: lines.join('\n'),
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: size,
    padding: 14,
    baselineOffset: size * (0.34 - 0.7 * (lines.length - 1)),
  });
}
export function drawReleaseLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawReleaseArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawReleaseHeading(ctx, api, v) {
  return drawReleaseText(ctx, api, v, 960, 270, 33, api.C.muted, 'center');
}
export function drawReleaseFooter(ctx, api, v) {
  return drawReleaseText(ctx, api, v, 960, 1015, 28, api.C.muted, 'center');
}
export function releaseActionColor(ctx, api, v) {
  return v === 'rollback' ? api.C.pink : v === 'review' ? api.C.yellow : api.C.green;
}
export function drawReleaseRows(
  ctx,
  api,
  values,
  { x = 180, y = 350, w = 1530, h = 90, gap = 24, color = api.C.blue } = {},
) {
  return values.map((v, i) => drawReleaseBox(ctx, api, v, x, y + i * (h + gap), w, h, color, 30));
}
