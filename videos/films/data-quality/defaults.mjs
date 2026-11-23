import { fixtureNormalize } from './model.mjs';
import { lessonFont } from '../../lib/fonts.mjs';
export function drawOriginalVisualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawOriginalText(
  ctx,
  api,
  value,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, value, x, y, size, color, align);
}
export function drawOriginalEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 46,
  color = api.C.ink,
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
  color = api.C.blue,
  width = 360,
  height = 88,
  opacity = 1,
  fontSize = 32,
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
    padding: 12,
    opacity,
  });
}
export function drawConstructionP(ctx, api, id) {
  return api.focus.progress(id);
}
export function drawConstructionSeen(ctx, api, id) {
  return api.focus.visible(id);
}
export function drawConstructionText(
  ctx,
  api,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  mono = false,
) {
  return api.text(ctx, String(value), x, y, size, color, align, mono ? 'mono' : 'sans');
}
export function drawConstructionMeasure(ctx, api, value, size = 30) {
  ctx.save();
  ctx.font = lessonFont(size, 'sans');
  const width = ctx.measureText(value).width;
  ctx.restore();
  return width;
}
export function drawConstructionEquation(ctx, api, value, x, y, size = 48, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function drawConstructionLine(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function drawConstructionNote(ctx, api, value) {
  return drawConstructionText(ctx, api, value, 960, 1000, 27, api.C.muted, 'center');
}
export function drawConstructionCode(ctx, api, lines, x = 180, y = 390, size = 30, active = -1) {
  return lines.forEach((text, i) => {
    if (i === active)
      api.rect(
        ctx,
        x - 12,
        y + i * 58 - size - 8,
        Math.min(1560, text.length * size * 0.61 + 24),
        size + 22,
        '#273748',
        api.C.yellow,
        3,
      );
    drawConstructionText(
      ctx,
      api,
      text,
      x,
      y + i * 58,
      size,
      i === active ? api.C.yellow : api.C.ink,
      'left',
      true,
    );
  });
}
export function drawConstructionArrow(ctx, api, x, y, z, w, color = api.C.cyan) {
  drawConstructionLine(ctx, api, x, y, z, w, color, 3);
  const a = Math.atan2(w - y, z - x);
  drawConstructionLine(
    ctx,
    api,
    z,
    w,
    z - 13 * Math.cos(a - 0.45),
    w - 13 * Math.sin(a - 0.45),
    color,
    3,
  );
  drawConstructionLine(
    ctx,
    api,
    z,
    w,
    z - 13 * Math.cos(a + 0.45),
    w - 13 * Math.sin(a + 0.45),
    color,
    3,
  );
}
export function drawConstructionChip(
  ctx,
  api,
  label,
  x,
  y,
  width = 150,
  color = api.C.cyan,
  height = 62,
) {
  api.rect(ctx, x, y, width, height, api.C.panel, color, 3);
  drawConstructionText(
    ctx,
    api,
    label,
    x + width / 2,
    y + height * 0.66,
    29,
    color,
    'center',
    true,
  );
}
export function drawConstructionFraction(ctx, api, n, d, x, y, color = api.C.cyan) {
  return drawConstructionEquation(ctx, api, `\\frac{${n}}{${d}}`, x, y, 52, color);
}
export function drawConstructionRule(ctx, api, label, x, y, width = 1550) {
  drawConstructionLine(ctx, api, x, y, x + width, y, api.C.muted, 2);
  drawConstructionText(ctx, api, label, x, y - 17, 25, api.C.muted);
}
export function drawConstructionSheet(
  ctx,
  api,
  id,
  text,
  x,
  y,
  width = 680,
  height = 110,
  color = api.C.cyan,
) {
  api.rect(ctx, x, y, width, height, api.C.panel, color, 2);
  drawConstructionText(ctx, api, id, x + 20, y + 34, 26, color, 'left', true);
  drawConstructionText(ctx, api, text, x + 20, y + 83, 30, api.C.ink);
}
export function drawConstructionRowTable(
  ctx,
  api,
  rows,
  y = 375,
  { status = new Map(), normalized = false, small = false } = {},
) {
  const h = small ? 44 : 90,
    fs = small ? 25 : 29;
  [
    ['ID', 145],
    ['conversation', 305],
    ['message', 565],
    ['label', 1380],
    ['decision', 1640],
  ].forEach(([t, x]) => drawConstructionText(ctx, api, t, x, y - 30, 25, api.C.muted));
  rows.forEach((row, i) => {
    const yy = y + i * h,
      why = status.get(row.ticket_id),
      col = why ? (why === 'keep' ? api.C.green : api.C.pink) : api.C.cyan;
    if (why)
      api.rect(
        ctx,
        128,
        yy - 24,
        1645,
        h - 5,
        why === 'keep' ? '#142c28' : '#2d1d29',
        undefined,
        0,
      );
    drawConstructionText(
      ctx,
      api,
      row.ticket_id === true ? 'true' : row.ticket_id,
      145,
      yy,
      fs,
      col,
      'left',
      true,
    );
    drawConstructionText(ctx, api, row.conversation_id, 305, yy, fs, api.C.blue, 'left', true);
    drawConstructionText(
      ctx,
      api,
      normalized ? fixtureNormalize(row.text) : row.text,
      565,
      yy,
      fs,
      api.C.ink,
    );
    drawConstructionText(
      ctx,
      api,
      row.label ?? 'None',
      1380,
      yy,
      fs,
      row.label === 'escalate' ? api.C.yellow : api.C.cyan,
    );
    if (why)
      drawConstructionText(
        ctx,
        api,
        why
          .replace('cross_conversation_duplicate', 'cross-group')
          .replace('exact_duplicate', 'duplicate')
          .replace('invalid_ticket_id', 'invalid ID')
          .replace('invalid_label', 'no label')
          .replace('label_conflict', 'conflict'),
        1640,
        yy,
        small ? 23 : 25,
        col,
      );
  });
}
