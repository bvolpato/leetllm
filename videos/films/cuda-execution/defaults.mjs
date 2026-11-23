import { clamp } from './construction.mjs';
export function drawOriginalText(
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
  return api.text(ctx, value, x, y, size, color, align, mono ? 'mono' : 'sans');
}
export function drawOriginalEquation(ctx, api, value, x, y, size = 47, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function drawOriginalMark(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function drawOriginalCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 100,
  color = api.C.cyan,
  size = 38,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: size,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function drawOriginalTransfer(ctx, api, a, z, progress, color = api.C.cyan) {
  const gap = 18;
  if (progress !== undefined) {
    const from = api.anchor(a, z, gap),
      tip = api.anchor(z, a, gap);
    const dx = tip.x - from.x,
      dy = tip.y - from.y,
      length = Math.hypot(dx, dy);
    const stop = {
      x: tip.x - (28 * dx) / length,
      y: tip.y - (28 * dy) / length,
    };
    api.components.particle({
      points: [from, stop],
      progress,
      radius: 8,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 3,
    });
  }
  return api.teaching.transfer({
    source: {
      shape: a,
      opacity: 1,
    },
    target: {
      shape: z,
      opacity: 1,
    },
    color,
    width: 3,
    gap,
    margin: 7,
  });
}
export function drawOriginalFooter(ctx, api, value) {
  return drawOriginalText(ctx, api, value, 960, 1015, 27, api.C.muted, 'center');
}
export function drawOriginalTokenRow(
  ctx,
  api,
  values,
  y,
  { x = 180, width = 1560, height = 100, color = api.C.cyan, owner = true } = {},
) {
  const w = width / values.length;
  return values.map((value, i) => {
    if (owner)
      drawOriginalText(
        ctx,
        api,
        'T' + i,
        x + (i + 0.5) * w,
        owner === 'below' ? y + height + 38 : y - 22,
        26,
        api.C.muted,
        'center',
      );
    return drawOriginalCard(
      ctx,
      api,
      value === null ? '?' : String(value),
      x + i * w + 3,
      y,
      w - 6,
      height,
      color,
      41,
    );
  });
}
export function drawOriginalCode(ctx, api, lines, x, y, size = 31, active = -1, step = 55) {
  return lines.forEach((line, i) => {
    if (i === active)
      api.rect(
        ctx,
        x - 12,
        y + i * step - size - 11,
        Math.min(1650, line.length * size * 0.61 + 25),
        size + 28,
        '#26354a',
        api.C.yellow,
        4,
      );
    drawOriginalText(
      ctx,
      api,
      line,
      x,
      y + i * step,
      size,
      i === active ? api.C.yellow : api.C.ink,
      'left',
      true,
    );
  });
}
export function drawAddedP(ctx, api, id) {
  return api.focus.progress(id);
}
export function drawAddedText(
  ctx,
  api,
  value,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
  mono = false,
) {
  return api.text(ctx, String(value), x, y, size, color, align, mono ? 'mono' : 'sans');
}
export function drawAddedEquation(ctx, api, value, x, y, size = 47, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function drawAddedLine(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function drawAddedArrow(ctx, api, x, y, z, w, color = api.C.cyan) {
  drawAddedLine(ctx, api, x, y, z, w, color, 3);
  const a = Math.atan2(w - y, z - x);
  drawAddedLine(ctx, api, z, w, z - 13 * Math.cos(a - 0.45), w - 13 * Math.sin(a - 0.45), color, 3);
  drawAddedLine(ctx, api, z, w, z - 13 * Math.cos(a + 0.45), w - 13 * Math.sin(a + 0.45), color, 3);
}
export function drawAddedNote(ctx, api, value) {
  return drawAddedText(ctx, api, value, 960, 1010, 26, api.C.muted, 'center');
}
export function drawAddedCell(
  ctx,
  api,
  label,
  x,
  y,
  w = 180,
  h = 70,
  color = api.C.cyan,
  size = 29,
) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2);
  drawAddedText(ctx, api, label, x + w / 2, y + h * 0.65, size, color, 'center', true);
}
export function drawAddedCode(ctx, api, lines, x, y, size = 29, active = -1) {
  return lines.forEach((text, i) => {
    if (i === active)
      api.rect(
        ctx,
        x - 10,
        y + i * 58 - size - 8,
        Math.min(1550, text.length * size * 0.61 + 24),
        size + 22,
        '#26354a',
        api.C.yellow,
        2,
      );
    drawAddedText(
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
export function drawAddedBar(ctx, api, x, y, w, h, f, color) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 2);
  if (f > 0) api.rect(ctx, x, y, w * clamp(f), h, color, undefined, 0);
}
export function drawAddedAnimate(ctx, api, p, i, n) {
  return api.phase(p, i / n, (i + 1) / n);
}
export function drawAddedTokenRowMini(ctx, api, values, y) {
  values.forEach((value, i) => {
    drawAddedCell(ctx, api, value, 180 + i * 195, y, 155, 90, api.C.blue, 38);
    drawAddedText(ctx, api, 'T' + i, 257 + i * 195, y - 30, 25, api.C.muted, 'center');
  });
}
