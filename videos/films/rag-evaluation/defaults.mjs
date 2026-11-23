import { lessonFont } from '../../lib/fonts.mjs';
export function wrapLabel(ctx, label, width, size) {
  ctx.save();
  ctx.font = lessonFont(size);
  const lines = [];
  for (const row of String(label).split('\n')) {
    let line = '';
    for (const word of row.split(' ')) {
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
export function drawPolicyChapterText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawPolicyChapterEquation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawPolicyChapterCard(
  ctx,
  api,
  v,
  x,
  y,
  w = 500,
  color = api.C.blue,
  h = 100,
  size = 29,
) {
  return api.components.card({
    ...wrapLabel(ctx, v, w - 32, size),
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawPolicyChapterFooter(ctx, api, v) {
  return drawPolicyChapterText(ctx, api, v, 960, 1015, 27, api.C.muted, 'center');
}
export function drawPolicyChapterRule(ctx, api, fresh = false) {
  const rows = [
    'Payment-service production deploys during a release freeze',
    'require incident commander approval and a linked rollback plan',
    'before rollout.' + (fresh ? ' A maintenance-window identifier is also required.' : ''),
  ];
  rows.forEach((v, i) =>
    drawPolicyChapterText(
      ctx,
      api,
      v,
      960,
      320 + i * 48,
      29,
      i === 0 ? api.C.blue : i === 1 ? api.C.yellow : api.C.green,
      'center',
    ),
  );
}
export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, w = 500, color = api.C.cyan, h = 90) {
  return api.components.card({
    ...wrapLabel(ctx, label, w - 32, 32),
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    padding: 12,
  });
}
export function particleGap(ctx, api, shape, toward) {
  const center = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    },
    dx = toward.x + toward.width / 2 - center.x,
    dy = toward.y + toward.height / 2 - center.y;
  const length = Math.hypot(dx, dy),
    edge = api.anchor(shape, toward);
  // Clear the full particle radius and a four-pixel margin normal to every card edge.
  const outside =
    Math.min(
      dx === 0 ? Infinity : (shape.width / 2 + 12) / Math.abs(dx),
      dy === 0 ? Infinity : (shape.height / 2 + 12) / Math.abs(dy),
    ) * length;
  return outside - Math.hypot(edge.x - center.x, edge.y - center.y);
}
export function foot(ctx, api, s) {
  return text(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
