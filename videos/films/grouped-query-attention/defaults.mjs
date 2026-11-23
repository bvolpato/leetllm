export function text(ctx, api, value, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function equation(ctx, api, formula, x, y, size = 40, color = api.C.ink, align = 'center') {
  return api.math(ctx, formula, x, y, size, color, align);
}
export function card(
  ctx,
  api,
  sceneId,
  label,
  x,
  y,
  width,
  height = 78,
  color = api.C.cyan,
  opacity = 1,
  fontSize = 26,
) {
  return api.components.card({
    id: `${sceneId}-${String(label).slice(0, 16)}-${x}-${y}`,
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    radius: 14,
    padding: 10,
    fontSize,
    opacity,
  });
}
export function chapterText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function chapterEquation(ctx, api, v, x, y, size = 42, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function operation(ctx, api, sceneId, paint) {
  return api.focus.target(sceneId + '-operation', paint);
}
export function note(ctx, api, v, color = api.C.muted) {
  return chapterText(ctx, api, v, 960, 1000, 26, color);
}
export function bar(ctx, api, x, y, w, value, max, color, h = 62) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 1);
  if (value > 0) api.rect(ctx, x, y, (w * value) / max, h, color, color, 1);
}
export function grid(ctx, api, x, y, rows, cols, size, paint, label) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const color = paint(r, c);
      api.rect(ctx, x + c * size, y + r * size, size - 5, size - 5, color, api.C.muted, 1);
      if (label)
        chapterText(
          ctx,
          api,
          label(r, c),
          x + c * size + (size - 5) / 2,
          y + r * size + size * 0.65,
          26,
          api.C.ink,
        );
    }
}
export function matrix(ctx, api, values, x, y, color = api.C.blue) {
  return grid(
    ctx,
    api,
    x,
    y,
    values.length,
    values[0].length,
    84,
    () => api.C.panel,
    (r, c) => values[r][c],
  );
}
