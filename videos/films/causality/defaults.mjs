export function optionalFocusTarget(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, v, x, y, z = 34, c = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, c, a);
}
export function equation(ctx, api, v, x, y, z = 48, c = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, c, a);
}
export function bars(
  ctx,
  api,
  values,
  labels,
  x = 250,
  width = 850,
  colors = [api.C.cyan, api.C.pink],
  amount = 1,
  max = 1,
) {
  return api.teaching.bars({
    x,
    y: 390,
    width,
    height: 370,
    values,
    labels,
    colors,
    max,
    progress: amount,
    showValues: true,
    format: (v) => `${(100 * v).toFixed(0)}%`,
    fontSize: 30,
  });
}
export function focusProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function detailText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, size, color, align, font);
}
export function code(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return detailText(ctx, api, v, x, y, size, color, align, 'mono');
}
export function label(ctx, api, v, x, y, color = api.C.ink, size = 32) {
  return detailText(ctx, api, v, x, y, size, color, 'center');
}
export function footer(ctx, api, v) {
  return label(ctx, api, v, 960, 1000, api.C.muted, 27);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, w);
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 3);
}
export function box(ctx, api, title, rows, x, y, w, h, color = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 12);
  detailText(ctx, api, title, x + 22, y + 42, 28, color);
  rows.forEach((v, i) => code(ctx, api, v, x + 22, y + 96 + i * 43, 29, api.C.ink));
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function node(ctx, api, id, label, x, y, color = api.C.blue, width = 350) {
  return {
    id,
    label,
    x,
    y,
    width,
    height: 105,
    color,
    fontSize: 29,
  };
}
export function dag(ctx, api, nodes, edges) {
  return api.teaching.flowGraph({
    nodes,
    edges,
    fill: api.C.panel,
    textColor: api.C.ink,
  });
}
export function cellGrid(ctx, api, rows, x, y, cols = 20, pitch = 26, size = 19) {
  return rows.forEach((t, i) =>
    api.rect(
      ctx,
      x + (i % cols) * pitch,
      y + Math.floor(i / cols) * pitch,
      size,
      size,
      t.resolved ? api.C.green : api.C.red,
      undefined,
      3,
    ),
  );
}
export function datum(ctx, api, value, x, y, earned, color = api.C.green, size = 44) {
  return label(ctx, api, earned ? value : '?', x, y, earned ? color : api.C.muted, size);
}
