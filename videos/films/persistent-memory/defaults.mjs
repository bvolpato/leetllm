export function retainedText(ctx, api, s, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function retainedCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 400,
  color = api.C.cyan,
  height = 102,
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
    fontSize,
    padding: 12,
  });
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function text(ctx, api, s, x, y, size = 31, col = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, col, align);
}
export function rectangle(ctx, api, x, y, w, h, col = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, col, 6);
}
export function line(ctx, api, x, y, u, v, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function documentCard(ctx, api, x, y, w, title, rows, col = api.C.blue) {
  const shape = rectangle(ctx, api, x, y, w, 90 + rows.length * 66, col);
  text(ctx, api, title, x + 25, y + 48, 30, col);
  line(ctx, api, x + 20, y + 72, x + w - 20, y + 72, col, 2);
  rows.forEach((s, i) =>
    text(ctx, api, s, x + 25, y + 119 + i * 66, 27, i === rows.length - 1 ? col : api.C.ink),
  );
  return shape;
}
export function transfer(ctx, api, from, to, col, progress) {
  return api.teaching.transfer({
    source: {
      shape: from,
      opacity: 1,
    },
    target: {
      shape: to,
      opacity: 1,
    },
    progress,
    color: col,
    particle: {
      radius: 7,
      fill: col,
    },
    gap: 20,
  });
}
export function footer(ctx, api, s) {
  return text(ctx, api, s, 960, 1030, 29, api.C.yellow, 'center');
}
export function header(ctx, api, s) {
  return text(ctx, api, s, 960, 265, 34, api.C.blue, 'center');
}
