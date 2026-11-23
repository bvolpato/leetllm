import { sampleFunction } from 'vizmatic';
export function retainedText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function retainedEquation(ctx, api, v, x, y, z = 44, col = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function retainedCard(ctx, api, v, x, y, w = 300, col = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 86,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
    fontSize: 32,
  });
}
export function retainedAllocation(ctx, api, n, d, x, y, scale = 16) {
  api.rect(ctx, x, y, n * scale, d * scale, '#79aaff28', api.C.blue, 0);
  retainedText(
    ctx,
    api,
    'Parameters',
    x + (n * scale) / 2,
    y + d * scale + 52,
    30,
    api.C.blue,
    'center',
  );
  retainedText(ctx, api, 'Token presentations', x, y - 28, 30, api.C.cyan);
}
export function text(ctx, api, v, x, y, size = 31, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function equation(ctx, api, v, x, y, size = 40, col = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, size, col, align);
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 0);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function label(ctx, api, v, x, y, w = 360, color = api.C.cyan) {
  rectangle(ctx, api, x, y, w, 68, api.C.panel, color);
  text(ctx, api, v, x + w / 2, y + 44, 30, color, 'center');
}
export function dot(ctx, api, x, y, color = api.C.yellow, r = 9) {
  return api.circle(ctx, x, y, r, color);
}
export function plot(ctx, api, x, y, w, h, xd, yd, xlab, ylab) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xd,
    yDomain: yd,
    xTicks: [],
    yTicks: [],
    xLabel: xlab,
    yLabel: ylab,
    color: api.C.muted,
  });
}
export function curve(ctx, api, pl, fn, lo, hi, col = api.C.cyan, progress = 1) {
  return api.teaching.curve({
    plot: pl,
    points: sampleFunction(fn, lo, hi, 100),
    color: col,
    progress,
    width: 4,
  });
}
export function point(ctx, api, pl, x, y, col = api.C.yellow, r = 10) {
  return api.teaching.scatter({
    plot: pl,
    points: [
      {
        x,
        y,
      },
    ],
    color: col,
    radius: r,
  });
}
export function band(ctx, api, caption) {
  return text(ctx, api, caption, 960, 265, 30, api.C.muted, 'center');
}
export function allocation(ctx, api, n, d, x, y, scale, maxN, maxD, color = api.C.cyan) {
  rectangle(ctx, api, x, y - maxD * scale, maxN * scale, maxD * scale, api.C.panel, api.C.muted);
  rectangle(ctx, api, x, y - d * scale, n * scale, d * scale, `${color}25`, color);
  text(ctx, api, `N ${n.toFixed(2)}`, x + (n * scale) / 2, y + 43, 28, api.C.blue, 'center');
  text(ctx, api, `D ${d.toFixed(2)}`, x + maxN * scale + 28, y - (d * scale) / 2, 28, api.C.cyan);
}
