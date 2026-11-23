import { cellText, chapterText, dot, line } from './defaults.mjs';

export const binX = (i) => 525 + 315 * i;
export const cutX = (n) => binX(n - 0.5);

export function drawBins(ctx, api, model, { showStats = true, cut = null } = {}) {
  const { C } = api;
  chapterText(ctx, api, 'Feature bin', 125, 348, 31, C.muted);
  chapterText(ctx, api, 'Deadline', 125, 432, 31, C.muted);
  if (showStats) {
    chapterText(ctx, api, 'Gradient  g', 125, 507, 30, C.muted);
    chapterText(ctx, api, 'Curvature  h', 125, 570, 30, C.muted);
  }
  for (const [i, row] of model.rows.entries()) {
    const x = binX(i);
    const color = row.label ? C.pink : C.blue;
    cellText(ctx, api, 'Job ' + row.bin, x, 348, C.ink, 37);
    cellText(ctx, api, row.label ? '1  missed' : '0  on time', x, 432, color, 33);
    if (showStats) {
      cellText(ctx, api, row.g > 0 ? '+' + row.g : String(row.g), x, 507, color, 34);
      cellText(ctx, api, row.h, x, 570, C.ink, 30);
    }
  }
  if (cut !== null) {
    const x = cutX(cut);
    const crossesLabel = model.rows.some((_, i) => Math.abs(x - binX(i)) < 118);
    const bottom = showStats ? 593 : 454;
    line(ctx, api, cutX(0), 290, cutX(4), 290, C.muted, 2);
    line(ctx, api, x, 290, x, crossesLabel ? 305 : bottom, C.yellow, 5);
    if (crossesLabel) line(ctx, api, x, bottom, x, bottom + 14, C.yellow, 5);
    dot(ctx, api, x, 290, C.yellow, 10);
  }
}
