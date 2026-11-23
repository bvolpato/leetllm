import { point } from '../geometry.mjs';
import { text, rect, line, arrow } from '../defaults.mjs';
export function drawNestedPaging(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress2, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('nested-paging-mechanism', () => {
      if (beat < 2) {
        const nestedP = api.focus.progress('nested-formula', stage(0, 0.4, 0.85));
        const savings = earned('nested-savings', 1, 0.1, 0.4);
        text(ctx, api, 'SCALE METADATA · 64 weights per block', 190, 285, 31, themeColors.muted);
        for (let i = 0; i < 64; i++)
          rect(
            ctx,
            api,
            190 + (i % 8) * 42,
            380 + Math.floor(i / 8) * 42,
            32,
            32,
            '#79aaff40',
            undefined,
            2,
          );
        arrow(ctx, api, point(570, 530), point(690, 530), themeColors.blue, 4);
        rect(ctx, api, 740, 410, 220, 135, themeColors.panel, themeColors.yellow);
        text(
          ctx,
          api,
          nestedP >= 0.999 ? '8-bit code' : '32-bit scale',
          850,
          490,
          31,
          themeColors.yellow,
          'center',
        );
        text(ctx, api, '1 scale / 64 weights', 710, 615, 28, themeColors.muted);
        if (nestedP > 0) {
          arrow(ctx, api, point(980, 480), point(1070, 480), themeColors.yellow, 4);
          for (let i = 0; i < 256; i++)
            rect(
              ctx,
              api,
              1100 + (i % 16) * 24,
              350 + Math.floor(i / 16) * 24,
              18,
              18,
              nestedP >= (i + 1) / 256 ? '#ffd75e65' : themeColors.panel,
              themeColors.yellow,
              2,
            );
          rect(ctx, api, 1540, 440, 200, 130, themeColors.panel, themeColors.cyan, 8);
          text(ctx, api, 'FP32 parent', 1640, 515, 27, themeColors.cyan, 'center');
          text(ctx, api, '256 scale codes', 1100, 785, 28, themeColors.yellow);
        }
        text(
          ctx,
          api,
          'ordinary: 32 / 64 = 0.5 bits / weight',
          190,
          740,
          35,
          themeColors.yellow,
          'left',
          'mono',
        );
        if (nestedP >= 0.999)
          text(
            ctx,
            api,
            'nested: 8 / 64 + 32 / (64 × 256) = 0.126953125',
            190,
            820,
            32,
            themeColors.cyan,
            'left',
            'mono',
          );
        if (savings)
          text(
            ctx,
            api,
            '65B × (0.5 − 0.126953125) / 8 ≈ 3.0315 GB saved',
            190,
            900,
            31,
            themeColors.green,
            'left',
            'mono',
          );
        if (beat === 1)
          text(
            ctx,
            api,
            'Persist codebook indices, centering offset and parent scales with packed weights.',
            190,
            990,
            27,
            themeColors.muted,
          );
      } else {
        const migrate = api.focus.progress('optimizer-migrate', stage(2, 0.15, 0.55));
        text(
          ctx,
          api,
          'CUDA MANAGED OPTIMIZER STATE · illustrative page residency',
          190,
          285,
          30,
          themeColors.muted,
        );
        line(ctx, api, point(190, 470), point(840, 470), themeColors.blue, 2);
        line(ctx, api, point(1110, 470), point(1760, 470), themeColors.cyan, 2);
        text(ctx, api, 'GPU', 240, 440, 39, themeColors.blue);
        text(ctx, api, 'host', 1160, 440, 39, themeColors.cyan);
        rect(ctx, api, 240, 500, 220, 240, '#79aaff40', themeColors.blue);
        text(ctx, api, 'base', 350, 620, 30, themeColors.blue, 'center');
        rect(ctx, api, 490, 500, 240, 110, '#ef9ac840', themeColors.pink);
        text(ctx, api, 'activations', 610, 570, 28, themeColors.pink, 'center');
        for (let i = 0; i < 4; i++) {
          const progress = api.clamp(migrate * 4 - i, 0, 1);
          const x = api.lerp(550, 1250, progress),
            y = 625 + i * 40;
          rect(ctx, api, x, y, 85, 30, themeColors.yellow, undefined, 3);
          text(ctx, api, `m${i + 1}`, x + 42, y + 25, 24, '#0b0c0e', 'center', 'mono');
        }
        text(
          ctx,
          api,
          'Optimizer pages move. Base weights and activations stay on the GPU.',
          190,
          910,
          31,
          themeColors.ink,
        );
        text(
          ctx,
          api,
          'The optimizer needs those pages back for its next update.',
          190,
          985,
          28,
          themeColors.muted,
        );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'nested-paging',
  draw: drawNestedPaging,
  cues: [
    'nested-paging-1',
    'nested-formula',
    'nested-paging-2',
    'nested-savings',
    'nested-paging-3',
    'optimizer-migrate',
  ],
};
