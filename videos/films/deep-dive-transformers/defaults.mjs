import { clamp01 } from './arithmetic.mjs';
export function originalText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function originalMath(ctx, api, v, x, y, size = 46) {
  return api.math(ctx, v, x, y, size, api.C.yellow, 'center');
}
export function originalCard(ctx, api, label, x, y, width = 400, color = api.C.blue, height = 100) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    ...(label.includes('\n')
      ? {
          baselineOffset: -16.24,
        }
      : {}),
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function originalGrid(
  ctx,
  api,
  labels,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  fontSize = 33,
) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
  });
}
export function originalTransfer(
  ctx,
  api,
  b,
  s,
  a,
  z,
  color = api.C.cyan,
  progress = b === 0 ? s.q : 1,
) {
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
      radius: 7,
      fill: color,
    },
    margin: 3,
  });
}
export function chapterText(ctx, api, v, x, y, size = 30, col = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function chapterMath(ctx, api, v, x, y, size = 42, col = api.C.yellow) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function chapterBox(ctx, api, label, x, y, w = 450, col = api.C.blue, h = 100, size = 28) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    textColor: col,
    fill: api.C.panel,
    stroke: col,
    padding: 12,
    ...(label.includes('\n')
      ? {
          baselineOffset: -16,
        }
      : {}),
  });
}
export function chapterGrid(ctx, api, labels, x, y, w, h, col = api.C.blue, size = 29) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: col,
    textColor: api.C.ink,
  });
}
export function chapterArrow(ctx, api, x, y, x2, y2, col = api.C.cyan) {
  return api.arrow(ctx, x, y, x2, y2, col, 4);
}
export function chapterFooter(ctx, api, text) {
  return chapterText(ctx, api, text, 960, 1035, 26, api.C.muted, 'center');
}
export function chapterTitle(ctx, api, text) {
  return chapterText(ctx, api, text, 960, 285, 35, api.C.yellow, 'center');
}
export function chapterRows(ctx, api, entries, y = 380, dy = 165) {
  return entries.forEach(([key, value, col = api.C.cyan], i) => {
    chapterBox(ctx, api, key, 170, y + i * dy, 520, api.C.blue, 90, 27);
    chapterText(ctx, api, value, 770, y + 55 + i * dy, 30, col);
  });
}
export function chapterTransfer(ctx, api, points, q, col = api.C.yellow) {
  api.path(ctx, points, {
    color: col,
    width: 3,
  });
  api.components.particle({
    points,
    progress: clamp01(q),
    fill: col,
    radius: 6,
  });
}
