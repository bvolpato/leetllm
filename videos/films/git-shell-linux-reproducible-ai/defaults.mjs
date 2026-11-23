import { mix, smooth } from './arithmetic.mjs';
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
export function panel(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 2);
}
export function code(
  ctx,
  api,
  lines,
  x,
  y,
  { size = 29, lineHeight = 55, color = api.C.ink } = {},
) {
  lines.forEach((line, i) =>
    text(
      ctx,
      api,
      line,
      x,
      y + i * lineHeight,
      size,
      typeof color === 'function' ? color(i, line) : color,
      'left',
      true,
    ),
  );
}
export function terminal(
  ctx,
  api,
  title,
  lines,
  x,
  y,
  w,
  h,
  { color = api.C.cyan, size = 29, lineHeight = 55 } = {},
) {
  panel(ctx, api, x, y, w, h, color);
  text(ctx, api, title, x + 25, y + 43, 26, color, 'left', title.includes('_'));
  code(ctx, api, lines, x + 25, y + 105, {
    size,
    lineHeight,
  });
}
export function caption(ctx, api, value) {
  text(ctx, api, value, 960, 990, 30, api.C.muted, 'center');
}
export function rowPane(ctx, api, title, value, x, color, status) {
  text(ctx, api, title, x + 240, 310, 34, color, 'center');
  panel(ctx, api, x, 350, 480, 385, color);
  if (value)
    code(
      ctx,
      api,
      [
        '{',
        ' "prompt":',
        ' "Access request 102 status?",',
        ' "expected": "blocked",',
        ' "prediction": "' + value.prediction + '"',
        '}',
      ],
      x + 22,
      405,
      {
        size: 25,
        lineHeight: 53,
      },
    );
  else text(ctx, api, status, x + 240, 555, 30, api.C.muted, 'center');
}
export const tag = (ctx, api, value, x, y, width, color = api.C.cyan, size = 29) => {
  panel(ctx, api, x, y, width, 68, color);
  text(ctx, api, value, x + width / 2, y + 45, size, color, 'center', true);
};
export function route(ctx, api, points, color, width = 3) {
  for (let i = 1; i < points.length; i++)
    api.line(ctx, ...points[i - 1], ...points[i], color, width);
}
export function transfer(ctx, api, value, from, to, p, color = api.C.yellow, width = 280) {
  if (p <= 0 || p >= 1) return;
  const q = smooth(p);
  tag(ctx, api, value, mix(from[0], to[0], q), mix(from[1], to[1], q), width, color, 26);
}
export function freshRowsLane(ctx, api, title, values, x, color, receipt = null) {
  text(ctx, api, title, x + 230, 335, 32, color, 'center');
  panel(ctx, api, x, 375, 460, 445, color);
  if (!values) {
    text(ctx, api, 'input pending', x + 230, 565, 31, api.C.muted, 'center');
    return;
  }
  values.forEach((row, i) => {
    const match = row.expected.trim().toLowerCase() === row.prediction.trim().toLowerCase(),
      y = 401 + i * 49;
    text(ctx, api, String(201 + i), x + 35, y, 25, api.C.muted, 'left', true);
    api.rect(ctx, x + 120, y - 22, 270, 23, match ? api.C.green : api.C.pink);
  });
  text(ctx, api, `${values.length} valid records`, x + 230, 790, 27, api.C.ink, 'center');
  if (receipt)
    text(
      ctx,
      api,
      `${receipt.correct}/${receipt.total} · ${receipt.passes ? 'PASS' : 'FAIL'}`,
      x + 230,
      890,
      39,
      receipt.passes ? api.C.green : api.C.pink,
      'center',
    );
}
