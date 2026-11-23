import { sigmoid } from './arithmetic.mjs';
import { openingRequest, training } from './fixtures.mjs';
import { reviewRegionVertices } from './model.mjs';
import { dotProduct, sampleFunction } from 'vizmatic';
export const mark = (api, id, paint) => api.focus.target(id, paint);
export const T = (ctx, api, text, x, y, size = 34, color = api.C.ink, align = 'center', font) =>
  api.text(
    ctx,
    String(text),
    x,
    y,
    size,
    color,
    align,
    font
      ? {
          font,
        }
      : undefined,
  );
export const M = (ctx, api, text, x, y, size = 44, color = api.C.ink) =>
  api.math(ctx, text, x, y, size, color, 'center');
export const line = (ctx, api, points, color = api.C.muted, width = 3) =>
  api.path(ctx, points, {
    color,
    width,
  });
export function chip(ctx, api, text, x, y, w = 220, h = 78, color = api.C.cyan, size = 34) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 8);
  T(ctx, api, text, x + w / 2, y + h / 2 + size * 0.34, size, api.C.ink);
}
export function request(ctx, api, x, y, { w = 500, score = 'pending', outcome = 'pending' } = {}) {
  api.rect(ctx, x, y, w, 200, api.C.panel, api.C.cyan, 12);
  T(ctx, api, openingRequest.id, x + w / 2, y + 43, 27, api.C.muted);
  T(ctx, api, openingRequest.text, x + w / 2, y + 95, 37);
  T(ctx, api, 'score: ' + score, x + w / 2, y + 151, 32, api.C.cyan);
  T(ctx, api, 'outcome: ' + outcome, x + w / 2, y + 184, 27, api.C.muted);
}
export function token(ctx, api, v, x, y, { radius = 29, hidden = false, outline } = {}) {
  api.circle(
    ctx,
    x,
    y,
    radius,
    hidden ? api.C.panel : v.label ? api.C.pink : api.C.blue,
    outline ?? (hidden ? api.C.muted : undefined),
    2,
  );
  T(ctx, api, v.id, x, y + 10, 29, hidden ? api.C.ink : api.C.bg);
}
export function plane(api) {
  return api.teaching.axes({
    x: 260,
    y: 345,
    width: 1000,
    height: 460,
    xDomain: [0.5, 5],
    yDomain: [0, 9],
    xTicks: [1, 2, 3, 4, 5],
    yTicks: [0, 3, 6, 9],
    xLabel: 'ambiguity',
    yLabel: 'policy support',
  });
}
export function thresholdLine(ctx, api, q, w, t = 0.5, shade = false) {
  if (Math.abs(w[2]) < 1e-9) return;
  const level = Math.log(t / (1 - t)),
    y = (x) => (level - w[0] - w[1] * x) / w[2];
  if (shade) {
    const points = reviewRegionVertices(w, t).map((v) => q.point(v.x, v.y));
    ctx.save();
    ctx.globalAlpha *= 0.13;
    api.path(ctx, points, {
      fill: api.C.yellow,
      color: undefined,
      closed: true,
      clip: q.bounds,
    });
    ctx.restore();
  }
  api.teaching.curve({
    plot: q,
    points: sampleFunction(y, 0.5, 5, 80),
    color: api.C.yellow,
    width: 4,
  });
}
export function trainPoints(ctx, api, q, w, t = 0.5, rings = false) {
  for (const [a, s, label] of training) {
    const at = q.point(a, s),
      p = sigmoid(dotProduct(w, [1, a, s]));
    api.circle(ctx, at.x, at.y, 11, label ? api.C.pink : api.C.blue);
    if (rings && p >= t) api.circle(ctx, at.x, at.y, 20, '#00000000', api.C.yellow, 3);
  }
}
export function cueAmount(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function text(ctx, api, s, x, y, n = 32, c = api.C.ink) {
  return T(ctx, api, s, x, y, n, c);
}
export function equation(ctx, api, s, x, y, n = 44, c = api.C.cyan) {
  return M(ctx, api, s, x, y, n, c);
}
export function rectangle(ctx, api, x, y, w, h, c, stroke) {
  return api.rect(ctx, x, y, w, h, c, stroke, 6);
}
export function segment(ctx, api, x, y, x2, y2, c = api.C.muted, w = 3) {
  return api.line(ctx, x, y, x2, y2, c, w);
}
export function axes(ctx, api, x, y, w, h, xd, yd, xLabel, yLabel) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xd,
    yDomain: yd,
    xTicks: [xd[0], (xd[0] + xd[1]) / 2, xd[1]],
    yTicks: [yd[0], (yd[0] + yd[1]) / 2, yd[1]],
    xLabel,
    yLabel,
  });
}
export function curve(ctx, api, q, fn, a, z, c = api.C.cyan) {
  if (z <= a) return;
  api.teaching.curve({
    plot: q,
    points: sampleFunction(fn, a, z, 120),
    color: c,
    width: 4,
  });
}
export function labelPoint(ctx, api, q, x, y, c, tag) {
  const a = q.point(x, y);
  api.circle(ctx, a.x, a.y, 10, c);
  if (tag) text(ctx, api, tag, a.x, a.y - 28, 28, c);
  return a;
}
