import { unit } from './arithmetic.mjs';
export const mark = (api, id, paint) => api.focus.target(id, paint);
export function text(
  ctx,
  api,
  value,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'left',
  mono = false,
) {
  return api.text(ctx, String(value), x, y, size, color, align, mono ? 'mono' : 'sans');
}
export function box(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 8);
}
export function code(ctx, api, lines, x, y, size = 30, lineHeight = 56, active = -1) {
  return lines.map((line, i) => {
    if (i === active)
      api.rect(
        ctx,
        x - 12,
        y + i * lineHeight - size - 12,
        Math.min(1640, Math.max(90, line.length * size * 0.61 + 24)),
        size + 30,
        '#26354a',
        api.C.yellow,
        2,
        4,
      );
    return text(
      ctx,
      api,
      line,
      x,
      y + i * lineHeight,
      size,
      i === active ? api.C.yellow : api.C.ink,
      'left',
      true,
    );
  });
}
export function footer(ctx, api, line) {
  text(ctx, api, line, 960, 1000, 30, api.C.muted, 'center');
}
export const rowLines = (value) => [
  '{',
  '  "prompt": "Access request 102 status?",',
  '  "expected": "blocked",',
  '  "prediction": ' + JSON.stringify(value),
  '}',
];
export function rowObject(
  ctx,
  api,
  x,
  y,
  value,
  title = 'row · dict',
  color = api.C.cyan,
  w = 870,
  size = 31,
) {
  box(ctx, api, x, y, w, 390, color);
  text(ctx, api, title, x + 24, y + 48, 29, color, 'left', title.includes('_'));
  code(ctx, api, rowLines(value), x + 24, y + 112, size, 52);
}
export function arrow(ctx, api, from, to, color) {
  return api.connect(ctx, from, to, {
    color,
    width: 4,
    fromGap: 12,
    toGap: 12,
  });
}
export const pyMark = (api, scene, fn) => mark(api, 'py-' + scene + '-mechanism', fn);
export function rail(ctx, api, x, y, w, label, color = api.C.blue, h = 80, size = 31) {
  const shape = box(ctx, api, x, y, w, h, color);
  text(ctx, api, label, x + 20, y + h / 2 + size * 0.34, size, color, 'left', true);
  return shape;
}
export function stripe(ctx, api, x, y, w, p, color, h = 12) {
  api.rect(ctx, x, y, w, h, api.C.panel, api.C.muted, 1, 2);
  if (p > 0) api.rect(ctx, x, y, Math.max(1, w * unit(p)), h, color, color, 0, 2);
}
