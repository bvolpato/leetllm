import { clip01 } from './encoding.mjs';
export function originalText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width, color = api.C.blue, height = 86, fontSize = 29) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function connectShapes(ctx, api, source, target, color = api.C.cyan) {
  return api.connect(ctx, source, target, {
    color,
    gap: 16,
  });
}
export function labelText(ctx, api, v, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 8);
}
export function line(ctx, api, x, y, xx, yy, color = api.C.muted, width = 2) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function dot(ctx, api, x, y, color = api.C.yellow, r = 10) {
  return api.circle(ctx, x, y, r, color);
}
export function bar(ctx, api, x, y, w, h, f, color) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 0);
  if (f > 0) api.rect(ctx, x, y, w * clip01(f), h, color, undefined, 0);
}
export function bits(ctx, api, code, x, y, w = 640, format = 'e4m3') {
  const text = code.toString(2).padStart(8, '0').split('');
  api.teaching.grid({
    x,
    y,
    width: w,
    height: 64,
    rows: 1,
    columns: 8,
    labels: [text],
    fontSize: 30,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
    highlights: text.map((_, column) => ({
      row: 0,
      column,
      fill:
        format === 'e8m0'
          ? api.C.blue
          : column === 0
            ? api.C.pink
            : column < 5
              ? api.C.blue
              : api.C.cyan,
      stroke: api.C.panel,
    })),
  });
  if (format === 'e4m3') {
    labelText(ctx, api, 'sign', x + w / 16, y + 104, 23, api.C.pink, 'center');
    labelText(ctx, api, 'exponent', x + w * 0.375, y + 104, 23, api.C.blue, 'center');
    labelText(ctx, api, 'fraction', x + w * 0.81, y + 104, 23, api.C.cyan, 'center');
  } else
    labelText(
      ctx,
      api,
      '8 exponent bits · no sign bit',
      x + w / 2,
      y + 104,
      23,
      api.C.blue,
      'center',
    );
}
export function vector(ctx, api, values, x, y, w = 1400, h = 80, selected = []) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: 1,
    columns: values.length,
    labels: [values.map(String)],
    fontSize: values.length > 16 ? 14 : 25,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
    highlights: selected.map((column) => ({
      row: 0,
      column,
      fill: api.C.panel,
      stroke: api.C.yellow,
    })),
  });
}
