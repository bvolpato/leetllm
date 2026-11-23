export function drawOriginalText(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 520,
  color = api.C.cyan,
  height = 110,
  fontSize = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawConstructionText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawConstructionBox(
  ctx,
  api,
  label,
  x,
  y,
  w = 500,
  h = 100,
  color = api.C.blue,
  font = 29,
) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: font,
    padding: 15,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawConstructionGrid(ctx, api, labels, x, y, w, h, color = api.C.blue, font = 29) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: font,
    padding: 12,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: color,
  });
}
export function drawConstructionHead(ctx, api, v) {
  return drawConstructionText(ctx, api, v, 960, 285, 36, api.C.yellow, 'center');
}
export function drawConstructionFoot(ctx, api, v) {
  return drawConstructionText(ctx, api, v, 960, 1010, 28, api.C.muted, 'center');
}
export function drawConstructionTransfer(ctx, api, a, z, q, color = api.C.cyan) {
  if (q > 0)
    api.teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      color,
      progress: q,
      particle: {
        radius: 8,
        fill: color,
      },
    });
}
