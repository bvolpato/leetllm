import { clamped } from './arithmetic.mjs';
import { noise } from './fixtures.mjs';
export function text(ctx, api, v, x, y, n = 36, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, n, k, a);
}
export function equation(ctx, api, v, x, y, n = 48, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, n, k, a);
}
export function cueProgress(ctx, api, id, fallback = 0) {
  return api.focus.progress(id, fallback);
}
export function box(ctx, api, lines, x, y, width, height, color = api.C.ink, fontSize = 32) {
  const shape = api.rect(ctx, x, y, width, height, api.C.panel, color, 2, 10);
  const list = Array.isArray(lines) ? lines : [lines];
  list.forEach((line, i) =>
    text(
      ctx,
      api,
      line,
      x + width / 2,
      y + (height * (i + 1)) / (list.length + 1),
      fontSize,
      color,
      'center',
    ),
  );
  return shape;
}
export function outline(ctx, api, shape, color = api.C.yellow) {
  return api.rect(
    ctx,
    shape.x - 3,
    shape.y - 3,
    shape.width + 6,
    shape.height + 6,
    null,
    color,
    3,
    5,
  );
}
export function pixelGrid(ctx, api, values, x, y, size = 66, highlight = []) {
  return values.map((v, i) =>
    api.rect(
      ctx,
      x + (i % 5) * size,
      y + Math.floor(i / 5) * size,
      size - 6,
      size - 6,
      `#${Math.round(25 + v * 210)
        .toString(16)
        .padStart(2, '0')
        .repeat(3)}`,
      highlight.includes(i) ? api.C.yellow : undefined,
      5,
    ),
  );
}
export function latentPlane(ctx, api) {
  return api.teaching.axes({
    x: 260,
    y: 385,
    width: 830,
    height: 370,
    xDomain: [-3, 3],
    yDomain: [-3, 3],
    equalUnits: true,
    xTicks: [-2, 0, 2],
    yTicks: [-2, 0, 2],
    xLabel: 'latent coordinate 1',
    yLabel: 'latent coordinate 2',
    fontSize: 34,
  });
}
export function cloud(ctx, api, q, m, sc, k, amount = 1) {
  const pts = noise
    .map((v) => ({
      x: m[0] + sc[0] * v.x,
      y: m[1] + sc[1] * v.y,
    }))
    .filter((v) => Math.abs(v.x) < 2.8 && Math.abs(v.y) < 2.8);
  api.teaching.scatter({
    plot: q,
    points: pts,
    color: k,
    radius: 5,
    opacity: amount,
  });
}
export function chapterText(ctx, api, v, x, y, n = 31, k = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, n, k, a);
}
export function chapterEquation(ctx, api, v, x, y, n = 40, k = api.C.ink, a = 'left') {
  return api.math(ctx, v, x, y, n, k, a);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 4);
}
export function bar(ctx, api, x, y, width, height, color) {
  return width > 0.01 && api.rect(ctx, x, y, width, height, color, undefined, 0, 3);
}
export function note(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 970, 29, api.C.muted, 'center');
}
export function chapterGrid(ctx, api, values, x, y, size = 52, selected = []) {
  return values.map((v, i) => {
    const grey = Math.round(25 + 210 * clamped(v))
      .toString(16)
      .padStart(2, '0')
      .repeat(3);
    return api.rect(
      ctx,
      x + (i % 5) * size,
      y + Math.floor(i / 5) * size,
      size - 5,
      size - 5,
      '#' + grey,
      selected.includes(i) ? api.C.yellow : undefined,
      selected.includes(i) ? 3 : 0,
      2,
    );
  });
}
export function point(ctx, api, x, y, color, r = 7) {
  return api.circle(ctx, x, y, r, color);
}
export function plane(ctx, api, x, y, width, height, xDomain, yDomain, xLabel, yLabel) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain,
    yDomain,
    xLabel,
    yLabel,
    xTicks: [xDomain[0], 0, xDomain[1]],
    yTicks: [yDomain[0], 0, yDomain[1]],
    fontSize: 26,
  });
}
