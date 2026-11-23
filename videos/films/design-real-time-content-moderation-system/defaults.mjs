export function text(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, v, x, y, w = 560, color = api.C.cyan, h = 110, baselineOffset) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    ...(baselineOffset === undefined
      ? {}
      : {
          baselineOffset,
        }),
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function cueSeen(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id);
}
export function moderationText(
  ctx,
  api,
  value,
  x,
  y,
  size = 28,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(value), x, y, size, color, align, font);
}
export function moderationLine(ctx, api, x, y, xx, yy, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function moderationBox(
  ctx,
  api,
  value,
  x,
  y,
  w = 400,
  h = 76,
  color = api.C.blue,
  size = 27,
) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 0);
  moderationText(
    ctx,
    api,
    value,
    x + w / 2,
    y + h / 2 + 9,
    size,
    color,
    'center',
    String(value).includes('_') ? 'mono' : 'sans',
  );
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function moderationArrow(ctx, api, x, y, xx, yy, color = api.C.cyan, q = 1) {
  if (q > 0) api.arrow(ctx, x, y, x + (xx - x) * q, y + (yy - y) * q, color, 3);
}
export function moderationNote(ctx, api, value) {
  return moderationText(ctx, api, value, 960, 1015, 26, api.C.muted, 'center');
}
export function moderationBar(ctx, api, x, y, w, h, parts, total, colors) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 0);
  let at = x;
  parts.forEach((value, i) => {
    const width = (w * value) / total;
    if (width > 0) api.rect(ctx, at, y, width, h, colors[i], undefined, 0);
    at += width;
  });
}
