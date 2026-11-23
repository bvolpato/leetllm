export function drawLegacyText(ctx, api, v, x, y, size = 34, color = api.C.ink, align = 'center') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawLegacyCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  opacity = 1,
  height = 84,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 30,
    baselineOffset: 30 * (0.34 - 0.7 * (label.split('\n').length - 1)),
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    opacity,
  });
}
export function drawLegacyRoute(ctx, api, from, to, color, progress) {
  if (progress <= 0.25) return;
  api.components.fade(progress, () => {
    const line = api.connect(ctx, from, to, {
      color,
      width: 3,
      fromGap: 20,
      toGap: 20,
    });
    api.components.particle({
      points: [line.from, line.to],
      progress,
      fill: color,
      radius: 8,
    });
  });
}
export function drawTimelineSpan(
  ctx,
  api,
  y,
  start,
  end,
  color,
  clockScale = 3.0,
  origin = 330,
  progress = 1,
) {
  const x = origin + start * clockScale,
    width = (end - start) * clockScale * progress;
  api.rect(ctx, x, y, Math.max(1, width), 56, color, undefined, 12);
}
export function drawText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    /_\w/.test(String(v)) ? 'mono' : 'sans',
  );
}
export function drawBox(ctx, api, x, y, w, h, stroke = api.C.muted, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function drawLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawTag(ctx, api, text, x, y, w, color = api.C.cyan) {
  drawBox(ctx, api, x, y, w, 65, color);
  drawText(ctx, api, text, x + 16, y + 43, 26, color);
}
export function drawBracket(ctx, api, a, z, y, label, color = api.C.cyan) {
  drawLine(ctx, api, a, y, z, y, color);
  drawLine(ctx, api, a, y - 9, a, y + 9, color);
  drawLine(ctx, api, z, y - 9, z, y + 9, color);
  drawText(ctx, api, label, (a + z) / 2, y + 45, 27, color, 'center');
}
export function drawFooter(ctx, api, text, color = api.C.muted) {
  return drawText(ctx, api, text, 960, 965, 27, color, 'center');
}
export function drawSampleWave(ctx, api, x, y, w, color, scale = 1, phase = 0) {
  for (let k = 0; k < 70; k++) {
    const u = k / 69,
      v = (Math.sin(k * 0.75 + phase) + 0.45 * Math.sin(k * 1.8)) * scale;
    drawLine(ctx, api, x + u * w, y - v * 23, x + u * w, y + v * 23, color, 2);
  }
}
export function drawCell(ctx, api, text, x, y, w = 150, color = api.C.cyan) {
  drawBox(ctx, api, x, y, w, 64, color);
  drawText(ctx, api, text, x + w / 2, y + 43, 27, color, 'center');
}
