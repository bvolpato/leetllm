import { address } from './arithmetic.mjs';

export const original = Array.from({ length: 6 }, (_, i) =>
  address([Math.floor(i / 3), i % 3], [3, 1]),
);
export const transposed = Array.from({ length: 6 }, (_, i) =>
  address([Math.floor(i / 2), i % 2], [1, 3]),
);
export const cellX = (index) => 470 + index * 234;
export const bankY = 365;

export function storageBank(ctx, api, values, selected) {
  const { C } = api;
  api.text(ctx, 'int64 storage', 85, bankY - 6, 36, C.ink);
  api.text(ctx, '48 bytes', 85, bankY + 48, 33, C.muted);
  values.forEach((value, i) => {
    const x = cellX(i);
    api.text(ctx, 'byte ' + i * 8, x, bankY - 77, 30, C.muted, 'center');
    api.rect(ctx, x - 110, bankY - 50, 220, 105, C.panel, i === selected ? C.yellow : C.muted, 5);
    api.text(ctx, String(value), x, bankY + 25, 60, i === selected ? C.yellow : C.ink, 'center');
  });
}

export function readCursor(ctx, api, order, progress, color) {
  const position = progress * (order.length - 1);
  const i = Math.floor(position);
  const a = order[i],
    b = order[Math.min(i + 1, order.length - 1)];
  const x = cellX(a + (b - a) * (position - i));
  api.path(
    ctx,
    [
      { x: x - 13, y: bankY + 91 },
      { x, y: bankY + 65 },
      { x: x + 13, y: bankY + 91 },
    ],
    { closed: true, fill: color, width: 0 },
  );
}
