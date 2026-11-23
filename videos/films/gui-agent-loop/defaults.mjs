export function retainedDrawText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function retainedDrawCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 110,
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
  });
}
export function retainedDrawFoot(ctx, api, s) {
  return retainedDrawText(ctx, api, s, 960, 956, 25, api.C.muted, 'center');
}
export function cueProgress(ctx, api, id, f) {
  return api.focus.progress(id, f);
}
export function text(ctx, api, v, x, y, size = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, col, align);
}
export function rectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 8);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function readoutCell(ctx, api, v, x, y, w = 650, col = api.C.blue, h = 110) {
  rectangle(ctx, api, x, y, w, h, col);
  text(ctx, api, v, x + w / 2, y + h * 0.64, 30, col, 'center');
}
export function taskHeader(ctx, api) {
  return text(
    ctx,
    api,
    'RUN-78432 · restricted CI inspection · local draft only',
    960,
    275,
    34,
    api.C.blue,
    'center',
  );
}
export function portalPanel(ctx, api, x = 180, y = 390, w = 750, version = 8, tabs = 1) {
  rectangle(ctx, api, x, y, w, 440, api.C.blue);
  text(ctx, api, 'CI PORTAL · session9 / frame' + version, x + 25, y + 55, 28, api.C.blue);
  line(ctx, api, x + 20, y + 80, x + w - 20, y + 80, api.C.muted);
  for (let i = 0; i < tabs; i++) {
    readoutCell(ctx, api, 'Failed tests', x + 35 + i * 285, y + 125, 250, api.C.yellow, 75);
  }
  readoutCell(ctx, api, "KeyError: 'status'", x + 35, y + 250, w - 70, api.C.pink, 100);
  text(ctx, api, 'RUN-78432 · report parser', x + w / 2, y + 405, 27, api.C.muted, 'center');
}
