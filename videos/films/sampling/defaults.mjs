import { durationDensity } from './model.mjs';
import { sampleFunction } from 'vizmatic';
export function drawOriginalSamplingText(
  ctx,
  api,
  v,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawOriginalSamplingEquation(
  ctx,
  api,
  v,
  x,
  y,
  size = 42,
  color = api.C.ink,
  align = 'left',
) {
  return api.math(ctx, v, x, y, size, color, align);
}
export function drawOriginalSamplingTarget(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawOriginalSamplingPath(
  ctx,
  api,
  points,
  color = api.C.muted,
  width = 3,
  progress = 1,
) {
  return api.path(ctx, points, {
    color,
    width,
    progress,
  });
}
export function drawOriginalSamplingDot(ctx, api, at, color, radius = 11, hollow = false) {
  return api.circle(
    ctx,
    at.x,
    at.y,
    radius,
    hollow ? api.C.panel : color,
    hollow ? color : undefined,
    hollow ? 4 : 0,
  );
}
export function drawOriginalSamplingAxes(
  ctx,
  api,
  x = 225,
  y = 350,
  width = 1050,
  height = 460,
  xd = [0, 24],
  yd = [0, 0.16],
  label = 'density per second',
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: xd[1] === 24 ? [0, 6, 10, 15, 24] : [0, 10, 20, 30],
    yTicks: yd[1] === 0.16 ? [0, 0.08, 0.16] : yd[1] === 0.3 ? [0, 0.1, 0.2, 0.3] : [0, 0.5, 1],
    xLabel: 'reply duration (seconds)',
    yLabel: label,
  });
}
export function drawOriginalSamplingDensity(ctx, api, q, sigma = 0.55, color = api.C.blue) {
  return api.teaching.curve({
    plot: q,
    points: sampleFunction((t) => durationDensity(t, sigma), 0.03, 24, 220),
    color,
    width: 5,
  });
}
export function drawOriginalSamplingFillArea(ctx, api, q, lower, upper, sigma, color) {
  if (upper - lower <= 1e-6) return;
  const points = [
    q.point(lower, 0),
    ...sampleFunction((t) => durationDensity(t, sigma), lower, upper, 160).map((p) =>
      q.point(p.x, p.y),
    ),
    q.point(upper, 0),
  ];
  api.path(ctx, points, {
    color: color + '65',
    width: 1,
    fill: color + '50',
    closed: true,
  });
}
export function drawOriginalSamplingFooter(ctx, api, text, color = api.C.muted) {
  return drawOriginalSamplingText(ctx, api, text, 960, 985, 31, color, 'center');
}
export function drawOriginalSamplingGrid(
  ctx,
  api,
  timely,
  later,
  unfinished,
  { shift = 0, transfer = false } = {},
) {
  for (let i = 0; i < 250; i++) {
    const row = Math.floor(i / 25),
      column = i % 25,
      at = {
        x: 260 + column * 48,
        y: 430 + row * 36,
      };
    const kind = i < 160 ? 'timely' : i < 200 ? 'later' : 'unfinished';
    const known =
      kind === 'timely' ? i < timely : kind === 'later' ? i - 160 < later : i - 200 < unfinished;
    if (kind === 'unfinished') at.x += 260 * shift;
    const color = !known
      ? api.C.muted
      : kind === 'timely'
        ? api.C.cyan
        : kind === 'later'
          ? transfer
            ? api.C.green
            : api.C.blue
          : api.C.pink;
    drawOriginalSamplingDot(ctx, api, at, color, 9, !known || kind === 'unfinished');
  }
}
export function drawSamplingExtensionText(
  ctx,
  api,
  s,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawSamplingExtensionEquation(
  ctx,
  api,
  s,
  x,
  y,
  size = 40,
  color = api.C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawSamplingExtensionL(ctx, api, pts, color = api.C.muted, width = 3) {
  return api.path(ctx, pts, {
    color,
    width,
  });
}
export function drawSamplingExtensionD(ctx, api, x, y, color = api.C.cyan, r = 9) {
  return api.circle(ctx, x, y, r, color);
}
export function drawSamplingExtensionRectangle(ctx, api, x, y, w, h, color = api.C.blue, stroke) {
  return api.rect(ctx, x, y, w, Math.max(0.5, h), color, stroke, 3);
}
export function drawSamplingExtensionFooter(ctx, api, s, color = api.C.muted) {
  return drawSamplingExtensionText(ctx, api, s, 960, 985, 28, color, 'center');
}
export function drawSamplingExtensionPlot(
  ctx,
  api,
  xd,
  yd,
  x = 240,
  y = 365,
  w = 1020,
  h = 455,
  xLabel = '',
  yLabel = '',
) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xd,
    yDomain: yd,
    xTicks:
      xLabel === 'candidate token'
        ? []
        : xd[0] === 0.5
          ? [1, 2, 3, 4, 5, 6]
          : xd[0] === -0.5 && xd[1] === 1.5
            ? [0, 1]
            : xd[0] === -0.5
              ? Array.from(
                  {
                    length: 5,
                  },
                  (_, i) => Math.round((i * (xd[1] - 0.5)) / 4),
                )
              : Array.from(
                  {
                    length: 5,
                  },
                  (_, i) => Number((xd[0] + (i * (xd[1] - xd[0])) / 4).toPrecision(6)),
                ),
    yTicks: yLabel
      ? Array.from(
          {
            length: 3,
          },
          (_, i) => Number((yd[0] + (i * (yd[1] - yd[0])) / 2).toPrecision(6)),
        )
      : [],
    xLabel: xLabel === 'candidate token' ? '' : xLabel,
    yLabel,
  });
}
export function drawSamplingExtensionCurve(ctx, api, q, fun, x0, x1, color = api.C.blue) {
  return api.teaching.curve({
    plot: q,
    points: sampleFunction(fun, x0, x1, 180),
    color,
    width: 4,
  });
}
export function drawSamplingExtensionNum(ctx, api, label, value, y, color = api.C.cyan) {
  drawSamplingExtensionText(ctx, api, label, 1570, y, 28, api.C.muted, 'center');
  drawSamplingExtensionText(ctx, api, value, 1570, y + 58, 40, color, 'center');
}
