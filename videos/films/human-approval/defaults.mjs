export function approvalProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function contractText(ctx, api, v, x, y, n = 32, col = api.C.ink) {
  return api.text(ctx, v, x, y, n, col, 'center');
}
export function contractRectangle(ctx, api, x, y, w, h, col) {
  return api.rect(ctx, x, y, w, h, col);
}
export function contractLine(ctx, api, x, y, a, z, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, a, z, col, w);
}
export function contractArrow(ctx, api, x, y, a, z, col = api.C.cyan) {
  return api.arrow(ctx, x, y, a, z, col, 4);
}
export function contractTag(ctx, api, v, x, y, col = api.C.blue, w = 500) {
  contractRectangle(ctx, api, x - w / 2, y - 38, w, 76, api.C.panel);
  contractLine(ctx, api, x - w / 2, y + 39, x + w / 2, y + 39, col, 2);
  contractText(ctx, api, v, x, y + 11, 29, col);
}
export function contractNote(ctx, api, v) {
  return contractText(ctx, api, v, 960, 1005, 27, api.C.muted);
}
export function contractTraffic(ctx, api, x, y, percent, revision, col = api.C.cyan) {
  contractText(ctx, api, 'Live generation ' + revision, x, y - 140, 34, col);
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 - Math.PI / 2;
    api.circle(
      ctx,
      x + Math.cos(angle) * 100,
      y + Math.sin(angle) * 100,
      15,
      i < Math.round(percent / 5) ? api.C.cyan : api.C.blue,
    );
  }
  contractText(ctx, api, 'Target ' + percent + '% canary', x, y + 170, 34, api.C.cyan);
  contractText(ctx, api, 'Remainder ' + (100 - percent) + '%', x, y + 225, 29, api.C.blue);
}
export function text(ctx, api, text, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, text, x, y, size, color, align);
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
  height = 90,
  fontSize = 31,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    padding: 12,
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
