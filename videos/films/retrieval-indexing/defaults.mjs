import { CREDENTIAL_ROWS } from './fixtures.mjs';
export function drawVisualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawOriginalText(
  ctx,
  api,
  value,
  x,
  y,
  size = 31,
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
  size = 42,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawOriginalCard(
  ctx,
  api,
  stageId,
  label,
  x,
  y,
  width,
  height = 82,
  color = api.C.cyan,
  opacity = 1,
  fontSize = 29,
) {
  return api.components.card({
    id: `${stageId}-${String(label).slice(0, 16)}-${x}-${y}`,
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    radius: 14,
    padding: 12,
    fontSize,
    opacity,
  });
}
export function drawExtensionText(
  ctx,
  api,
  value,
  x,
  y,
  size = 29,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(
    ctx,
    String(value),
    x,
    y,
    size,
    color,
    align,
    String(value).includes('_') ? 'mono' : 'sans',
  );
}
export function drawExtensionEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 39,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawExtensionLine(ctx, api, x, y, xx, yy, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function drawExtensionArrow(ctx, api, x, y, xx, yy, color = api.C.cyan, progress = 1) {
  if (progress > 0)
    api.arrow(ctx, x, y, x + (xx - x) * progress, y + (yy - y) * progress, color, 3);
}
export function drawExtensionBox(
  ctx,
  api,
  label,
  x,
  y,
  w = 520,
  h = 80,
  color = api.C.blue,
  size = 28,
) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 0);
  drawExtensionText(ctx, api, label, x + w / 2, y + h / 2 + 10, size, color, 'center');
}
export function drawExtensionNote(ctx, api, value) {
  return drawExtensionText(ctx, api, value, 960, 1020, 24, api.C.muted, 'center');
}
export function drawExtensionBar(ctx, api, x, y, w, h, value, max, color) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 0);
  if (value > 0) api.rect(ctx, x, y, (w * value) / max, h, color, undefined, 0);
}
export function drawCredentialDocs(ctx, api, x = 160, y = 370, w = 1600) {
  return CREDENTIAL_ROWS.forEach((r, i) => {
    drawExtensionBox(
      ctx,
      api,
      r.id,
      x,
      y + i * 130,
      100,
      76,
      r.relevant ? api.C.green : api.C.blue,
      31,
    );
    drawExtensionText(
      ctx,
      api,
      r.text,
      x + 140,
      y + i * 130 + 46,
      29,
      r.relevant ? api.C.green : api.C.ink,
    );
  });
}
