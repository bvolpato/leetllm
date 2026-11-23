import { binomialMasses, mix } from './arithmetic.mjs';
export const mark = (api, id, paint) => api.focus.target(id, paint);
export const text = (ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') =>
  api.text(ctx, String(v), x, y, size, color, align);
export const card = (ctx, api, label, x, y, width, height, color = api.C.blue, fontSize = 29) =>
  api.components.card({
    label,
    x,
    y,
    width,
    height,
    stroke: color,
    fill: api.C.panel,
    textColor: color,
    fontSize,
    padding: height < 45 ? 6 : 12,
  });
export function token(ctx, api, r, x, y, w = 140, h = 61, label = r.id) {
  card(
    ctx,
    api,
    label,
    x,
    y,
    w,
    h,
    r.difference > 0 ? api.C.green : r.difference < 0 ? api.C.pink : api.C.muted,
    h < 45 ? 21 : 25,
  );
}
export function nullBars(
  ctx,
  api,
  {
    tail = false,
    mirror = false,
    progress = 1,
    cutoff = 8,
    id = 'null-histogram',
    tailCount = 6,
  } = {},
) {
  const values = binomialMasses(13),
    colors = values.map((_, k) =>
      tail && k >= cutoff && k < cutoff + tailCount
        ? api.C.yellow
        : mirror && k <= 5
          ? api.C.pink
          : api.C.blue,
    );
  mark(api, id, () => {
    api.teaching.bars({
      x: 210,
      y: 390,
      width: 1480,
      height: 335,
      values,
      labels: values.map((_, i) => String(i)),
      colors,
      max: 0.24,
      showValues: false,
      fontSize: 28,
      progress,
    });
    text(
      ctx,
      api,
      'B wins among 13 independent disagreements',
      950,
      800,
      30,
      api.C.muted,
      'center',
    );
  });
}
export function intervalAxis(ctx, api, interval, p, id, y = 610) {
  const x = (v) => 280 + ((v + 0.15) / 0.45) * 1360;
  mark(api, id, () => {
    api.line(ctx, 280, y, 1640, y, api.C.muted, 2);
    for (const v of [-0.1, 0, 0.1, 0.2, 0.25]) {
      api.line(ctx, x(v), y - 10, x(v), y + 10, api.C.muted, 2);
      text(ctx, api, `${v * 100}`, x(v), y + 55, 27, api.C.muted, 'center');
    }
    if (p > 0) {
      const center = (interval[0] + interval[1]) / 2,
        lo = mix(center, interval[0], p),
        hi = mix(center, interval[1], p);
      api.line(ctx, x(lo), y - 95, x(hi), y - 95, api.C.cyan, 10);
      for (const v of [lo, hi]) api.line(ctx, x(v), y - 120, x(v), y - 70, api.C.cyan, 4);
    }
    text(ctx, api, 'Pass-rate lift (percentage points)', 960, y + 125, 29, api.C.muted, 'center');
  });
  return x;
}
export function constructionText(ctx, api, s, x, y, size = 30, c = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, c, align, String(s).includes('_') ? 'mono' : 'sans');
}
export function constructionEquation(ctx, api, s, x, y, size = 44, c = api.C.ink) {
  return api.math(ctx, s, x, y, size, c, 'center');
}
export function constructionLine(ctx, api, x, y, xx, yy, c = api.C.muted, w = 2) {
  return api.line(ctx, x, y, xx, yy, c, w);
}
export function constructionArrow(ctx, api, x, y, xx, yy, c = api.C.cyan) {
  return api.arrow(ctx, x, y, xx, yy, c, 3);
}
export function constructionHeading(ctx, api, s) {
  return constructionText(ctx, api, s, 960, 260, 34, api.C.ink, 'center');
}
export function constructionCaption(ctx, api, s) {
  return constructionText(ctx, api, s, 960, 1030, 25, api.C.muted, 'center');
}
export function constructionBox(ctx, api, s, x, y, w = 430, h = 80, c = api.C.cyan, size = 30) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, api.C.panel, c, 2);
  constructionText(ctx, api, s, x, y + size * 0.34, size, c, 'center');
}
export function legacyText(ctx, api, s, x, y, size = 32, color = api.C.ink, align = 'left') {
  return text(ctx, api, s, x, y, size, color, align);
}
export function legacyEquation(ctx, api, s, x, y, size = 45, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
