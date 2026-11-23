export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 48) {
  return api.math(ctx, v, x, y, size, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width = 420, color = api.C.blue, height = 100) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function grid(ctx, api, labels, x, y, width, height, color = api.C.blue, fontSize = 32) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function drawChapterText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawChapterEquation(ctx, api, v, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawChapterBox(
  ctx,
  api,
  label,
  x,
  y,
  width = 380,
  color = api.C.blue,
  height = 92,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 27,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawChapterGrid(ctx, api, labels, x, y, w, h, color = api.C.blue, size = 29) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function drawChapterLine(ctx, api, x, y, z, w, color = api.C.muted) {
  return api.line(ctx, x, y, z, w, color, 3);
}
export function drawChapterArrow(ctx, api, x, y, z, w, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, w, color, 3);
}
export function drawChapterTarget(ctx, api, name, fn) {
  return api.focus.target(name, fn);
}
