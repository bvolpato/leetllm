export function label(
  api,
  ctx,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  api.text(ctx, String(value), x, y, size, color, align, font);
}
export function formula(api, ctx, tex, x, y, size = 44, color = api.C.ink, align = 'left') {
  api.math(ctx, tex, x, y, size, color, align);
}
export function line(api, ctx, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  api.line(ctx, x1, y1, x2, y2, color, width);
}
export function arrow(api, ctx, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return;
  api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function panel(api, ctx, x, y, w, h, stroke = api.C.muted, fill = api.C.panel, radius = 20) {
  const shape = api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill,
    stroke,
    radius,
  });
  return Object.assign(shape, {
    x,
    y,
    w,
    h,
    width: w,
    height: h,
    cx: x + w / 2,
    cy: y + h / 2,
  });
}
export function badge(api, ctx, value, x, y, color = api.C.cyan, size = 27) {
  label(api, ctx, value, x, y, size, color, 'center');
}
export function lines(api, ctx, rows, x, y, size = 32, color = api.C.ink) {
  rows.forEach((row, i) => label(api, ctx, row, x, y + i * size * 1.45, size, color, 'center'));
}
export function connect(api, ctx, from, to, color = api.C.cyan) {
  return api.connect(ctx, from, to, {
    color,
    width: 4,
    gap: 0,
  });
}
export function flow(api, ctx, from, to, progress, color = api.C.cyan, hollow = false) {
  const p = api.clamp(progress);
  if (p <= 0 || p >= 1) return;
  api.components.particle({
    points: [
      {
        x: from[0],
        y: from[1],
      },
      {
        x: to[0],
        y: to[1],
      },
    ],
    progress: p,
    radius: 8,
    fill: hollow ? 'transparent' : color,
    stroke: hollow ? color : undefined,
    strokeWidth: hollow ? 2 : undefined,
  });
}
export function tokenRow(
  api,
  ctx,
  values,
  x,
  y,
  color,
  width = 104,
  gap = 16,
  size = 26,
  progress = 1,
) {
  api.components.tokenRow({
    values,
    x,
    y,
    width,
    gap,
    height: 60,
    fill: color,
    radius: 10,
    padding: 8,
    scope: 'label',
    fontSize: size,
    font: 'mono',
    textColor: api.C.bg,
    baselineOffset: 9,
    reveal: progress,
  });
}
export function circleLabel(api, ctx, value, x, y, radius, fill, size = 27) {
  api.circle(ctx, x, y, radius, fill);
  label(api, ctx, value, x, y + size * 0.34, size, api.C.bg, 'center', 'mono');
}
export function nodeEdge(api, ctx, a, b, radius = 34, color = api.C.muted, progress = 1) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / length,
    dy = (b[1] - a[1]) / length;
  api.trace(
    ctx,
    [
      {
        x: a[0] + dx * radius,
        y: a[1] + dy * radius,
      },
      {
        x: b[0] - dx * radius,
        y: b[1] - dy * radius,
      },
    ],
    progress,
    color,
    3,
  );
}
export function graphAxes(api, ctx, x, y, w, h, xName, yName) {
  line(api, ctx, x, y + h, x + w, y + h);
  line(api, ctx, x, y, x, y + h);
  badge(api, ctx, xName, x + w / 2, y + h + 88, api.C.muted, 28);
  label(api, ctx, yName, x, y - 30, 27, api.C.muted);
}
export function drawRewardExpansionText(
  ctx,
  api,
  v,
  x,
  y,
  z = 31,
  col = api.C.ink,
  align = 'center',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, z, col, align, font);
}
export function drawRewardExpansionBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 400,
  h = 90,
  col = api.C.blue,
  z = 31,
) {
  const s = api.rect(ctx, x, y, w, h, api.C.panel, col, 8);
  drawRewardExpansionText(ctx, api, v, x + w / 2, y + h / 2 + z * 0.32, z, col);
  return s;
}
export function drawRewardExpansionL(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function drawRewardExpansionArrow(ctx, api, x1, y1, x2, y2, col = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, col, 3);
}
export function drawRewardExpansionTitle(ctx, api, v) {
  return drawRewardExpansionText(ctx, api, v, 960, 280, 34, api.C.yellow);
}
export function drawRewardExpansionFoot(ctx, api, v) {
  return drawRewardExpansionText(ctx, api, v, 960, 1025, 26, api.C.muted);
}
export function drawRewardExpansionDot(ctx, api, x, y, r, col) {
  return api.circle(ctx, x, y, r, col);
}
export function drawRewardExpansionBar(ctx, api, x, y, w, h, value, col) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 4);
  if (value > 0) api.rect(ctx, x + 3, y + 3, (w - 6) * api.clamp(value), h - 6, col, undefined, 2);
}
