export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function legacyText(ctx, api, value, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function legacyCard(
  ctx,
  api,
  sceneId,
  label,
  x,
  y,
  width,
  height = 76,
  color = api.C.cyan,
  opacity = 1,
  fontSize = 26,
) {
  return api.components.card({
    id: `${sceneId}-${String(label).slice(0, 14)}-${x}-${y}`,
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
export function coreCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function coreCueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function coreText(ctx, api, s, x, y, size = 30, color = api.C.ink) {
  return api.text(ctx, String(s), x, y, size, color, 'center');
}
export function coreRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.line) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function coreLine(ctx, api, x, y, u, v, color = api.C.line, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function coreEquation(ctx, api, s, x, y, size = 40, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function coreBox(ctx, api, s, x, y, w = 620, h = 100, color = api.C.cyan) {
  coreRectangle(ctx, api, x, y, w, h, api.C.panel, color);
  String(s)
    .split('\n')
    .forEach((v, i, a) =>
      coreText(ctx, api, v, x + w / 2, y + h / 2 + (i - (a.length - 1) / 2) * 38 + 10, 29, color),
    );
}
export function chapterCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function chapterCueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function chapterCueComplete(ctx, api, id) {
  return chapterCueProgress(ctx, api, id) === 1;
}
export function chapterText(ctx, api, s, x, y, size = 30, color = api.C.ink) {
  return api.text(ctx, String(s), x, y, size, color, 'center');
}
export function chapterRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.line) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function chapterLine(ctx, api, x, y, u, v, color = api.C.line, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function chapterEquation(ctx, api, s, x, y, size = 40, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function chapterBox(ctx, api, s, x, y, w = 640, h = 105, color = api.C.cyan) {
  chapterRectangle(ctx, api, x, y, w, h, api.C.panel, color);
  String(s)
    .split('\n')
    .forEach((v, i, a) =>
      chapterText(
        ctx,
        api,
        v,
        x + w / 2,
        y + h / 2 + (i - (a.length - 1) / 2) * 38 + 10,
        29,
        color,
      ),
    );
}
export function chapterFooter(ctx, api, s) {
  return chapterText(ctx, api, s, 960, 1015, 27, api.C.muted);
}
export function chapterMatrix(ctx, api, rows, x, y, dx = 140, dy = 80, col = api.C.cyan) {
  return rows.forEach((r, i) =>
    r.forEach((v, j) => {
      chapterRectangle(ctx, api, x + j * dx, y + i * dy, dx - 12, dy - 12, api.C.panel, api.C.line);
      chapterText(
        ctx,
        api,
        v,
        x + j * dx + (dx - 12) / 2,
        y + i * dy + (dy - 12) / 2 + 10,
        29,
        col,
      );
    }),
  );
}
