export function text(ctx, api, C, v, x, y, size = 30, color = C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function card(ctx, api, C, c, label, x, y, width, color = C.cyan, height = 90) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 14,
    baselineOffset: label.includes('\n') ? -15 : 0,
    fill: C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawGpuUpgradeText(
  ctx,
  api,
  upgradeColors,
  s,
  x,
  y,
  z = 31,
  col = upgradeColors.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, z, col, align);
}
export function drawGpuUpgradeL(
  ctx,
  api,
  upgradeColors,
  x,
  y,
  u,
  v,
  col = upgradeColors.muted,
  w = 3,
) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function drawGpuUpgradeArrow(ctx, api, upgradeColors, x, y, u, v, col = upgradeColors.cyan) {
  return api.arrow(ctx, x, y, u, v, col, 4);
}
export function drawGpuUpgradeBox(
  ctx,
  api,
  upgradeColors,
  upgradeComponents,
  label,
  x,
  y,
  w = 320,
  h = 90,
  col = upgradeColors.blue,
  z = 28,
) {
  return upgradeComponents.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: z,
    fill: upgradeColors.panel,
    stroke: col,
    textColor: col,
    baselineOffset: z * 0.34 - (String(label).split('\n').length - 1) * z * 0.7,
  });
}
export function drawGpuUpgradeHead(ctx, api, upgradeColors, s) {
  return drawGpuUpgradeText(
    ctx,
    api,
    upgradeColors,
    s,
    960,
    275,
    32,
    upgradeColors.yellow,
    'center',
  );
}
export function drawGpuUpgradeFoot(ctx, api, upgradeColors, s) {
  return drawGpuUpgradeText(
    ctx,
    api,
    upgradeColors,
    s,
    960,
    1015,
    26,
    upgradeColors.muted,
    'center',
  );
}
export function drawGpuRetainedText(ctx, api, C, s, x, y, z = 30, col = C.ink, a = 'left') {
  return api.text(ctx, s, x, y, z, col, a);
}
export function drawGpuRetainedCard(ctx, api, C, c, label, x, y, w, h, col = C.cyan, z = 29) {
  return c.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: z,
    fill: C.panel,
    stroke: col,
    textColor: col,
    baselineOffset: z * 0.34 - (String(label).split('\n').length - 1) * z * 0.7,
  });
}
export function drawGpuRetainedFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
