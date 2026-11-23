export function retainedDrawText(
  ctx,
  api,
  value,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function retainedDrawCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 380,
  color = api.C.cyan,
  height = 95,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 29,
    padding: 14,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function retainedDrawEquation(ctx, api, value) {
  return api.math(ctx, value, 960, 900, 43, api.C.yellow, 'center');
}
export function cue(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function text(ctx, api, s, x, y, n = 31, col = api.C.ink, align = 'left') {
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
export function head(ctx, api, s) {
  return text(ctx, api, s, 960, 270, 34, api.C.blue, 'center');
}
export function foot(ctx, api, s) {
  return text(ctx, api, s, 960, 1030, 28, api.C.yellow, 'center');
}
export function box(ctx, api, s, x, y, w = 650, col = api.C.blue, h = 105) {
  const v = rectangle(ctx, api, x, y, w, h, col);
  text(ctx, api, s, x + w / 2, y + h * 0.64, 29, col, 'center');
  return v;
}
export function numberLine(ctx, api, lo, hi, y = 570) {
  const x = (v) => 220 + ((v - lo) / (hi - lo)) * 1480;
  L(ctx, api, 220, y, 1700, y, api.C.muted, 3);
  return x;
}
export function costBars(
  ctx,
  api,
  { x, y, width, height, values, labels, max, colors, format = String },
) {
  const step = width / values.length,
    bw = step * 0.52,
    base = y + height - 65,
    plotHeight = height - 105;
  L(ctx, api, x, base, x + width, base, api.C.muted, 2);
  [0, max].forEach((v) =>
    text(ctx, api, format(v), x - 20, base - (v / max) * plotHeight + 8, 23, api.C.muted, 'right'),
  );
  values.forEach((v, i) => {
    const cx = x + (i + 0.5) * step,
      col = colors[i];
    if (v === null) text(ctx, api, 'pending', cx, base - 28, 27, api.C.muted, 'center');
    else {
      const h = (v / max) * plotHeight;
      if (h > 0) rectangle(ctx, api, cx - bw / 2, base - h, bw, h, col, col);
      text(ctx, api, format(v), cx, base - h - 18, 29, col, 'center');
    }
    text(ctx, api, labels[i], cx, base + 44, 25, col, 'center');
  });
}
