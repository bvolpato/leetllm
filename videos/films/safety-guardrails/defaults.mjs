export function drawSafetyText(
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
export function drawSafetyCard(
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
export function drawSafetyTransfer(
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
    gap: 16,
    margin: 2,
    particle: {
      radius: 6,
      fill: color,
    },
  });
}
export function drawSafetyFooter(ctx, api, themeColors, s) {
  return drawSafetyText(ctx, api, themeColors, s, 960, 956, 25, themeColors.muted, 'center');
}
export function drawGuardMechanismText(
  ctx,
  api,
  themeColors,
  s,
  x,
  y,
  size = 30,
  color = themeColors.ink,
  align = 'left',
  mono = false,
) {
  return api.text(
    ctx,
    String(s),
    x,
    y,
    size,
    color,
    align,
    mono || String(s).includes('_') ? 'mono' : 'sans',
  );
}
export function withGuardMechanismFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawGuardMechanismRect(
  ctx,
  api,
  themeColors,
  x,
  y,
  w,
  h,
  color = themeColors.muted,
  fill = themeColors.panel,
) {
  return api.rect(ctx, x, y, w, h, fill, color, 3);
}
export function drawGuardMechanismLine(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  color = themeColors.muted,
  width = 3,
) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawGuardMechanismArrow(
  ctx,
  api,
  themeColors,
  x1,
  y1,
  x2,
  y2,
  color = themeColors.cyan,
) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 3);
}
export function drawGuardMechanismLines(
  ctx,
  api,
  themeColors,
  values,
  x,
  y,
  size = 29,
  color = themeColors.ink,
  step = 51,
  mono = false,
) {
  return values.forEach((s, i) =>
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      s,
      x,
      y + i * step,
      size,
      typeof color === 'function' ? color(i) : color,
      'left',
      mono,
    ),
  );
}
export function drawGuardMechanismNote(ctx, api, themeColors, s) {
  return drawGuardMechanismText(
    ctx,
    api,
    themeColors,
    s,
    960,
    990,
    27,
    themeColors.muted,
    'center',
  );
}
export function drawGuardMechanismLabel(
  ctx,
  api,
  themeColors,
  id,
  s,
  x,
  y,
  size = 32,
  color = themeColors.ink,
  align = 'left',
) {
  return withGuardMechanismFocus(ctx, api, id, () =>
    drawGuardMechanismText(ctx, api, themeColors, s, x, y, size, color, align),
  );
}
export function drawGuardMechanismBlock(
  ctx,
  api,
  themeColors,
  id,
  title,
  values,
  x,
  y,
  w,
  h,
  color = themeColors.cyan,
  size = 29,
) {
  return withGuardMechanismFocus(ctx, api, id, () => {
    drawGuardMechanismRect(ctx, api, themeColors, x, y, w, h, color);
    drawGuardMechanismText(ctx, api, themeColors, title, x + 24, y + 43, 27, color);
    drawGuardMechanismLines(
      ctx,
      api,
      themeColors,
      values,
      x + 24,
      y + 105,
      size,
      themeColors.ink,
      53,
    );
    return {
      x,
      y,
      width: w,
      height: h,
    };
  });
}
export function drawGuardMechanismCell(
  ctx,
  api,
  themeColors,
  s,
  x,
  y,
  w = 70,
  h = 70,
  color = themeColors.cyan,
) {
  drawGuardMechanismRect(ctx, api, themeColors, x, y, w, h, color);
  drawGuardMechanismText(
    ctx,
    api,
    themeColors,
    s,
    x + w / 2,
    y + h / 2 + 10,
    27,
    color,
    'center',
    true,
  );
}
export function drawGuardMechanismStatus(
  ctx,
  api,
  themeColors,
  id,
  s,
  x,
  y,
  w = 700,
  color = themeColors.yellow,
) {
  return withGuardMechanismFocus(ctx, api, id, () => {
    drawGuardMechanismRect(ctx, api, themeColors, x, y, w, 88, color);
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      s,
      x + w / 2,
      y + 56,
      32,
      color,
      'center',
      String(s).includes('_'),
    );
  });
}
export function drawBoundaryOverviewText(
  ctx,
  api,
  themeColors,
  s,
  x,
  y,
  size = 31,
  color = themeColors.ink,
  align = 'left',
  mono = false,
) {
  return api.text(ctx, String(s), x, y, size, color, align, mono ? 'mono' : 'sans');
}
export function withBoundaryOverviewFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawBoundaryOverviewRect(ctx, api, themeColors, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, themeColors.panel, color, 3);
}
