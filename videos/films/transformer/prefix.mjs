import { VOCAB } from './fixtures.mjs';

export function prefixX(index, length) {
  const step = 1600 / (length + 1);
  return 160 + (index + 0.5) * step;
}

export function paintPrefix(
  ctx,
  api,
  ids,
  { y = 330, count = ids.length, selected = false, choice = null, choiceColor = api.C.green } = {},
) {
  const { C } = api;
  const step = 1600 / (ids.length + 1);
  for (let i = 0; i <= ids.length; i++) {
    const next = i === ids.length;
    const center = prefixX(i, ids.length);
    const visible = next ? choice !== null : i < count;
    const color = next
      ? visible
        ? choiceColor
        : C.muted
      : selected && i === ids.length - 1
        ? C.yellow
        : C.blue;
    api.text(ctx, next ? 'next token' : 'position ' + i, center, y - 34, 29, C.muted, 'center');
    api.rect(ctx, center - step * 0.46, y, step * 0.92, 112, C.panel, visible ? color : C.muted, 8);
    if (visible) api.text(ctx, VOCAB[next ? choice : ids[i]], center, y + 73, 47, color, 'center');
    else if (next) api.text(ctx, '?', center, y + 73, 47, C.muted, 'center');
  }
}

// The span ends at the last key the mask admits. The query keeps its absolute position.
export function readSpan(ctx, api, length, lastKey, y, label, color, firstKey = 0) {
  const first = prefixX(firstKey, length);
  const end = prefixX(lastKey, length);
  const half = 640 / (length + 1);
  api.line(ctx, first - half, y, end + half, y, color, 5);
  api.line(ctx, first - half, y - 14, first - half, y, color, 5);
  api.line(ctx, end + half, y - 14, end + half, y, color, 5);
  api.text(ctx, label, (first + end) / 2, y + 54, 30, color, 'center');
}
