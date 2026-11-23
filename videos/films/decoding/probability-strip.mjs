import { coreText } from './defaults.mjs';

export const stripX = 200;
export const stripWidth = 1520;

export function stripMarker(ctx, api, value, y, label) {
  const x = stripX + stripWidth * value;
  api.arrow(ctx, x, y - 62, x, y - 8, api.C.yellow, 5);
  coreText(ctx, api, label, x, y - 80, 32, api.C.yellow);
}

// The segment edges use probability coordinates. The label slots stay readable even for a 1% tail.
export function probabilityStrip(
  ctx,
  api,
  { values, names, y, kept, labels = true, percent = true },
) {
  const { C } = api;
  const colors = [C.blue, C.green, C.pink, C.cyan, C.yellow];
  const cell = stripWidth / values.length;
  let left = stripX;
  values.forEach((value, i) => {
    const width = value * stripWidth;
    const color = !kept || kept.includes(i) ? colors[i % colors.length] : C.muted;
    const center = left + width / 2;
    const slot = stripX + cell * (i + 0.5);
    if (width > 0) {
      api.rect(ctx, left, y, width, 65, color, undefined, 0);
      if (left > stripX) api.line(ctx, left, y, left, y + 65, C.bg, 4);
      if (labels) api.line(ctx, center, y + 69, slot, y + 121, color, 2);
    }
    if (labels) {
      coreText(ctx, api, names[i], slot, y + 162, 34, width > 0 ? color : C.muted);
      if (percent) coreText(ctx, api, (value * 100).toFixed(1) + '%', slot, y + 207, 32, C.ink);
    }
    left += width;
  });
}
