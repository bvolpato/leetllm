export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'center') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 42, color = api.C.ink, align = 'center') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function hasCue(ctx, api, id) {
  return Boolean(api.focus?.cue(id));
}
export function cueProgress(ctx, api, id, fallback = 0) {
  return hasCue(ctx, api, id) ? api.focus.progress(id, fallback) : fallback;
}
export function cueVisible(ctx, api, id, fallback = false) {
  return hasCue(ctx, api, id) ? api.focus.visible(id) : fallback;
}
export function cueReveal(ctx, api, id, fallback, paint) {
  return hasCue(ctx, api, id) ? api.focus.reveal(id, paint) : fallback ? paint() : undefined;
}
export function focus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  color = api.C.blue,
  width = 390,
  height = 78,
  opacity = 1,
  focusTarget,
  fontSize = 27,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 12,
    opacity,
    focusTarget,
  });
}
export function extensionText(ctx, api, v, x, y, size = 28, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  if (w > 0 && h > 0) api.rect(ctx, x, y, w, h, fill, color, 4);
}
export function line(ctx, api, x, y, xx, yy, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function box(ctx, api, label, x, y, w = 360, color = api.C.blue, size = 27, h = 74) {
  rectangle(ctx, api, x, y, w, h, color);
  extensionText(ctx, api, label, x + w / 2, y + h / 2 + size * 0.34, size, color);
}
export function caption(ctx, api, text) {
  return extensionText(ctx, api, text, 960, 972, 25, api.C.muted);
}
export function mini(ctx, api, label, x, y, color = api.C.blue) {
  rectangle(ctx, api, x, y, 120, 62, color);
  extensionText(ctx, api, label, x + 60, y + 41, 27, color);
}
export function table(
  ctx,
  api,
  headers,
  rows,
  x = 180,
  y = 360,
  width = 1560,
  rowHeight = 65,
  sizes = 26,
) {
  const cw = width / headers.length;
  headers.forEach((v, i) =>
    extensionText(ctx, api, v, x + (i + 0.5) * cw, y - 22, sizes, api.C.muted),
  );
  rows.forEach((row, r) =>
    row.forEach((v, i) => {
      rectangle(ctx, api, x + i * cw, y + r * rowHeight, cw, rowHeight, api.C.muted);
      extensionText(
        ctx,
        api,
        v,
        x + (i + 0.5) * cw,
        y + (r + 0.5) * rowHeight + sizes * 0.34,
        sizes,
        typeof v === 'string' && v.includes('missing') ? api.C.yellow : api.C.ink,
      );
    }),
  );
}
export function dot(ctx, api, x, y, color = api.C.cyan, r = 9) {
  return api.circle(ctx, x, y, r, color);
}
