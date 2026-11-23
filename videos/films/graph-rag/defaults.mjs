export function focusKey(ctx, api, v) {
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
export function focusTarget(ctx, api, sceneId, kind, v, draw) {
  return api.focus.target(sceneId + '-' + kind + '-' + focusKey(ctx, api, v), draw);
}
export function text(
  ctx,
  api,
  sceneId,
  v,
  x,
  y,
  z = 31,
  color = api.C.ink,
  align = 'left',
  mono = false,
) {
  return focusTarget(ctx, api, sceneId, 'text', v, () =>
    api.text(
      ctx,
      String(v),
      x,
      y,
      z,
      color,
      align,
      mono || String(v).includes('_') ? 'mono' : 'sans',
    ),
  );
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function panel(ctx, api, sceneId, x, y, w, h, color = api.C.muted, fill = api.C.panel) {
  return api.focus.target(sceneId + '-areas', () =>
    api.components.panel({
      x,
      y,
      width: w,
      height: h,
      fill,
      stroke: color,
      padding: 10,
    }),
  );
}
export function card(ctx, api, sceneId, v, x, y, w = 500, h = 75, color = api.C.cyan, z = 30) {
  return focusTarget(ctx, api, sceneId, 'card', v, () =>
    api.components.card({
      label: v,
      x,
      y,
      width: w,
      height: h,
      fill: api.C.panel,
      stroke: color,
      textColor: color,
      fontSize: z,
      font: String(v).includes('_') ? 'mono' : 'sans',
      baselineOffset: z * (0.34 - 0.7 * (String(v).split('\n').length - 1)),
      padding: 12,
    }),
  );
}
export function footer(ctx, api, sceneId, v) {
  return text(ctx, api, sceneId, v, 960, 1010, 25, api.C.muted, 'center');
}
export function focusProgress(ctx, api, sceneId, id, fallback = 0) {
  return api.focus.progress(sceneId + '-' + id, fallback);
}
export function cueStarted(ctx, api, sceneId, id, fallback = false) {
  return focusProgress(ctx, api, sceneId, id, fallback ? 1 : 0) > 0;
}
export function cueAmount(ctx, api, sceneId, id) {
  return focusProgress(ctx, api, sceneId, id, 0);
}
export function dot(ctx, api, sceneId, v, x, y, color = api.C.blue, r = 50) {
  return focusTarget(ctx, api, sceneId, 'node', v, () => {
    api.circle(ctx, x, y, r, api.C.panel, color, 3);
    text(ctx, api, sceneId, v, x, y + 11, 30, color, 'center');
  });
}
export function connector(ctx, api, x1, y1, x2, y2, q = 1, color = api.C.cyan) {
  if (q > 0) arrow(ctx, api, x1, y1, x1 + (x2 - x1) * q, y1 + (y2 - y1) * q, color);
}
export function paper(ctx, api, sceneId, id, lines, x, y, w = 720, color = api.C.blue) {
  return focusTarget(ctx, api, sceneId, 'paper', id, () => {
    panel(ctx, api, sceneId, x, y, w, 90 + lines.length * 48, color);
    text(ctx, api, sceneId, id, x + 24, y + 43, 29, color);
    line(ctx, api, x + 20, y + 62, x + w - 20, y + 62, color, 2);
    lines.forEach((v, i) => text(ctx, api, sceneId, v, x + 24, y + 111 + i * 48, 30, color));
  });
}
export function bookGraph(
  ctx,
  api,
  sceneId,
  { hops = [1, 1], publisher = 'Willow Press', bad = '', reverse = false, y = 530 } = {},
) {
  const xs = [300, 960, 1620],
    names = ['Lena', 'River Walk', publisher],
    types = ['Person', 'Book', 'Publisher'],
    colors = [api.C.blue, api.C.yellow, api.C.green];
  xs.forEach((x, i) => {
    dot(ctx, api, sceneId, names[i], x, y, colors[i], i === 2 ? 112 : 95);
    text(ctx, api, sceneId, types[i], x, y - 135, 29, colors[i], 'center');
  });
  connector(
    ctx,
    api,
    reverse ? 855 : 395,
    y,
    reverse ? 405 : 855,
    y,
    hops[0],
    bad ? api.C.pink : api.C.cyan,
  );
  connector(ctx, api, 1065, y, 1508, y, hops[1]);
  text(
    ctx,
    api,
    sceneId,
    bad || 'wrote [A]',
    630,
    y - 48,
    30,
    bad ? api.C.pink : api.C.cyan,
    'center',
  );
  text(ctx, api, sceneId, 'published by [B]', 1280, y - 48, 29, api.C.cyan, 'center');
}
