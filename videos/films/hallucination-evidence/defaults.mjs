export function drawEstablishedEvidenceCompleted(ctx, api, id) {
  return api.focus.progress(id, 0) >= 1;
}
export function drawEstablishedEvidenceText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 29,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawEstablishedEvidenceEquation(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 42,
  color = C.yellow,
  align = 'center',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawEstablishedEvidenceCard(
  ctx,
  api,
  C,
  c,
  label,
  x,
  y,
  width,
  color = C.cyan,
  height = 88,
  opacity = 1,
  fontSize = 27,
) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fill: C.panel,
    stroke: color,
    textColor: color,
    opacity,
    fontSize,
    padding: 12,
  });
}
export function drawEstablishedEvidenceRouteLine(
  ctx,
  api,
  t,
  from,
  to,
  color,
  progress,
  fromAlpha = 1,
  toAlpha = 1,
) {
  return t.transfer({
    source: {
      shape: from,
      opacity: fromAlpha,
    },
    target: {
      shape: to,
      opacity: toAlpha,
    },
    color,
    width: 3,
    progress,
    gap: 24,
    margin: 4,
    particle: {
      radius: 7,
      fill: color,
    },
  });
}
export function drawEvidenceUpgradeVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function drawEvidenceUpgradeProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function drawEvidenceUpgradeText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 30,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, String(s).replaceAll('_', ' '), x, y, size, color, align);
}
export function drawEvidenceUpgradeEquation(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 40,
  color = C.yellow,
  align = 'center',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawEvidenceUpgradeBox(
  ctx,
  api,
  C,
  c,
  s,
  x,
  y,
  w,
  h = 90,
  color = C.cyan,
  size = 28,
) {
  return c.card({
    label: String(s).replaceAll('_', ' '),
    x,
    y,
    width: w,
    height: h,
    fill: C.panel,
    stroke: color,
    textColor: C.ink,
    fontSize: size,
    padding: 14,
  });
}
export function drawEvidenceUpgradeLine(ctx, api, C, x, y, x2, y2, color = C.muted, width = 2) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawEvidenceUpgradeTable(
  ctx,
  api,
  C,
  c,
  headers,
  rows,
  x,
  y,
  w,
  rh = 78,
  font = 26,
) {
  const cw = w / headers.length;
  [headers, ...rows].forEach((row, i) =>
    row.forEach((v, j) =>
      drawEvidenceUpgradeBox(
        ctx,
        api,
        C,
        c,
        String(v),
        x + j * cw,
        y + i * rh,
        cw,
        rh,
        i === 0 ? C.muted : (C.subtle ?? C.muted),
        font,
      ),
    ),
  );
}
export function drawEvidenceUpgradeFoot(ctx, api, C, s) {
  return drawEvidenceUpgradeText(ctx, api, C, s, 960, 1020, 25, C.muted, 'center');
}
