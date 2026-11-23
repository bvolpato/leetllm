import { WORDS } from './fixtures.mjs';
export function originalText(ctx, api, s, x, y, z = 34, col = api.C.ink, a = 'left') {
  return api.text(ctx, s, x, y, z, col, a);
}
export function originalMath(ctx, api, s, x, y, z = 46, col = api.C.ink, a = 'left') {
  return api.math(ctx, s, x, y, z, col, a);
}
export function originalBars(ctx, api, values, colors = WORDS.map(() => api.C.cyan)) {
  return api.teaching.bars({
    values,
    labels: WORDS,
    x: 300,
    y: 440,
    width: 1320,
    height: 330,
    max: 1,
    colors,
    fontSize: 30,
    showValues: true,
    format: (v) => v.toFixed(3),
    gap: 65,
  });
}
export function coreText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function coreLine(ctx, api, x, y, z, w, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, z, w, color, width);
}
export function coreBox(ctx, api, v, x, y, w = 450, h = 85, color = api.C.blue, size = 31) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 8);
  coreText(ctx, api, v, x + w / 2, y + h / 2 + size * 0.32, size, color);
}
export function coreTitle(ctx, api, v) {
  return coreText(ctx, api, v, 960, 280, 35, api.C.yellow);
}
export function coreFoot(ctx, api, v) {
  return coreText(ctx, api, v, 960, 1025, 25, api.C.muted);
}
export function coreBars(
  ctx,
  api,
  values,
  labels,
  { x = 380, y = 390, width = 1180, gap = 72, max = Math.max(...values, 1e-9), colors = [] } = {},
) {
  return values.forEach((value, i) => {
    const yy = y + i * gap,
      tone = colors[i] ?? api.C.cyan;
    coreText(ctx, api, labels[i], x - 25, yy + 26, 27, tone, 'right');
    api.rect(ctx, x, yy, width, 34, api.C.panel, api.C.muted, 3);
    if (value > 0) api.rect(ctx, x, yy, (width * value) / max, 34, tone, undefined, 3);
    coreText(ctx, api, value.toFixed(4), x + width + 30, yy + 27, 27, tone, 'left');
  });
}
export function coreVector(ctx, api, values, labels, x = 180, y = 470, w = 1560, colors = []) {
  const cell = w / values.length;
  values.forEach((v, i) => {
    coreBox(
      ctx,
      api,
      v === null ? '?' : typeof v === 'number' ? v.toFixed(3) : v,
      x + i * cell,
      y,
      cell - 16,
      80,
      colors[i] ?? api.C.cyan,
      30,
    );
    if (labels)
      coreText(ctx, api, labels[i], x + i * cell + (cell - 16) / 2, y - 30, 27, api.C.muted);
  });
}
