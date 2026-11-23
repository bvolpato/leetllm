export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function detailText(ctx, api, v, x, y, size = 32, color = api.C.ink) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    'center',
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function detailRectangle(ctx, api, x, y, w, h, color = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, color, stroke, 1);
}
export function detailLine(ctx, api, x, y, a, z, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, a, z, color, width);
}
export function progressArrow(ctx, api, x, y, a, z, color = api.C.cyan, p = 1) {
  return api.arrow(ctx, x, y, x + (a - x) * p, y + (z - y) * p, color, 3);
}
export function detailPanel(ctx, api, v, x, y, color = api.C.blue, w = 650) {
  detailRectangle(ctx, api, x - w / 2, y - 40, w, 80, api.C.panel);
  detailLine(ctx, api, x - w / 2, y + 40, x + w / 2, y + 40, color);
  detailText(ctx, api, v, x, y + 10, 30, color);
}
export function detailNote(ctx, api, v) {
  return detailText(ctx, api, v, 960, 1005, 25, api.C.muted);
}
export function unitGrid(ctx, api, n, total, x, y, w, color, cols = 10) {
  const gap = 8,
    cw = (w - (cols - 1) * gap) / cols;
  for (let i = 0; i < total; i++)
    detailRectangle(
      ctx,
      api,
      x + (i % cols) * (cw + gap),
      y + Math.floor(i / cols) * 34,
      cw,
      24,
      i < n ? color : api.C.panel,
      i < n ? undefined : api.C.muted,
    );
}
export function cueComplete(ctx, api, id) {
  return cueProgress(ctx, api, id) === 1;
}
export function text(ctx, api, s, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.yellow, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 92,
  opacity = 1,
  fontSize = 29,
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
    opacity,
    fontSize,
    padding: 12,
  });
}
export function route(ctx, api, from, to, color, progress, fromOpacity = 1, toOpacity = 1) {
  return api.teaching.transfer({
    source: {
      shape: from,
      opacity: fromOpacity,
    },
    target: {
      shape: to,
      opacity: toOpacity,
    },
    color,
    width: 3,
    progress,
    gap: 24,
    margin: 4,
    particle: {
      radius: 7,
      fill: color,
    },
  });
}
