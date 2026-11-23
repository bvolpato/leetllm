export function drawSandboxText(
  ctx,
  api,
  themeColors,
  s,
  x,
  y,
  size = 30,
  color = themeColors.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawSandboxCard(
  ctx,
  api,
  themeColors,
  c,
  label,
  x,
  y,
  width,
  color = themeColors.cyan,
  height = 110,
  fontSize = 27,
) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fill: themeColors.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 12,
  });
}
export function drawSandboxTransfer(
  ctx,
  api,
  themeColors,
  routeProgress,
  t,
  from,
  to,
  color = themeColors.cyan,
  progress = routeProgress,
  opacity = 1,
) {
  return t.transfer({
    source: {
      shape: from,
      opacity,
    },
    target: {
      shape: to,
      opacity,
    },
    color,
    progress,
    width: 3,
    gap: 14,
    margin: 2,
    particle: {
      radius: 6,
      fill: color,
    },
  });
}
export function drawSandboxFooter(ctx, api, themeColors, s) {
  return drawSandboxText(ctx, api, themeColors, s, 960, 956, 25, themeColors.muted, 'center');
}
export function sandboxResultCompleted(ctx, api, id) {
  return api.focus.progress(id, 0) >= 1;
}
export function drawSandboxUpgradeText(
  ctx,
  api,
  themeColors,
  v,
  x,
  y,
  z = 30,
  color = themeColors.ink,
  align = 'left',
  mono = false,
) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    z,
    color,
    align,
    mono || String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawSandboxUpgradePanel(
  ctx,
  api,
  themeColors,
  c,
  x,
  y,
  w,
  h,
  col = themeColors.muted,
  fill = themeColors.panel,
) {
  return w > 0 && h > 0
    ? c.panel({
        x,
        y,
        width: w,
        height: h,
        fill,
        stroke: col,
        padding: 12,
      })
    : null;
}
export function drawSandboxUpgradeCard(
  ctx,
  api,
  themeColors,
  c,
  v,
  x,
  y,
  w = 600,
  h = 90,
  col = themeColors.blue,
  z = 29,
) {
  return c.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fill: themeColors.panel,
    stroke: col,
    textColor: col,
    fontSize: z,
    font: String(v).includes('_') ? 'mono' : 'sans',
    baselineOffset: z * (0.34 - 0.7 * (String(v).split('\n').length - 1)),
    padding: 14,
  });
}
export function drawSandboxUpgradeArrow(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  col = themeColors.cyan,
  routeProgress = 1,
) {
  if (routeProgress > 0)
    api.arrow(ctx, x1, y1, x1 + (x2 - x1) * routeProgress, y1 + (y2 - y1) * routeProgress, col, 4);
}
export function drawSandboxUpgradeLine(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  col = themeColors.muted,
  w = 3,
) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function sandboxCueProgress(ctx, api, id, n) {
  return api.focus.progress(id + '-' + n, 0);
}
export function drawSandboxUpgradeFooter(ctx, api, themeColors, v) {
  return drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    v,
    960,
    1025,
    25,
    themeColors.muted,
    'center',
  );
}
export function drawSandboxArtifactHeader(ctx, api, themeColors) {
  return drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Parser P2 · classroom artifact M · immutable worker-A/g7',
    960,
    255,
    28,
    themeColors.muted,
    'center',
  );
}
export function drawSandboxCodePanel(
  ctx,
  api,
  themeColors,
  c,
  title,
  rows,
  x,
  y,
  w = 740,
  col = themeColors.blue,
) {
  drawSandboxUpgradePanel(ctx, api, themeColors, c, x, y, w, 100 + rows.length * 48, col);
  drawSandboxUpgradeText(ctx, api, themeColors, title, x + 22, y + 43, 31, col);
  drawSandboxUpgradeLine(ctx, api, themeColors, x + 20, y + 62, x + w - 20, y + 62, col, 2);
  rows.forEach((v, i) =>
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      v,
      x + 24,
      y + 110 + i * 48,
      28,
      col,
      'left',
      String(v).includes('<'),
    ),
  );
}
export function drawSandboxStage(ctx, scene, state, api, paintUpgrade, paintLegacy) {
  return api.focus.target(scene.id + '-mechanism', () => {
    const handled = (() => {
      const { C, components: c } = api,
        b = state.beat ?? 0,
        p = state.beatP ?? 0,
        id = scene.id;
      if (id === 'evaluate-two-axes' && b < 3) return false;
      const on = (n) => sandboxCueProgress(ctx, api, id, n) > 0,
        done = (n) => sandboxCueProgress(ctx, api, id, n) >= 1;
      paintUpgrade(ctx, scene, state, api, C, c, b, p, id, on, done);
      return true;
    })();
    if (handled) return;
    const { C, components: c, phase, teaching: t } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0,
      q = phase(p, 0.05, 0.9);
    return paintLegacy(ctx, scene, state, api, C, c, phase, t, beat, p, q);
  });
}
export function paintUnknownSandboxLegacy(ctx, scene) {
  throw new Error(`Unknown sandbox-execution scene: ${scene.id}`);
}
