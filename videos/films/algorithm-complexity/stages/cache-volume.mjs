import { q } from '../construction.mjs';
import { cacheVolumeSnapshot } from '../model.mjs';
import { arrow, box, focus, math, text } from '../defaults.mjs';
export function drawCacheVolume(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    if (beat === 0) {
      const progress = q(state, 'cache-token', 0),
        count = Math.floor(256 * progress);
      [
        ['Keys', themeColors.blue, 180],
        ['Values', themeColors.cyan, 780],
      ].forEach(([name, color, x]) => {
        text(ctx, api, themeColors, name, x + 190, 290, 38, color);
        focus(ctx, api, themeColors, 'cache-token-slabs', () => {
          for (let row = 0; row < 32; row++)
            for (let col = 0; col < 8; col++)
              api.rect(
                ctx,
                x + col * 46,
                365 + row * 12,
                40,
                9,
                row * 8 + col < count ? color : themeColors.panel,
                themeColors.bg,
                1,
              );
        });
        text(ctx, api, themeColors, '8 KV heads', x + 180, 835, 32, color);
        text(ctx, api, themeColors, '32 layers', x + 180, 900, 32, themeColors.muted);
      });
      focus(ctx, api, themeColors, 'cache-token-bytes', () => {
        math(
          ctx,
          api,
          themeColors,
          '2\\times32\\times8\\times128\\times2',
          1460,
          390,
          37,
          themeColors.ink,
        );
        text(
          ctx,
          api,
          themeColors,
          (count * 2 * 128 * 2).toLocaleString() + ' bytes',
          1460,
          560,
          44,
          themeColors.yellow,
        );
        if (count === 256 && q(state, 'cache-token-kibi', 0) === 1)
          text(ctx, api, themeColors, '128 KiB / token', 1460, 700, 47, themeColors.green);
      });
      text(
        ctx,
        api,
        themeColors,
        'Each cell stores 128 coordinates × 2 bytes',
        960,
        1010,
        31,
        themeColors.muted,
      );
    } else if (beat === 1) {
      text(
        ctx,
        api,
        themeColors,
        'Four query heads share each key/value head',
        960,
        280,
        39,
        themeColors.ink,
      );
      for (let h = 0; h < 8; h++) {
        const x = 170 + h * 205;
        focus(ctx, api, themeColors, 'gqa-head-groups', () => {
          for (let j = 0; j < 4; j++)
            box(
              ctx,
              api,
              themeColors,
              'Q' + (h * 4 + j),
              x,
              360 + j * 100,
              150,
              70,
              j === 0 ? themeColors.blue : themeColors.muted,
              30,
            );
          arrow(ctx, api, x + 75, 745, x + 75, 805, themeColors.cyan, 4);
          box(ctx, api, themeColors, 'KV' + h, x, 835, 150, 80, themeColors.cyan, 32);
        });
      }
      text(
        ctx,
        api,
        themeColors,
        'Cache bytes use 8 KV heads · every query head still computes its own scores',
        960,
        1010,
        30,
        themeColors.yellow,
      );
    } else {
      const v = cacheVolumeSnapshot(state);
      text(
        ctx,
        api,
        themeColors,
        'Same 16 streams · same architecture and dtype',
        960,
        280,
        36,
        themeColors.ink,
      );
      focus(ctx, api, themeColors, 'cache-volume-growth', () => {
        text(
          ctx,
          api,
          themeColors,
          v.length.toLocaleString() + ' positions / stream',
          960,
          390,
          43,
          themeColors.cyan,
        );
        api.rect(ctx, 240, 520, (1400 * v.gib) / 8, 110, themeColors.cyan);
        text(
          ctx,
          api,
          themeColors,
          v.gib.toFixed(2) + ' GiB raw KV',
          960,
          700,
          48,
          themeColors.cyan,
        );
      });
      focus(ctx, api, themeColors, 'cache-versus-square', () => {
        math(
          ctx,
          api,
          themeColors,
          `\\text{score cells}=${v.length}^{2}=${v.scoreCells.toLocaleString()}`,
          960,
          855,
          43,
          themeColors.yellow,
        );
        if (q(state, 'cache-endpoint-comparison', 2) === 1)
          text(
            ctx,
            api,
            themeColors,
            '4× context → 4× raw KV · 16× dense prefill score cells',
            960,
            950,
            35,
            themeColors.yellow,
          );
      });
      text(
        ctx,
        api,
        themeColors,
        'Raw values only · excludes weights, workspace, metadata, allocation waste and sharing',
        960,
        1020,
        28,
        themeColors.muted,
      );
    }
  }
}
export default {
  id: 'cache-volume',
  draw: drawCacheVolume,
  cues: [
    'cache-token',
    'cache-token-kibi',
    'gqa-sharing',
    'cache-grow',
    'cache-endpoint-comparison',
  ],
};
