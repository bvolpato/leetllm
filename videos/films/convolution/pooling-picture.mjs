import { POOL_MAP } from './fixtures.mjs';
import { poolSnapshot } from './arithmetic.mjs';
import { formatChapterValue, text, valueGrid } from './defaults.mjs';
import { footprint } from './footprint.mjs';

export const savedPool = poolSnapshot(POOL_MAP);
export const positions = ['upper left', 'upper right', 'lower left', 'lower right'];
export const plane = { x: 170, y: 340, pitch: 124 };

export function poolPlane(
  ctx,
  api,
  values,
  { label, selected = [], activeWindow, stride = 2, kind } = {},
) {
  const { x, y, pitch } = plane;
  const center = x + (values.length * pitch) / 2;
  text(ctx, api, label, center, 278, 37, api.C.ink, 'center');
  valueGrid(ctx, api, values, x, y, pitch, { font: 39, selected, kind });
  if (activeWindow !== undefined)
    footprint(
      ctx,
      api,
      x,
      y,
      pitch,
      (activeWindow >> 1) * stride,
      (activeWindow % 2) * stride,
      2,
      2,
      api.C.cyan,
    );
}

export function poolOutputs(ctx, api, label, entries, active) {
  text(ctx, api, label, 1458, 278, 37, api.C.ink, 'center');
  for (const [i, entry] of entries.entries()) {
    const x = 1200 + 268 * (i % 2),
      y = 350 + 235 * (i >> 1);
    const color = i === active ? api.C.cyan : api.C.muted;
    api.rect(ctx, x, y, 244, 202, api.C.panel, color, 9);
    const value = entry.value ?? '?';
    text(
      ctx,
      api,
      formatChapterValue(value),
      x + 122,
      y + 99,
      56,
      value < 0 ? api.C.pink : api.C.ink,
      'center',
    );
    text(ctx, api, entry.detail, x + 122, y + 160, 31, entry.color ?? api.C.muted, 'center');
  }
}
