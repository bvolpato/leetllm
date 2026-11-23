export function drawOriginalText(
  ctx,
  api,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawOriginalEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 48,
  color = api.C.yellow,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height,
  color = api.C.cyan,
  fontSize = 30,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    padding: 13,
  });
}
export function drawExtendedText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawExtendedEquation(ctx, api, v, x, y, size = 39, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtendedCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 450,
  height = 100,
  color = api.C.blue,
  fontSize = 28,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    font: label.includes('_') ? 'mono' : undefined,
    padding: 12,
  });
}
export function drawExtendedRow(ctx, api, label, values, y, color = api.C.cyan) {
  drawExtendedText(ctx, api, label, 150, y + 47, 28, color);
  return api.teaching.grid({
    x: 590,
    y,
    width: 1130,
    height: 83,
    rows: 1,
    columns: values.length,
    labels: [values.map(String)],
    fontSize: 31,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: color,
  });
}
export function drawExtendedTransfer(ctx, api, a, z, progress, color = api.C.yellow) {
  return api.teaching.transfer({
    source: {
      shape: a,
      opacity: 1,
    },
    target: {
      shape: z,
      opacity: 1,
    },
    progress,
    color,
    particle: {
      radius: 8,
      fill: color,
    },
    margin: 12,
  });
}
export function drawExtendedNote(ctx, api, v, color = api.C.muted) {
  return drawExtendedText(ctx, api, v, 960, 1010, 26, color, 'center');
}
