import { ASSISTANT_TARGETS, TOKENS } from './fixtures.mjs';
export function instructionF(ctx, api, id, fn) {
  return api.focus ? api.focus.target(id, fn) : fn();
}
export function instructionT(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function instructionM(ctx, api, v, x, y, size = 42, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function instructionLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function instructionCell(
  ctx,
  api,
  v,
  x,
  y,
  w = 94,
  h = 62,
  color = api.C.blue,
  size = 26,
  fill = api.C.panel,
) {
  api.rect(ctx, x, y, w, h, fill, color, 1.5, 4);
  instructionT(ctx, api, v, x + w / 2, y + h * 0.64, size, color, 'center');
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function instructionRow(
  ctx,
  api,
  values,
  x,
  y,
  {
    step = 100,
    w = 94,
    h = 62,
    color = api.C.blue,
    size = 26,
    selected = () => false,
    label,
    indexStart,
    ids,
  } = {},
) {
  if (label) instructionT(ctx, api, label, x, y - 32, 30, color);
  values.forEach((v, i) => {
    const co = selected(i) ? api.C.yellow : typeof color === 'function' ? color(i) : color;
    instructionCell(ctx, api, v, x + i * step, y, w, h, co, size);
    if (indexStart !== undefined)
      instructionT(
        ctx,
        api,
        indexStart + i,
        x + i * step + w / 2,
        y + h + 33,
        23,
        api.C.muted,
        'center',
      );
    if (ids)
      instructionT(ctx, api, ids[i], x + i * step + w / 2, y + h + 68, 24, api.C.muted, 'center');
  });
}
export function instructionTokenRow(
  ctx,
  api,
  y,
  { target = false, masked = false, shift = 0 } = {},
) {
  return TOKENS.forEach((token, i) => {
    if (target && i === 0 && shift > 0) return;
    const x = 110 + i * 100 - shift * 100,
      active = ASSISTANT_TARGETS[i],
      color =
        masked && !active
          ? api.C.muted
          : active
            ? api.C.green
            : i === 5 || i === 12
              ? api.C.yellow
              : api.C.blue;
    instructionCell(
      ctx,
      api,
      masked && !active ? '−100' : token,
      x,
      y,
      94,
      64,
      color,
      token.length > 7 ? 24 : 26,
    );
    instructionT(ctx, api, i, x + 47, y - 18, 24, api.C.muted, 'center');
  });
}
export function instructionMatrix(
  ctx,
  api,
  values,
  x,
  y,
  { step = 70, color = api.C.cyan, visible = () => true, selected = () => false, size = 26 } = {},
) {
  return values.forEach((r, i) =>
    r.forEach((v, j) =>
      instructionCell(
        ctx,
        api,
        visible(i, j) ? v : '?',
        x + j * step,
        y + i * step,
        step - 5,
        step - 5,
        selected(i, j) ? api.C.yellow : color,
        size,
      ),
    ),
  );
}
export function instructionBracket(ctx, api, x, y, w, h, color = api.C.muted) {
  instructionLine(ctx, api, x + 12, y, x, y, color);
  instructionLine(ctx, api, x, y, x, y + h, color);
  instructionLine(ctx, api, x, y + h, x + 12, y + h, color);
  instructionLine(ctx, api, x + w - 12, y, x + w, y, color);
  instructionLine(ctx, api, x + w, y, x + w, y + h, color);
  instructionLine(ctx, api, x + w, y + h, x + w - 12, y + h, color);
}
export function instructionFoot(ctx, api, v) {
  return instructionT(ctx, api, v, 960, 1020, 26, api.C.muted, 'center');
}
export function instructionSumBar(
  ctx,
  api,
  values,
  x,
  y,
  { width = 1200, max = 40, colors: cs = [api.C.blue, api.C.cyan, api.C.green], labels = [] } = {},
) {
  let cursor = x;
  values.forEach((v, i) => {
    const w = (width * v) / max;
    if (w > 0) {
      api.rect(ctx, cursor, y, w, 46, cs[i % cs.length]);
      if (w > 50)
        instructionT(
          ctx,
          api,
          Number(v.toFixed(2)),
          cursor + w / 2,
          y + 33,
          25,
          api.C.bg,
          'center',
        );
    }
    if (labels[i])
      instructionT(
        ctx,
        api,
        labels[i],
        x + (i * width) / values.length,
        y - 24,
        27,
        cs[i % cs.length],
      );
    cursor += w;
  });
  instructionLine(ctx, api, x, y + 66, x + width, y + 66);
}
export function instructionRoleColor(ctx, api, i) {
  return ASSISTANT_TARGETS[i] ? api.C.green : i === 5 || i === 12 ? api.C.yellow : api.C.blue;
}
