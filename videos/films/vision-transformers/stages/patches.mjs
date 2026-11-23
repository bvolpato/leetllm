import { cueMotion } from '../construction.mjs';
import { patches } from '../fixtures.mjs';

export function drawPatches(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.cyan, C.yellow, C.pink, C.green];
  if (state.beat === 2) {
    api.focus.target('patch-shapes', () => {
      api.text(ctx, '32 × 32 RGB input', 120, 300, 44, C.ink);
      patches.forEach((_, r) =>
        patches.forEach((__, c) => {
          api.rect(ctx, 150 + c * 114, 365 + r * 114, 110, 110, C.panel, C.cyan, 0);
        }),
      );
      api.text(ctx, '4 × 4 patches', 370, 902, 40, C.cyan, 'center');
      api.text(ctx, '8 × 8 pixels per patch', 850, 352, 40, C.ink);
      api.text(ctx, '8 × 8 × 3 = 192 input values', 850, 485, 47, C.yellow);
      api.text(ctx, '16 rows × 192 input values', 850, 650, 42, C.ink);
      api.text(ctx, '16 rows × 256 hidden coordinates', 850, 788, 42, C.green);
      api.text(
        ctx,
        'Patch count = (height / patch width) × (width / patch width)',
        960,
        1005,
        35,
        C.ink,
        'center',
      );
    });
    return;
  }
  const first = cueMotion(state, 0, 'patch-unfold', 0.35, 0.8);
  const rest = cueMotion(state, 1, 'patch-unfold-rest', 0.05, 0.5);
  api.focus.target('raster-pixels', () => {
    api.text(ctx, '4 × 4 grayscale image', 155, 290, 41, C.ink);
    api.text(ctx, 'One row per patch', 1125, 290, 41, C.ink);
    patches.forEach((row, i) => {
      const progress = i === 0 ? first : api.clamp(3 * rest - (i - 1));
      const color = colors[i];
      row.forEach((value, j) => {
        const x = 155 + ((i % 2) * 2 + (j % 2)) * 119,
          y = 365 + (Math.floor(i / 2) * 2 + Math.floor(j / 2)) * 119;
        const right = 1125 + j * 119,
          down = 365 + i * 119;
        const fraction = api.clamp(progress * 4 - j);
        const reading = fraction > 0 && fraction < 1;
        api.rect(ctx, x, y, 111, 111, reading ? color + '40' : C.panel, color, 0);
        api.text(ctx, value, x + 55, y + 76, 46, color, 'center', 'mono');
        if (reading) {
          api.line(ctx, 672, y + 55, 1080, down + 55, color, 2);
          api.circle(ctx, 672 + 408 * fraction, y + 55 + (down - y) * fraction, 9, color);
        }
        if (fraction === 0) return;
        api.rect(ctx, right, down, 111, 111, C.panel, color, 0);
        api.components.fade(fraction, () =>
          api.text(ctx, value, right + 55, down + 76, 46, color, 'center', 'mono'),
        );
      });
    });
    api.text(ctx, 'Read left to right, then down one row.', 960, 961, 42, C.ink, 'center');
  });
}
export default {
  id: 'patches',
  draw: drawPatches,
  cues: ['patch-unfold', 'patch-unfold-rest', 'patch-rgb'],
};
