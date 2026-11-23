import { clamp, mix } from './arithmetic.mjs';
export function drawText(
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
export function drawEquation(ctx, api, v, x, y, size = 40, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function withFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 230,
  height = 78,
  color = api.C.blue,
  opacity = 1,
  fontSize = 30,
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
    radius: 12,
    padding: 12,
    font: label.includes('_') ? 'mono' : 'sans',
    fontSize,
    opacity,
  });
}
export function drawPanel(ctx, api, x, y, width, height, color, paint) {
  return api.components.panel(
    {
      x,
      y,
      width,
      height,
      fill: api.C.panel,
      stroke: color,
      radius: 14,
      padding: 20,
    },
    paint,
  );
}
export function wrapMessageText(ctx, api, s, n) {
  const lines = [''];
  for (const word of s.split(' ')) {
    const i = lines.length - 1;
    if (lines[i] && lines[i].length + word.length + 1 > n) lines.push(word);
    else lines[i] += (lines[i] ? ' ' : '') + word;
  }
  return lines;
}
export function drawMessage(ctx, api, row, x, y, width = 1500, color = api.C.blue, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const shape = drawPanel(ctx, api, x, y, width, 115, color, () => {
    drawText(ctx, api, 'M' + row.id, x + 24, y + 66, 34, color, 'left', 'mono');
    wrapMessageText(ctx, api, row.text, Math.floor((width - 155) / 16)).forEach((line, i) =>
      drawText(ctx, api, line, x + 125, y + 46 + i * 36, 28),
    );
  });
  ctx.restore();
  return shape;
}
export function drawReference(ctx, api, id, x, y, color = api.C.cyan, opacity = 1, width = 230) {
  return drawCard(ctx, api, 'M' + id, x, y, width, 78, color, opacity);
}
export function drawTransfer(ctx, api, source, target, color = api.C.muted, p, opacity = 1) {
  const route = api.teaching.transfer({
    source: {
      shape: source,
      opacity,
    },
    target: {
      shape: target,
      opacity: 1,
    },
    gap: 14,
    color: p === undefined ? color : api.C.muted,
  });
  if (p !== undefined && p > 0) {
    const end = {
      x: mix(route.from.x, route.to.x, clamp(p)),
      y: mix(route.from.y, route.to.y, clamp(p)),
    };
    if (Math.hypot(end.x - route.from.x, end.y - route.from.y) > 18)
      api.arrow(ctx, route.from.x, route.from.y, end.x, end.y, color, 4);
    else api.line(ctx, route.from.x, route.from.y, end.x, end.y, color, 4);
  }
  return route;
}
export function drawPosting(ctx, api, term, ids, x, y, width = 760) {
  const key = drawCard(ctx, api, term, x, y + 24, 200, 78, api.C.cyan, 1, 34);
  ids.forEach((id, i) =>
    drawReference(
      ctx,
      api,
      id,
      x + 240 + i * (width >= 850 ? 190 : 160),
      y + 24,
      api.C.green,
      1,
      width >= 850 ? 170 : 140,
    ),
  );
  return key;
}
export function drawCaption(ctx, api, v, color = api.C.muted, y = 965) {
  return drawText(ctx, api, v, 960, y, 30, color, 'center');
}
export function drawChapterText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawChapterRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  color = api.C.blue,
  fill = 'transparent',
) {
  return api.rect(ctx, x, y, w, h, fill, color, 5);
}
export function drawChapterLine(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function drawChapterCard(ctx, api, v, x, y, color = api.C.blue, w = 250, h = 76) {
  drawChapterRectangle(ctx, api, x, y, w, h, color, api.C.panel);
  drawChapterText(ctx, api, v, x + w / 2, y + h * 0.63, 28, color);
}
export function drawChapterReference(ctx, api, id, x, y, color = api.C.cyan, w = 120) {
  return drawChapterCard(ctx, api, 'M' + id, x, y, color, w, 72);
}
export function drawChapterFooter(ctx, api, v) {
  return drawChapterText(ctx, api, v, 960, 1015, 25, api.C.muted);
}
export function drawChapterPath(ctx, api, points, color = api.C.cyan) {
  return api.path(ctx, points, {
    color,
    width: 3,
  });
}
export function pointOnPath(ctx, api, points, q) {
  return api.pointAlongPath(points, api.clamp(q));
}
