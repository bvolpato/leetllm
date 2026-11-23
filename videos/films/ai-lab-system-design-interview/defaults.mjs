export function chapterText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function rect(ctx, api, x, y, w, h, color = api.C.panel, stroke = api.C.muted) {
  return api.rect(ctx, x, y, Math.max(0.1, w), Math.max(0.1, h), color, stroke, 4);
}
export function line(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function chapterCard(ctx, api, v, x, y, w = 650, color = api.C.blue, h = 78, size = 29) {
  return api.components.card({
    label: String(v),
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    baselineOffset: String(v).includes('\n') ? -0.36 * size : undefined,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function footer(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 1000, 26, api.C.muted, 'center');
}
export function header(ctx, api, v, x = 960, y = 290, color = api.C.cyan) {
  return chapterText(ctx, api, v, x, y, 34, color, 'center');
}
export function bar(ctx, api, v, max, x, y, w = 1100, color = api.C.blue, label = '') {
  rect(ctx, api, x, y, w, 48, api.C.panel, api.C.muted);
  if (v > 0) rect(ctx, api, x, y, (w * v) / max, 48, color, color);
  if (label) chapterText(ctx, api, label, x, y - 18, 27, color);
}
export function dot(ctx, api, x, y, color = api.C.cyan, r = 12) {
  return api.circle(ctx, x, y, r, color);
}
export function path(ctx, api, points, color = api.C.cyan, width = 4) {
  return api.path(ctx, points, {
    color,
    width,
  });
}
export function receipt(ctx, api, fields, x, y, w = 690) {
  fields.forEach(([k, v], i) => {
    chapterText(ctx, api, k, x, y + i * 65, 26, api.C.muted);
    chapterText(ctx, api, v, x + w, y + i * 65, 29, api.C.ink, 'right');
    line(ctx, api, x, y + i * 65 + 20, x + w, y + i * 65 + 20, api.C.muted, 1);
  });
}
export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function math(ctx, api, value, x, y, size = 42, color = api.C.yellow, align = 'center') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 96, fontSize = 29) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    baselineOffset: label.includes('\n') ? -0.36 * fontSize : undefined,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
