import {
  chapterCueProgress,
  chapterText,
  constructionFocus,
  ownerColor,
  unknownValues,
  valueGrid,
} from '../defaults.mjs';
export function drawResidualBlock(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'residual-block', () => {
    if (currentBeat === 0) {
      chapterText(ctx, api, 'same input state x', 370, 390, 36, themeColors.blue, 'center');
      chapterText(ctx, api, 'learned change F(x)', 1030, 390, 36, themeColors.cyan, 'center');
      chapterText(ctx, api, 'sum F(x) + x', 1580, 390, 36, themeColors.green, 'center');
      const x = valueGrid(
        ctx,
        api,
        [
          [0.2, 0.5],
          [0.7, 0.1],
        ],
        270,
        470,
        95,
        {
          kind: 'image',
        },
      );
      const saved = chapterCueProgress(ctx, api, 'residual-save');
      const branch = valueGrid(
        ctx,
        api,
        [
          [0.1, -0.1],
          [0, 0.2],
        ],
        910,
        470,
        95,
        {
          kind: 'gradient',
          show: Math.floor(saved * 4),
        },
      );
      const result = valueGrid(
        ctx,
        api,
        saved === 1
          ? [
              [0.3, 0.4],
              [0.7, 0.3],
            ]
          : unknownValues(ctx, api, 2),
        1460,
        470,
        95,
        {
          kind: 'values',
        },
      );
      if (saved > 0) {
        api.arrow(ctx, 510, 560, 870, 560, themeColors.cyan, 4);
        api.arrow(ctx, 1150, 560, 1420, 560, themeColors.cyan, 4);
      }
      api.line(ctx, 370, 710, 370, 810, themeColors.blue, 4);
      api.line(ctx, 370, 810, 1560, 810, themeColors.blue, 4);
      api.arrow(ctx, 1560, 810, 1560, 710, themeColors.blue, 4);
      chapterText(
        ctx,
        api,
        'identity retains the original owners',
        960,
        930,
        31,
        themeColors.blue,
        'center',
      );
      chapterText(
        ctx,
        api,
        'illustrative activations · no trained performance claim',
        960,
        1010,
        27,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const q = chapterCueProgress(ctx, api, 'residual-convs'),
        n = ['block-conv-0', 'block-bn-0', 'block-relu', 'block-conv-1', 'block-bn-1'].filter(
          (id) => chapterCueProgress(ctx, api, id) === 1,
        ).length,
        add = chapterCueProgress(ctx, api, 'residual-add');
      chapterText(ctx, api, 'x: 1 × 16 × 28 × 28', 300, 325, 30, themeColors.blue);
      const ops = ['Conv 3×3', 'BN', 'ReLU', 'Conv 3×3', 'BN'];
      for (let i = 0; i < 5; i++) {
        const x = 295 + i * 270;
        api.rect(
          ctx,
          x,
          460,
          210,
          110,
          themeColors.panel,
          i < n ? themeColors.cyan : themeColors.muted,
          2,
          5,
        );
        chapterText(
          ctx,
          api,
          i < n ? ops[i] : '?',
          x + 105,
          525,
          29,
          i < n ? themeColors.cyan : themeColors.muted,
          'center',
        );
        if (i > 0) api.arrow(ctx, x - 48, 515, x - 13, 515, themeColors.muted, 2);
      }
      api.line(ctx, 220, 515, 220, 760, themeColors.blue, 4);
      api.line(ctx, 220, 760, 1700, 760, themeColors.blue, 4);
      if (add > 0) {
        api.arrow(ctx, 1700, 760, 1700, 590, themeColors.blue, 4);
        chapterText(ctx, api, '+ x', 1700, 525, 39, themeColors.green, 'center');
        chapterText(ctx, api, 'then ReLU', 1700, 365, 31, themeColors.green, 'center');
      }
      if (chapterCueProgress(ctx, api, 'projection-shape') > 0)
        chapterText(
          ctx,
          api,
          'shape mismatch → transform shortcut before adding',
          960,
          940,
          32,
          themeColors.yellow,
          'center',
        );
      chapterText(
        ctx,
        api,
        'padding 1 · 16 channels retained',
        960,
        1020,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      chapterText(
        ctx,
        api,
        'BN reduces N, H, W separately for each channel',
        960,
        270,
        31,
        themeColors.cyan,
        'center',
      );
      for (let k = 0; k < 3; k++) {
        const x = 270 + k * 520;
        valueGrid(
          ctx,
          api,
          [
            [1, 2],
            [3, 4],
          ],
          x,
          370,
          95,
          {
            font: 30,
          },
        );
        chapterText(ctx, api, 'channel ' + k, x + 100, 315, 29, ownerColor(ctx, api, k), 'center');
        if (chapterCueProgress(ctx, api, 'bn-owners') > 0) {
          api.arrow(ctx, x + 100, 610, x + 100, 680, ownerColor(ctx, api, k), 4);
          chapterText(
            ctx,
            api,
            'μC , varianceC',
            x + 100,
            760,
            31,
            ownerColor(ctx, api, k),
            'center',
          );
        }
        if (chapterCueProgress(ctx, api, 'bn-state') > 0) {
          chapterText(
            ctx,
            api,
            'train: update running state',
            x + 100,
            880,
            26,
            themeColors.blue,
            'center',
          );
          chapterText(
            ctx,
            api,
            'eval: reuse running state',
            x + 100,
            950,
            26,
            themeColors.green,
            'center',
          );
        }
      }
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'residual-block',
  draw: drawResidualBlock,
  cues: [
    'residual-block-b1',
    'residual-save',
    'residual-block-b2',
    'residual-convs',
    'residual-add',
    'projection-shape',
    'block-conv-0',
    'block-bn-0',
    'block-relu',
    'block-conv-1',
    'block-bn-1',
    'residual-block-b3',
    'bn-owners',
    'bn-state',
  ],
};
