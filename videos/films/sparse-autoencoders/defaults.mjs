export function retainedDrawText(ctx, api, v, x, y, n = 36, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, n, k, a);
}
export function retainedDrawEquation(ctx, api, v, x, y, n = 48, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, n, k, a);
}
export function retainedDrawPlot(ctx, api) {
  return api.teaching.axes({
    x: 260,
    y: 380,
    width: 800,
    height: 430,
    xDomain: [-0.5, 3],
    yDomain: [-0.5, 2.5],
    equalUnits: true,
    xTicks: [0, 1, 2, 3],
    yTicks: [0, 1, 2],
    xLabel: 'raw coordinate 1',
    yLabel: 'raw coordinate 2',
    fontSize: 34,
  });
}
export function retainedDrawArrow(ctx, api, q, a, z, k) {
  const f = q.point(...a),
    t = q.point(...z);
  return api.arrow(ctx, f.x, f.y, t.x, t.y, k, 5);
}
export function cue(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function textLabel(ctx, api, s, x, y, n = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, n, col, align);
}
export function equation(ctx, api, s, x, y, n = 44, col = api.C.cyan) {
  return api.math(ctx, s, x, y, n, col, 'center');
}
export function rectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 6);
}
export function L(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function foot(ctx, api, s) {
  return textLabel(ctx, api, s, 960, 1030, 29, api.C.yellow, 'center');
}
export function head(ctx, api, s) {
  return textLabel(ctx, api, s, 960, 270, 34, api.C.blue, 'center');
}
export function box(ctx, api, s, x, y, w = 600, col = api.C.blue, h = 100) {
  const shape = rectangle(ctx, api, x, y, w, h, col);
  textLabel(ctx, api, s, x + w / 2, y + h * 0.64, 29, col, 'center');
  return shape;
}
export function axes(ctx, api, xd = [-0.2, 2.6], yd = [-0.2, 2]) {
  return api.teaching.axes({
    x: 200,
    y: 400,
    width: 780,
    height: 450,
    xDomain: xd,
    yDomain: yd,
    equalUnits: true,
    xTicks: [0, 1, 2],
    yTicks: [0, 1, 2],
    xLabel: 'coordinate 1',
    yLabel: 'coordinate 2',
    fontSize: 29,
  });
}
export function arrow(ctx, api, plot, a, z, col) {
  const u = plot.point(...a),
    v = plot.point(...z);
  api.arrow(ctx, u.x, u.y, v.x, v.y, col, 5);
}
