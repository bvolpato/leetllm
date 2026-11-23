import { built, clamped, cueAmount } from '../arithmetic.mjs';
import { center, noise, pixels } from '../fixtures.mjs';
import { recon } from '../model.mjs';
import { arrow, chapterGrid, chapterText, note, point } from '../defaults.mjs';
export function drawSpatialBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-spatial-budget-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-spatial-budget-' + id);
  {
    if (currentBeat === 0) {
      const tile = (x, y, n, size, color) => {
        for (let i = 0; i < n * n; i++)
          api.rect(
            ctx,
            x + (i % n) * size,
            y + Math.floor(i / n) * size,
            size - 3,
            size - 3,
            themeColors.panel,
            color,
            1,
            1,
          );
      };
      tile(215, 354, 8, 43, themeColors.cyan);
      tile(1258, 354, 8, 43, themeColors.muted);
      api.rect(ctx, 1258 + 3 * 43, 354 + 3 * 43, 40, 40, themeColors.green, undefined, 1);
      chapterText(ctx, api, '512 × 512 × 3', 400, 300, 37, themeColors.cyan, 'center');
      chapterText(ctx, api, '64 × 64 × 4', 1430, 300, 37, themeColors.green, 'center');
      arrow(ctx, api, 680, 580, 1160, 580, themeColors.yellow);
      chapterText(ctx, api, 'stride 8 per axis', 930, 510, 32, themeColors.yellow, 'center');
      chapterText(ctx, api, '8 × 8 pixel positions', 387, 750, 31, themeColors.cyan, 'center');
      chapterText(ctx, api, '1 latent position', 1430, 750, 31, themeColors.green, 'center');
      chapterText(
        ctx,
        api,
        ready('positions') ? '262,144 / 4,096 = 64× positions' : 'positions: divide both axes by 8',
        960,
        820,
        34,
        themeColors.ink,
        'center',
      );
      chapterText(
        ctx,
        api,
        ready('scalars') ? '786,432 / 16,384 = 48× scalars' : 'then account for channel width',
        960,
        900,
        34,
        themeColors.green,
        'center',
      );
      note(ctx, api, 'Raw storage = number of scalar values × bytes per value');
    } else if (currentBeat === 1) {
      const xs = [250, 720, 1200, 1640];
      chapterText(
        ctx,
        api,
        'Generate a latent, then decode it',
        960,
        300,
        36,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 3; i++) {
        const x = xs[i];
        if (i === 0) {
          for (const n of noise)
            point(ctx, api, x + n.x * 45, 590 + n.y * 45, themeColors.muted, 3);
          chapterText(ctx, api, 'noise', x, 790, 33, themeColors.muted, 'center');
        }
        if (i === 1) {
          const a = clamped(q * 2);
          for (const n of noise)
            point(
              ctx,
              api,
              x + n.x * (45 - 20 * a),
              590 + n.y * (45 - 15 * a),
              themeColors.cyan,
              3,
            );
          chapterText(ctx, api, 'denoiser', x, 790, 33, themeColors.cyan, 'center');
        }
        if (i === 2) {
          for (let k = 0; k < 16; k++) {
            const xx = x - 100 + (k % 4) * 50,
              yy = 485 + Math.floor(k / 4) * 50;
            api.rect(ctx, xx, yy, 38, 38, themeColors.panel, themeColors.yellow, 2, 2);
          }
          chapterText(ctx, api, 'latent grid', x, 790, 31, themeColors.yellow, 'center');
        }
        arrow(ctx, api, x + 135, 590, xs[i + 1] - 130, 590, themeColors.green);
      }
      chapterGrid(ctx, api, recon, 1530, 480, 45);
      chapterText(ctx, api, 'decoded pixels', 1640, 790, 31, themeColors.green, 'center');
      note(ctx, api, 'The diffusion model learns the distribution of compressed training images.');
    } else {
      for (const [left, row] of [
        [231, pixels],
        [1241, recon],
      ]) {
        const cells = chapterGrid(ctx, api, row, left, 345, 86, center);
        for (const i of center) {
          const cell = cells[i];
          chapterText(
            ctx,
            api,
            row[i].toFixed(2),
            cell.x + cell.width / 2,
            cell.y + cell.height / 2 + 10,
            30,
            themeColors.bg,
            'center',
          );
        }
      }
      chapterText(ctx, api, 'detail to preserve', 400, 300, 34, themeColors.cyan, 'center');
      chapterText(ctx, api, 'frozen decoder output', 1450, 300, 34, themeColors.green, 'center');
      chapterText(
        ctx,
        api,
        'Four different brightnesses become one.',
        960,
        870,
        36,
        themeColors.yellow,
        'center',
      );
      note(ctx, api, 'Compare the original pixels with the output of the same decoder.');
    }
  }
}
export default {
  id: 'spatial-budget',
  draw: drawSpatialBudget,
  cues: [
    'vae-spatial-budget-0-build',
    'vae-spatial-budget-positions',
    'vae-spatial-budget-scalars',
    'vae-spatial-budget-1-build',
    'vae-spatial-budget-2-build',
  ],
};
