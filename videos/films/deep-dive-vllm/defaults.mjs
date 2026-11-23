export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function math(ctx, api, v, x, y, size = 48, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
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
export function chapterText(ctx, api, text, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(text), x, y, size, color, align);
}
export function chapterCard(ctx, api, label, x, y, w = 420, color = api.C.blue, h = 90, size = 28) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
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
export function grid(ctx, api, rows, x, y, w, h, color = api.C.blue, size = 26) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: rows.length,
    columns: rows[0].length,
    labels: rows,
    fontSize: size,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function arrow(ctx, api, x, y, z, w, color = api.C.cyan) {
  return api.arrow(ctx, x, y, z, w, color, 3);
}
export function rect(ctx, api, x, y, w, h, color = api.C.blue) {
  return api.rect(ctx, x, y, w, h, color, api.C.panel, 2);
}
export function packet(ctx, api, text, x, y, color = api.C.yellow, w = 180) {
  return chapterCard(ctx, api, text, x, y, w, color, 65, 24);
}
export function tokenCell(api, label, x, y, width, height, color, filled = false, fontSize = 31) {
  return api.components.card({
    x,
    y,
    width,
    height,
    label,
    fontSize,
    padding: 5,
    fill: filled ? color : api.C.panel,
    stroke: color,
    textColor: filled ? api.C.bg : color,
  });
}
