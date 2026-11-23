import { GiB, cachePayload } from '../arithmetic.mjs';
import { longContextModel } from '../construction.mjs';
import { cellGrid, contextText, equation, footer, modelTarget, valueBar } from '../defaults.mjs';
export function drawCacheShape(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('cache-shape', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      const extent = 160 + 390 * progress,
        depth = 76;
      const slab = (x, color, name) => {
        api.rect(ctx, x, 475, extent, 230, themeColors.panel, color, 3);
        api.line(ctx, x, 475, x + depth, 400, color, 3);
        api.line(ctx, x + extent, 475, x + extent + depth, 400, color, 3);
        api.line(ctx, x + depth, 400, x + extent + depth, 400, color, 3);
        api.line(ctx, x + extent + depth, 400, x + extent + depth, 630, color, 3);
        api.line(ctx, x + extent + depth, 630, x + extent, 705, color, 3);
        for (let i = 1; i < 8; i++)
          api.line(
            ctx,
            x + (i * depth) / 8,
            475 - (i * 75) / 8,
            x + extent + (i * depth) / 8,
            475 - (i * 75) / 8,
            color,
            1,
          );
        contextText(ctx, api, name, x + extent / 2, 340, 46, color);
        contextText(ctx, api, '80 layers', x - 75, 595, 27, color);
      };
      modelTarget(ctx, api, 'cache-shape', () => {
        slab(250, themeColors.blue, 'K');
        slab(1120, themeColors.pink, 'V');
      });
      contextText(ctx, api, '8 KV heads · width 128 · 2 bytes each', 960, 805, 34, themeColors.ink);
      equation(
        ctx,
        api,
        String.raw`2\times80\times8\times128\times131072\times2=40\ \mathrm{GiB}`,
        960,
        915,
        39,
        themeColors.yellow,
      );
      footer(
        ctx,
        api,
        'Hypothetical full-attention layout · logical raw payload per active sequence',
      );
    } else if (currentBeat === 1) {
      const n = m.sequences;
      contextText(ctx, api, 'Independent active requests', 960, 280, 38, themeColors.cyan);
      for (let i = 0; i < 4; i++) {
        contextText(
          ctx,
          api,
          'request ' + (i + 1),
          310,
          390 + i * 105,
          29,
          i < n ? themeColors.blue : themeColors.muted,
        );
        valueBar(ctx, api, 480, 350 + i * 105, 1000, i < n ? 40 : 0, 160, themeColors.blue);
      }
      modelTarget(ctx, api, 'cache-shape', () =>
        contextText(
          ctx,
          api,
          `${n} × 40 = ${n * 40} GiB logical KV`,
          960,
          840,
          45,
          themeColors.yellow,
        ),
      );
      valueBar(ctx, api, 480, 900, 1000, m.weightGiB, 160, themeColors.pink, 42);
      contextText(ctx, api, '≈130 GiB shared weight reference', 960, 980, 29, themeColors.pink);
    } else {
      const heads = m.heads,
        bytes =
          cachePayload({
            layers: 80,
            heads,
            width: 128,
            tokens: 131072,
          }) / GiB;
      contextText(
        ctx,
        api,
        'Same query heads · change the stored KV heads',
        960,
        280,
        37,
        themeColors.cyan,
      );
      modelTarget(ctx, api, 'cache-shape', () =>
        cellGrid(ctx, api, 360, 380, 8, 8, 54, (r, c) =>
          r * 8 + c < heads ? themeColors.blue : themeColors.panel,
        ),
      );
      contextText(ctx, api, heads + ' KV heads', 1270, 485, 53, themeColors.blue);
      contextText(
        ctx,
        api,
        bytes.toFixed(0) + ' GiB per sequence',
        1270,
        640,
        53,
        themeColors.yellow,
      );
      equation(
        ctx,
        api,
        String.raw`\mathrm{KV\ bytes}\propto H_{kv}`,
        1270,
        805,
        46,
        themeColors.ink,
      );
      footer(
        ctx,
        api,
        '64 query heads stay fixed · architecture conversion needs training and evaluation',
      );
    }
  }
}
export default {
  id: 'cache-shape',
  draw: drawCacheShape,
  cues: ['cache-shape-0', 'cache-shape-1', 'cache-shape-2'],
};
