export function text(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'center') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    col,
    align,
    String(v).includes('_') ? 'mono' : undefined,
  );
}
export function panel(ctx, api, x, y, w, h, col = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    radius: 12,
  });
}
export function chip(ctx, api, v, x, y, w = 400, col = api.C.cyan, h = 70, size = 28) {
  panel(ctx, api, x, y, w, h, col);
  text(ctx, api, v, x + w / 2, y + h / 2 + 10, size, col);
}
export function line(ctx, api, x, y, a, z, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, a, z, col, w);
}
export function dot(ctx, api, x, y, col = api.C.cyan, r = 9) {
  return api.circle(ctx, x, y, r, col);
}
export function footer(ctx, api, v) {
  return text(ctx, api, v, 960, 940, 26, api.C.muted);
}
export function codePanel(ctx, api, title, lines, x, y, w, h, col = api.C.blue) {
  panel(ctx, api, x, y, w, h, col);
  text(ctx, api, title, x + 25, y + 42, 29, col, 'left');
  lines.forEach((v, i) => text(ctx, api, v, x + 25, y + 100 + i * 43, 25, api.C.ink, 'left'));
}

export function filmPainter(ctx, api) {
  return {
    label: text.bind(null, ctx, api),
    line: line.bind(null, ctx, api),
    dot: dot.bind(null, ctx, api),
    panel: panel.bind(null, ctx, api),
    chip: chip.bind(null, ctx, api),
    target: api.focus.target,
    started: (id) => (api.focus.cue(id)?.phase ?? 'before') !== 'before',
    finished: (id) => api.focus.cue(id)?.phase === 'after',
    progress: (id) => api.focus.progress(id, 0),
  };
}
