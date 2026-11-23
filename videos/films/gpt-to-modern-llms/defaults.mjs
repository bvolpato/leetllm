import { vocabulary } from './fixtures.mjs';
export function text(ctx, api, v, x, y, size = 26, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function math(ctx, api, v, x, y, size = 38, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width, height = 80, color = api.C.cyan, size = 25) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize: size,
    baselineOffset: size * 0.34 - (String(label).split('\n').length - 1) * size * 0.7,
    padding: 12,
  });
}
export function probabilities(ctx, api, output, y = 470) {
  const plot = api.teaching.axes({
    x: 730,
    y,
    width: 670,
    height: 320,
    xDomain: [0, 1],
    yDomain: [0, 4],
    xTicks: [0, 0.25, 0.5, 0.75, 1],
    yTicks: [],
    xLabel: 'next-token probability',
    yLabel: '',
    fontSize: 22,
  });
  vocabulary.forEach((word, i) => {
    const top = y + 15 + i * 72;
    text(
      ctx,
      api,
      word === '.' ? 'period' : word,
      665,
      top + 29,
      27,
      i === 0 ? api.C.yellow : api.C.ink,
      'right',
    );
    api.rect(
      ctx,
      730,
      top,
      670 * output.probabilities[i],
      39,
      i === 0 ? api.C.green : api.C.blue,
      api.C.panel,
      1,
    );
    text(ctx, api, output.probabilities[i].toFixed(3), 1470, top + 29, 26, api.C.ink);
  });
  return plot;
}
export function drawModernText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawModernEquation(ctx, api, v, x, y, size = 44, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawModernFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawModernArrow(ctx, api, a, z, color = api.C.yellow, w = 5) {
  return api.arrow(ctx, a[0], a[1], z[0], z[1], color, w);
}
export function drawModernStamp(ctx, api, label, x, y, color = api.C.cyan) {
  api.circle(ctx, x, y, 39, api.C.panel, color, 3);
  drawModernText(ctx, api, label, x, y + 10, 27, color);
}
export function drawModernRect(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, color, api.C.panel, 2);
}
