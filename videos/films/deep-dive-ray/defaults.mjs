export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
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
export function chapterText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function heading(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 278, 36, api.C.yellow, 'center');
}
export function footer(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 1010, 25, api.C.muted, 'center');
}
export function chapterCard(ctx, api, label, x, y, w = 440, color = api.C.blue, h = 95, size = 29) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function chapterGrid(
  ctx,
  api,
  labels,
  x,
  y,
  w,
  h,
  color = api.C.blue,
  size = 28,
  highlights = [],
) {
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
    highlights,
  });
}
export function packet(ctx, api, label, x, y, color = api.C.yellow, w = 180) {
  return chapterCard(ctx, api, label, x, y, w, color, 65, 25);
}
export function arrow(ctx, api, x, y, z, v, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, v, color, 3);
}
export function panel(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
  });
}
export function meter(ctx, api, label, value, max, x, y, w, color, readout = true) {
  chapterText(ctx, api, label, x, y - 18, 26, color);
  api.rect(ctx, x, y, w, 38, api.C.panel, api.C.muted, 2);
  if (value > 0) api.rect(ctx, x, y, (w * value) / max, 38, color, undefined, 0);
  if (readout) chapterText(ctx, api, value + ' / ' + max, x + w + 18, y + 30, 25, color);
}
