export function text(ctx, api, text, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function equation(ctx, api, text, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, text, x, y, size, color, 'center');
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 78,
  fontSize = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    padding: 10,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
export function link(ctx, api, from, to, progress, color = api.C.cyan) {
  return api.components.fade(progress, () => {
    const route = api.connect(ctx, from, to, {
      color,
      width: 3,
      fromGap: 20,
      toGap: 20,
    });
    api.components.particle({
      points: [route.from, route.to],
      progress,
      fill: color,
      radius: 7,
    });
  });
}
export function row(ctx, api, values, y, progress = 1, color = api.C.cyan) {
  return values.map((value, index) =>
    card(
      ctx,
      api,
      String(value),
      240 + index * (1440 / values.length),
      y,
      1440 / values.length - 24,
      color,
      progress,
      76,
      33,
    ),
  );
}
export function drawExtendedText(ctx, api, v, x, y, z = 31, col = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, z, col, align);
}
export function drawExtendedTarget(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawExtendedBox(
  ctx,
  api,
  value,
  x,
  y,
  w = 130,
  h = 74,
  col = api.C.blue,
  size = 32,
) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 8);
  drawExtendedText(ctx, api, value, x + w / 2, y + h / 2 + size * 0.32, size, col);
  return {
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
  };
}
export function drawExtendedRow(
  ctx,
  api,
  values,
  y,
  { x = 290, step = 170, w = 138, col = api.C.blue, indices = false, h = 74, size = 32 } = {},
) {
  return values.map((v, i) => {
    if (indices) drawExtendedText(ctx, api, i, x + i * step + w / 2, y - 20, 22, api.C.muted);
    return drawExtendedBox(
      ctx,
      api,
      v,
      x + i * step,
      y,
      w,
      h,
      typeof col === 'function' ? col(i) : col,
      size,
    );
  });
}
export function drawExtendedLine(ctx, api, x1, y1, x2, y2, col = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, width);
}
export function drawExtendedArrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, col, 3);
}
export function drawExtendedBar(ctx, api, v, max, x, y, w, h, col) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 3);
  if (v > 0) api.rect(ctx, x, y, (w * v) / max, h, col, undefined, 3);
}
export function drawExtendedTitle(ctx, api, text) {
  return drawExtendedText(ctx, api, text, 960, 285, 35, api.C.yellow);
}
export function drawExtendedFooter(ctx, api, text) {
  return drawExtendedText(ctx, api, text, 960, 1028, 27, api.C.muted);
}
