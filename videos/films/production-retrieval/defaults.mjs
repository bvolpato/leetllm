import { prClamp } from './arithmetic.mjs';
import { ROTATION_RULE } from './fixtures.mjs';
export function drawText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 40, color = api.C.ink) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function recordCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 112,
  fontSize = 27,
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
    baselineOffset: fontSize * 0.34 - (String(label).split('\n').length - 1) * fontSize * 0.7,
  });
}
export function footer(ctx, api, s) {
  return drawText(ctx, api, s, 960, 1030, 25, api.C.muted, 'center');
}
export function paragraph(ctx, api, text, x, y, width, size = 25, color = api.C.ink) {
  const max = Math.floor(width / (size * 0.58)),
    lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  lines.forEach((value, i) => drawText(ctx, api, value, x, y + i * size * 1.42, size, color));
}
export function extensionText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function centeredText(ctx, api, value, x, y, size = 34, color = api.C.ink) {
  return extensionText(ctx, api, value, x, y, size, color, 'center');
}
export function wrapLines(ctx, api, value, max) {
  const words = String(value).split(/\s+/),
    out = [];
  let row = '';
  for (let word of words) {
    while (word.length > max) {
      if (row) {
        out.push(row);
        row = '';
      }
      out.push(word.slice(0, max));
      word = word.slice(max);
    }
    if ((row + ' ' + word).trim().length > max) {
      out.push(row);
      row = word;
    } else row = (row + ' ' + word).trim();
  }
  if (row) out.push(row);
  return out;
}
export function panel(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    radius: 12,
  });
}
export function card(ctx, api, value, x, y, w = 450, h = 100, color = api.C.cyan, size = 29) {
  const shape = panel(ctx, api, x, y, w, h, color),
    lines = String(value)
      .split('\n')
      .flatMap((v) => wrapLines(ctx, api, v, Math.floor((w - 48) / (size * 0.59))));
  lines.forEach((line, i) =>
    centeredText(
      ctx,
      api,
      line,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.35 + size * 0.33,
      size,
      color,
    ),
  );
  return shape;
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  if (Math.hypot(x2 - x1, y2 - y1) > 0.5) api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function sourcePage(
  ctx,
  api,
  x,
  y,
  w = 760,
  h = 390,
  {
    title = 'E1 · eu-access-v2',
    text = ROTATION_RULE,
    color = api.C.cyan,
    version = '2026-04-01 · EU · support:eu',
  } = {},
) {
  const shape = panel(ctx, api, x, y, w, h, color);
  extensionText(ctx, api, title, x + 30, y + 48, 29, color);
  const lines = wrapLines(ctx, api, text, Math.floor((w - 60) / 16.5));
  lines.forEach((line, i) =>
    extensionText(ctx, api, line, x + 30, y + 110 + i * 43, 28, api.C.ink),
  );
  extensionText(ctx, api, version, x + 30, y + h - 30, 25, api.C.muted);
  return shape;
}
export function meter(ctx, api, x, y, w, value, max, color, label) {
  api.rect(ctx, x, y, w, 30, api.C.panel, api.C.muted, 0);
  api.rect(ctx, x, y, w * prClamp(value / max), 30, color, undefined, 0);
  extensionText(ctx, api, label, x, y - 20, 28, color);
}
export function extensionFooter(ctx, api, value) {
  return centeredText(ctx, api, value, 960, 1030, 26, api.C.muted);
}
