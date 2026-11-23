export function withFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawText(ctx, api, value, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawEquation(ctx, api, value, x, y, size = 41, color = api.C.ink, align = 'left') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawCard(
  ctx,
  api,
  stageId,
  label,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  fontSize = 30,
  opacity = 1,
) {
  return api.components.card({
    id: `${stageId}-${String(label).slice(0, 18)}-${x}-${y}`,
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    radius: 14,
    padding: 12,
    ...(label.includes('\n')
      ? {
          baselineOffset: -12,
        }
      : {}),
    fontSize,
    textColor: color,
    opacity,
  });
}
export function drawPolicyText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawPolicyEquation(
  ctx,
  api,
  s,
  x,
  y,
  size = 40,
  color = api.C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawLine(ctx, api, x, y, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, x2, y2, color, width);
}
export function drawRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke, radius = 6) {
  return api.rect(ctx, x, y, w, h, fill, stroke, radius);
}
export function drawPolicyCard(
  ctx,
  api,
  stageId,
  s,
  x,
  y,
  w = 240,
  h = 70,
  color = api.C.blue,
  fontSize = 29,
) {
  return api.components.card({
    id: `${stageId}-${x}-${y}`,
    label: s,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    fontSize,
    ...(s.includes('_')
      ? {
          font: 'mono',
        }
      : {}),
    textColor: color,
    padding: 10,
    radius: 9,
  });
}
export function drawCaption(ctx, api, s) {
  return drawPolicyText(ctx, api, s, 960, 975, 27, api.C.muted, 'center');
}
export function drawProbabilityBars(
  ctx,
  api,
  rowColors,
  values,
  labels,
  x,
  y,
  width = 950,
  max = 1,
  selected = values.map((_, i) => i),
  format = (n) => n.toFixed(3),
  growth = 1,
) {
  const plotX = x + 200,
    plotWidth = width - 345;
  values.forEach((value, i) => {
    const cy = y + i * 108,
      color = selected.includes(i) ? rowColors[i % 4] : api.C.muted;
    drawPolicyText(ctx, api, labels[i], x, cy + 27, 29, color);
    drawRectangle(ctx, api, plotX, cy, plotWidth, 39, api.C.panel);
    if (value > 0)
      drawRectangle(
        ctx,
        api,
        plotX,
        cy,
        plotWidth * Math.min(1, value / max) * growth,
        39,
        color,
        undefined,
        3,
      );
    drawPolicyText(
      ctx,
      api,
      growth === 1 ? format(value) : '…',
      plotX + plotWidth + 24,
      cy + 28,
      27,
      color,
    );
  });
  return {
    plotX,
    plotWidth,
  };
}
export function drawProbabilityStrip(
  ctx,
  api,
  stripColors,
  values,
  labels,
  x,
  y,
  width = 1440,
  marker = null,
) {
  let cumulative = 0;
  values.forEach((value, i) => {
    if (value > 0) {
      drawRectangle(
        ctx,
        api,
        x + cumulative * width,
        y,
        value * width,
        76,
        stripColors[i % 4],
        undefined,
        0,
      );
      if (value * width > 100)
        drawPolicyText(
          ctx,
          api,
          labels[i],
          x + (cumulative + value / 2) * width,
          y + 46,
          28,
          api.C.bg,
          'center',
        );
    }
    cumulative += value;
  });
  drawLine(ctx, api, x, y + 100, x + width, y + 100);
  drawPolicyText(ctx, api, '0', x, y + 141, 27, api.C.muted);
  drawPolicyText(ctx, api, '1', x + width, y + 141, 27, api.C.muted, 'right');
  if (marker !== null) {
    const mx = x + marker * width;
    drawLine(ctx, api, mx, y - 65, mx, y - 8, api.C.ink, 4);
    api.circle(ctx, mx, y - 68, 8, api.C.ink);
    drawPolicyText(ctx, api, `u = ${marker.toFixed(2)}`, mx, y - 88, 28, api.C.ink, 'center');
  }
}
