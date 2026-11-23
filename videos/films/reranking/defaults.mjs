export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, w = 380, color = api.C.cyan, h = 86, fontSize = 32) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 12,
    baselineOffset: fontSize * 0.34 - (String(label).split('\n').length - 1) * fontSize * 0.7,
  });
}
export function originalCaption(ctx, api, s) {
  return text(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
export function coreText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function codeText(ctx, api, v, x, y, size = 27, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align, 'mono');
}
export function coreEquation(ctx, api, v, x, y, size = 40, color = api.C.cyan) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function focusTarget(ctx, api, id, fn) {
  return api.focus.target(id + '-mark', fn);
}
export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function cueDone(ctx, api, id) {
  return cueProgress(ctx, api, id) === 1;
}
export function focusTargets(ctx, api, ids, fn) {
  return ids.reduceRight((next, id) => () => focusTarget(ctx, api, id, next), fn)();
}
export function line(ctx, api, x, y, x2, y2, color = api.C.muted, w = 2) {
  return api.line(ctx, x, y, x2, y2, color, w);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.cyan, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 10);
}
export function caption(ctx, api, s, color = api.C.muted) {
  return coreText(ctx, api, s, 960, 1035, 26, color, 'center');
}
export function dot(ctx, api, x, y, r, color) {
  return api.circle(ctx, x, y, r, color);
}
export function arrow(ctx, api, a, z, color = api.C.cyan, width = 4) {
  line(ctx, api, a.x, a.y, z.x, z.y, color, width);
  const angle = Math.atan2(z.y - a.y, z.x - a.x);
  line(
    ctx,
    api,
    z.x,
    z.y,
    z.x - 13 * Math.cos(angle - 0.5),
    z.y - 13 * Math.sin(angle - 0.5),
    color,
    width,
  );
  line(
    ctx,
    api,
    z.x,
    z.y,
    z.x - 13 * Math.cos(angle + 0.5),
    z.y - 13 * Math.sin(angle + 0.5),
    color,
    width,
  );
}
export function pointCurve(ctx, api, plot, fn, color, min, max) {
  let prev = plot.point(min, fn(min));
  for (let i = 1; i <= 100; i++) {
    const x = min + ((max - min) * i) / 100,
      z = plot.point(x, fn(x));
    line(ctx, api, prev.x, prev.y, z.x, z.y, color, 3);
    prev = z;
  }
}
