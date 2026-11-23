export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function detailText(ctx, api, v, x, y, size = 32, color = api.C.ink) {
  return String(v).includes('_')
    ? api.math(
        ctx,
        '\\texttt{' + String(v).replaceAll('_', '\\_') + '}',
        x,
        y,
        size,
        color,
        'center',
      )
    : api.text(ctx, String(v), x, y, size, color, 'center');
}
export function detailLine(ctx, api, x, y, a, z, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, a, z, color, width);
}
export function detailRectangle(ctx, api, x, y, w, h, color = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, color, stroke, 1);
}
export function progressArrow(ctx, api, x, y, a, z, color = api.C.cyan, p = 1) {
  return api.arrow(ctx, x, y, x + (a - x) * p, y + (z - y) * p, color, 3);
}
export function detailTag(ctx, api, v, x, y, color = api.C.blue, w = 650) {
  detailRectangle(ctx, api, x - w / 2, y - 40, w, 80, api.C.panel);
  detailLine(ctx, api, x - w / 2, y + 40, x + w / 2, y + 40, color);
  detailText(ctx, api, v, x, y + 10, 30, color);
}
export function detailNote(ctx, api, v) {
  return detailText(ctx, api, v, 960, 1005, 25, api.C.muted);
}
export function detailParagraph(ctx, api, lines, y = 350, color = api.C.blue, size = 30) {
  return lines.forEach((v, i) => detailText(ctx, api, v, 960, y + i * 49, size, color));
}
export function detailDigest(ctx, api, value, x, y, color = api.C.cyan) {
  detailText(ctx, api, value.slice(0, 32), x, y, 27, color);
  detailText(ctx, api, value.slice(32), x, y + 42, 27, color);
}
export function originalText(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return String(v).includes('_')
    ? api.math(ctx, '\\texttt{' + String(v).replaceAll('_', '\\_') + '}', x, y, z, color, align)
    : api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, v, x, y, w = 460, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
