export function drawRetrievalMechanismText(ctx, api, s, x, y, n = 32, c = api.C.ink) {
  return api.text(ctx, s, x, y, n, c, 'center');
}
export function drawRetrievalMechanismEquation(ctx, api, s, x, y, n = 40, c = api.C.cyan) {
  return api.math(ctx, s, x, y, n, c, 'center');
}
export function drawRetrievalMechanismF(ctx, api, id, draw) {
  return api.focus.target(id, draw);
}
export function drawRetrievalMechanismP(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function drawRetrievalMechanismNote(ctx, api, s) {
  return drawRetrievalMechanismText(ctx, api, s, 960, 1005, 28, api.C.muted);
}
export function drawRetrievalMechanismTag(ctx, api, s, x, y, c = api.C.blue, w = 330) {
  api.rect(ctx, x - w / 2, y - 32, w, 64, api.C.panel);
  api.line(ctx, x - w / 2, y + 34, x + w / 2, y + 34, c, 2);
  drawRetrievalMechanismText(ctx, api, s, x, y + 10, 29, c);
}
export function drawRetrievalMechanismLine(ctx, api, x1, y1, x2, y2, c = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, c, w);
}
export function drawRetrievalMechanismArrow(ctx, api, x1, y1, x2, y2, c = api.C.cyan, w = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, c, w);
}
export function drawRetrievalMechanismStrip(ctx, api, x, y, count, active, c, cell = 26) {
  for (let i = 0; i < count; i++)
    api.rect(ctx, x + i * (cell + 5), y, cell, cell, i < active ? c : api.C.panel);
}
export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width = 310, color = api.C.cyan, height = 84) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    padding: 12,
  });
}
export function particleGap(ctx, api, shape, toward) {
  const center = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    },
    dx = toward.x + toward.width / 2 - center.x,
    dy = toward.y + toward.height / 2 - center.y;
  const length = Math.hypot(dx, dy),
    edge = api.anchor(shape, toward);
  // Clear the full particle radius and a four-pixel margin normal to every card edge.
  const outside =
    Math.min(
      dx === 0 ? Infinity : (shape.width / 2 + 12) / Math.abs(dx),
      dy === 0 ? Infinity : (shape.height / 2 + 12) / Math.abs(dy),
    ) * length;
  return outside - Math.hypot(edge.x - center.x, edge.y - center.y);
}
export function footer(ctx, api, s) {
  return text(ctx, api, s, 960, 945, 28, api.C.muted, 'center');
}
export function drawLibraryIntroductionText(
  ctx,
  api,
  s,
  x,
  y,
  n = 30,
  c = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, n, c, align);
}
export function drawLibraryIntroductionTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawCoordinateContractText(
  ctx,
  api,
  s,
  x,
  y,
  n = 30,
  c = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, s, x, y, n, c, align);
}
export function drawCoordinateContractRow(ctx, api, v, x, y, w, c) {
  v.forEach((z, i) => {
    api.rect(ctx, x + (i * w) / v.length, y, w / v.length - 8, 70, api.C.panel, c, 2, 6);
    drawCoordinateContractText(
      ctx,
      api,
      typeof z === 'number' ? (Math.abs(z) < 0.0005 ? 0 : z).toFixed(3) : z,
      x + ((i + 0.5) * w) / v.length - 4,
      y + 46,
      30,
      c,
    );
  });
}
