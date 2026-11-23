export function drawConstructedText(
  ctx,
  api,
  s,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawConstructedEquation(ctx, api, s, x, y, size = 39, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawConstructedArrow(ctx, api, x, y, xx, yy, c = api.C.muted) {
  return api.arrow(ctx, x, y, xx, yy, c, 3);
}
export function drawConstructedLine(ctx, api, x, y, xx, yy, c = api.C.muted, w = 2) {
  return api.line(ctx, x, y, xx, yy, c, w);
}
export function drawConstructedHead(ctx, api, s) {
  return drawConstructedText(ctx, api, s, 960, 255, 35, api.C.ink, 'center');
}
export function drawConstructedNote(ctx, api, s) {
  return drawConstructedText(ctx, api, s, 960, 1030, 26, api.C.muted, 'center');
}
export function drawConstructedBox(ctx, api, s, x, y, w = 360, h = 80, c = api.C.cyan, size = 31) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, api.C.panel, c, 2);
  drawConstructedText(ctx, api, s, x, y + size * 0.34, size, c, 'center');
}
export function drawConstructedPlot(ctx, api, x, y, w, h, xd, yd, xl, yl, xt, yt) {
  return api.teaching.axes({
    x,
    y,
    width: w,
    height: h,
    xDomain: xd,
    yDomain: yd,
    xLabel: xl,
    yLabel: yl,
    xTicks: xt,
    yTicks: yt,
    fontSize: 24,
  });
}
export function drawConstructedCurve(ctx, api, p, fn, start, end, color, width = 4, progress = 1) {
  return api.teaching.curve({
    plot: p,
    points: Array.from(
      {
        length: 241,
      },
      (_, i) => {
        const x = start + ((end - start) * i) / 240;
        return {
          x,
          y: fn(x),
        };
      },
    ),
    color,
    width,
    progress,
  });
}
export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 46, color = api.C.ink, align = 'left') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function axes(ctx, api, x, y, width, height, xd, yd, xl, yl, xt, yt) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xLabel: xl,
    yLabel: yl,
    xTicks: xt,
    yTicks: yt,
    fontSize: 25,
  });
}
