import { convolutionShape, parameterCount } from '../arithmetic.mjs';
import { cueClock } from '../footprint.mjs';
import {
  cellCenter,
  chapterCueProgress,
  chapterOutline,
  chapterText,
  constructionFocus,
  valueGrid,
  withOpacity,
  zeros,
} from '../defaults.mjs';
export function drawSharingBudget(ctx, scene, state, api) {
  ctx.save();

  const pixels = 224 * 224 * 3,
    side = convolutionShape(224, 3);
  const params = parameterCount(3, 16, 3);
  const number = (v) => v.toLocaleString('en-US');
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'sharing-budget', () => {
    const dense = chapterCueProgress(ctx, api, 'dense-budget'),
      shared = chapterCueProgress(ctx, api, 'conv-budget'),
      privateP = chapterCueProgress(ctx, api, 'private-banks'),
      tie = chapterCueProgress(ctx, api, 'retie-banks');
    const bank = (x, y, opacity = 1) =>
      withOpacity(ctx, api, opacity, () => {
        for (let d = 2; d >= 0; d--) {
          api.rect(
            ctx,
            x + d * 13,
            y - d * 13,
            110,
            110,
            themeColors.panel,
            themeColors.cyan,
            2,
            4,
          );
          if (d === 0)
            for (let i = 1; i < 3; i++) {
              api.line(ctx, x + (i * 110) / 3, y, x + (i * 110) / 3, y + 110, themeColors.muted, 1);
              api.line(ctx, x, y + (i * 110) / 3, x + 110, y + (i * 110) / 3, themeColors.muted, 1);
            }
        }
      });
    if (currentBeat === 0) {
      valueGrid(
        ctx,
        api,
        Array.from(
          {
            length: 6,
          },
          (_, r) =>
            Array.from(
              {
                length: 6,
              },
              (_, c) => ((r + c) % 3) / 2,
            ),
        ),
        210,
        365,
        62,
        {
          kind: 'image',
          font: 20,
        },
      );
      chapterText(ctx, api, '224 × 224 × 3 · schematic', 420, 825, 36, themeColors.blue, 'center');
      chapterText(
        ctx,
        api,
        number(pixels) + ' input values',
        420,
        895,
        29,
        themeColors.muted,
        'center',
      );
      for (let i = 0; i < 8; i++) {
        api.line(ctx, 620, 420 + i * 37, 920, 380 + i * 48, themeColors.muted, 1);
        api.rect(ctx, 925, 365 + i * 48, 210, 30, themeColors.panel, themeColors.blue, 1, 3);
      }
      chapterText(ctx, api, '256 dense outputs', 1030, 840, 30, themeColors.blue, 'center');
      if (dense === 1)
        chapterText(
          ctx,
          api,
          number((pixels + 1) * 256) + ' parameters',
          1030,
          920,
          32,
          themeColors.blue,
          'center',
        );
      bank(1490, 420);
      chapterText(ctx, api, '16 filters · RGB stacks', 1540, 670, 30, themeColors.cyan, 'center');
      if (shared === 1) {
        chapterText(ctx, api, '16 × (3 × 3 × 3 + 1)', 1540, 840, 30, themeColors.cyan, 'center');
        chapterText(ctx, api, params + ' parameters', 1540, 920, 37, themeColors.green, 'center');
      }
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'SAME OUTPUT GEOMETRY: 16 × 222 × 222',
        960,
        300,
        34,
        themeColors.blue,
        'center',
      );
      const count = Math.floor(privateP * 9);
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3),
          col = i % 3,
          x = 260 + col * 185,
          y = 400 + row * 145;
        chapterOutline(ctx, api, x, y, 130, 92, themeColors.blue, 2);
        if (tie > 0) api.line(ctx, x + 130, y + 46, 1340, 605, themeColors.muted, 1);
        if (i < count) {
          const tx = api.lerp(x + 10, 1370, tie),
            ty = api.lerp(y + 10, 550, tie);
          ctx.save();
          ctx.translate(tx, ty);
          ctx.scale(0.55 + 0.45 * tie, 0.55 + 0.45 * tie);
          bank(0, 0, 1 - tie * 0.8);
          ctx.restore();
        }
      }
      bank(1370, 550);
      chapterText(ctx, api, 'each bank: 448', 1460, 790, 32, themeColors.cyan, 'center');
      if (privateP === 1 && tie < 1) {
        chapterText(
          ctx,
          api,
          number(side * side) + ' private banks',
          1100,
          395,
          34,
          themeColors.pink,
          'center',
        );
        chapterText(
          ctx,
          api,
          number(side * side * params) + ' parameters',
          1100,
          870,
          36,
          themeColors.pink,
          'center',
        );
      }
      if (tie === 1) {
        chapterText(ctx, api, 'ONE shared owner', 1460, 395, 35, themeColors.green, 'center');
        if (chapterCueProgress(ctx, api, 'retie-count') === 1)
          chapterText(ctx, api, '448 parameters', 1460, 890, 39, themeColors.green, 'center');
      }
      chapterText(
        ctx,
        api,
        'Shown: nine representative positions of 49,284',
        600,
        1000,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      const offset = cueClock(scene, state, api)('local-shift') >= 0.5 ? 1 : 0;
      const cells = Array.from({ length: 9 }, (_, i) => [
        1 + Math.floor(i / 3),
        1 + (i % 3) + offset,
      ]);
      const im = valueGrid(ctx, api, zeros(ctx, api, 5), 300, 385, 90, {
        selected: cells,
        show: 0,
      });
      const dest = {
        x: 1430,
        y: 500,
        width: 170,
        height: 140,
      };
      api.rect(
        ctx,
        dest.x,
        dest.y,
        dest.width,
        dest.height,
        themeColors.panel,
        themeColors.green,
        3,
        5,
      );
      chapterText(ctx, api, 'one output', 1515, 585, 30, themeColors.green, 'center');
      for (const [row, col] of cells) {
        const a = cellCenter(ctx, api, im[row * 5 + col]);
        api.line(ctx, a.x, a.y, 1180, 540, themeColors.muted, 1);
      }
      bank(1050, 350);
      api.arrow(ctx, 1210, 550, 1410, 570, themeColors.cyan, 4);
      chapterText(
        ctx,
        api,
        'Nine pixels per input channel',
        960,
        890,
        32,
        themeColors.yellow,
        'center',
      );
      chapterText(
        ctx,
        api,
        'One filter bank for both windows',
        960,
        970,
        31,
        themeColors.cyan,
        'center',
      );
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'sharing-budget',
  draw: drawSharingBudget,
  cues: [
    'sharing-budget-b1',
    'dense-budget',
    'conv-budget',
    'sharing-budget-b2',
    'private-banks',
    'retie-banks',
    'retie-count',
    'sharing-budget-b3',
    'local-shift',
  ],
};
