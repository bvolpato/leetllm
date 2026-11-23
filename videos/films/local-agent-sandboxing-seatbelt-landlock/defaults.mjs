export function text(ctx, api, v, x, y, z = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, v, x, y, z = 45) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width = 420, color = api.C.cyan, height = 95, z = 32) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 12,
  });
}
export function drawSandboxExpansionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawSandboxExpansionTarget(ctx, api, id, draw) {
  return api.focus.target(id, draw);
}
export function drawSandboxExpansionBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 360,
  h = 85,
  col = api.C.blue,
  size = 31,
) {
  const s = api.rect(ctx, x, y, w, h, api.C.panel, col, 9);
  drawSandboxExpansionText(ctx, api, v, x + w / 2, y + h / 2 + size * 0.33, size, col);
  return s;
}
export function drawSandboxExpansionTitle(ctx, api, v) {
  return drawSandboxExpansionText(ctx, api, v, 960, 285, 35, api.C.yellow);
}
export function drawSandboxExpansionFoot(ctx, api, v) {
  return drawSandboxExpansionText(ctx, api, v, 960, 1025, 27, api.C.muted);
}
export function drawSandboxExpansionRoute(
  ctx,
  api,
  id,
  source,
  destination,
  progress,
  color = api.C.cyan,
  obstacles = [],
) {
  return api.teaching.routedTransfer({
    id,
    source: {
      id: id + '-from',
      shape: source,
      opacity: 1,
    },
    target: {
      id: id + '-to',
      shape: destination,
      opacity: 1,
    },
    corridor: {
      x: 120,
      y: 320,
      width: 1680,
      height: 650,
    },
    obstacles,
    color,
    width: 3,
    margin: 3,
    progress,
    marker: {
      radius: 7,
      fill: color,
      stroke: api.C.bg,
      strokeWidth: 2,
    },
  });
}
