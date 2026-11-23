import { point } from '../geometry.mjs';
import { text, rect, arrow } from '../defaults.mjs';
export function drawServingContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('serving-contract-mechanism', () => {
      if (beat < 2) {
        const storage = earned('serving-storage', 1, 0.1, 0.5),
          shared = earned('serving-shared', 1, 0.5, 0.7),
          ratio = earned('serving-ratio', 1, 0.7, 0.85);
        text(ctx, api, 'Checkpoint files on disk  ·  decimal GB', 190, 285, 29, themeColors.muted);
        for (let i = 0; i < 50; i++) {
          rect(
            ctx,
            api,
            190 + (i % 10) * 66,
            390 + Math.floor(i / 10) * 68,
            50,
            48,
            '#79aaff40',
            themeColors.blue,
            3,
          );
          rect(
            ctx,
            api,
            1110 + (i % 10) * 56,
            520 + Math.floor(i / 10) * 44,
            38,
            25,
            '#ffd75e40',
            themeColors.yellow,
            3,
          );
        }
        rect(ctx, api, 1110, 390, 540, 80, '#79aaff40', themeColors.blue);
        text(ctx, api, 'one 14 GB base', 1380, 442, 31, themeColors.blue, 'center');
        text(ctx, api, '50 complete 14 GB models', 190, 800, 32, themeColors.blue);
        text(ctx, api, '50 adapters × 0.128 GB', 1110, 800, 30, themeColors.yellow);
        if (storage) text(ctx, api, '700 GB', 190, 905, 46, themeColors.blue, 'left', 'mono');
        if (shared)
          text(ctx, api, '14 + 6.4 = 20.4 GB', 1110, 905, 38, themeColors.green, 'left', 'mono');
        if (ratio)
          text(
            ctx,
            api,
            '700 / 20.4 ≈ 34.3× as much disk space for the merged copies',
            190,
            1000,
            35,
            themeColors.ink,
          );
      } else {
        const segmented = api.focus.progress('serving-segments', stage(2, 0.05, 0.4));
        const pool = api.focus.progress('serving-pool', stage(2, 0.45, 0.8));
        text(
          ctx,
          api,
          'HETEROGENEOUS REQUESTS · one shared base product',
          190,
          280,
          30,
          themeColors.muted,
        );
        const requestColors = [
          themeColors.yellow,
          themeColors.green,
          themeColors.yellow,
          themeColors.pink,
        ];
        const xValues = [
          [2, 1],
          [1, 2],
          [3, 1],
          [1, 1],
        ];
        for (let i = 0; i < 4; i++) {
          const y = 400 + i * 120;
          text(
            ctx,
            api,
            `X${i} = [${xValues[i].join(', ')}]`,
            190,
            y,
            30,
            themeColors.cyan,
            'left',
            'mono',
          );
          arrow(ctx, api, point(500, y - 12), point(650, y - 12), themeColors.blue, 3);
          rect(ctx, api, 690, y - 50, 310, 78, themeColors.panel, themeColors.blue);
          text(ctx, api, 'XᵢW₀ᵀ', 845, y, 31, themeColors.blue, 'center', 'mono');
          if (segmented >= (i + 1) / 4) {
            text(ctx, api, '+ sᵢXᵢAᵢᵀBᵢᵀ', 1050, y, 30, requestColors[i], 'left', 'mono');
            text(ctx, api, `adapter ${[1, 2, 1, 3][i]}`, 1500, y, 29, requestColors[i]);
          }
        }
        if (pool > 0) {
          text(ctx, api, 'S-LoRA: common engine-managed pool', 190, 930, 30, themeColors.muted);
          for (let i = 0; i < 12; i++)
            rect(
              ctx,
              api,
              910 + i * 65,
              895,
              48,
              52,
              i % 3 === 0 ? '#79aaff50' : '#ffd75e50',
              i % 3 === 0 ? themeColors.blue : themeColors.yellow,
              3,
            );
          text(
            ctx,
            api,
            'KV and adapter pages; engine admission still depends on live memory.',
            190,
            1010,
            28,
            themeColors.muted,
          );
        }
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'serving-contract',
  draw: drawServingContract,
  cues: [
    'serving-contract-1',
    'serving-contract-2',
    'serving-storage',
    'serving-shared',
    'serving-ratio',
    'serving-contract-3',
    'serving-segments',
    'serving-pool',
  ],
};
