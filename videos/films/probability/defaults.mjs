import { clamp, mix } from './arithmetic.mjs';
export function text(ctx, api, value, x, y, size = 34, color = api.C.ink, align = 'center') {
  api.text(ctx, String(value), x, y, size, color, align);
}
export function box(ctx, api, value, x, y, width, height, color, size = 34) {
  return api.components.card({
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    radius: 12,
    label: String(value),
    labelColor: color,
    fontSize: size,
  });
}
export function focus(api, id, paint) {
  return api.focus.target(id, paint);
}
export function cell(row) {
  return {
    x: 310 + (4 - (row.index % 5)) * 290,
    y: 365 + Math.floor(row.index / 5) * 120,
  };
}
export function route(from, to, progress, exit = false) {
  const points = exit
    ? [
        from,
        {
          x: 25,
          y: from.y,
        },
        {
          x: 25,
          y: 715,
        },
        to,
      ]
    : [
        {
          x: 25,
          y: 325,
        },
        {
          x: 25,
          y: to.y,
        },
        to,
      ];
  const q = clamp(progress) * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(q)),
    a = points[i],
    b = points[i + 1];
  return {
    x: mix(a.x, b.x, q - i),
    y: mix(a.y, b.y, q - i),
  };
}
export function packet(ctx, api, row, at, opacity = 1, label = true) {
  if (opacity <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const width = (250 * row.count) / 50,
    color = row.abusive ? api.C.red : api.C.blue;
  api.rect(ctx, at.x, at.y, width, 68, color, undefined, 7);
  if (label) {
    text(ctx, api, row.count, at.x + width / 2, at.y + 43, 32, api.C.bg);
    text(ctx, api, row.id, at.x + 125, at.y + 96, 22, color);
  }
  ctx.restore();
}
export function queueField(ctx, api, id, paint) {
  focus(api, id, () => {
    api.rect(ctx, 225, 340, 1555, 425, api.C.panel, undefined, 10);
    paint();
  });
}
export function countReceipt(ctx, api, value, sub, y = 885, color = api.C.yellow) {
  text(ctx, api, value, 960, y, 43, color);
  if (sub) text(ctx, api, sub, 960, y + 62, 29, api.C.muted);
}
export function detailText(ctx, api, v, x, y, size = 31, col = api.C.ink, align = 'center') {
  return text(ctx, api, v, x, y, size, col, align);
}
export function equation(ctx, api, v, x, y, size = 44, col = api.C.yellow) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 2);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function focusTarget(ctx, api, id, paint) {
  return focus(api, id, paint);
}
