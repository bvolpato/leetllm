import {
  chapterCueProgress,
  chapterText,
  constructionFocus,
  ownerColor,
  valueGrid,
} from '../defaults.mjs';
export function drawArchitectureChoice(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'architecture-choice', () => {
    const studies = [
      ['ViT', 'large-scale pretraining'],
      ['DeiT', 'ImageNet + distillation'],
      ['ConvNeXt', 'modernized CNN recipe'],
    ];
    studies.forEach(([name, scope], i) => {
      const y = 350 + i * 180;
      chapterText(ctx, api, name, 300, y, 40, ownerColor(ctx, api, i));
      chapterText(ctx, api, scope, 620, y, currentBeat === 0 ? 31 : 24, themeColors.muted);
      api.line(ctx, 285, y + 35, currentBeat === 0 ? 1670 : 950, y + 35, themeColors.muted, 1);
    });
    if (currentBeat === 1) {
      const q = chapterCueProgress(ctx, api, 'inspect-slices');
      chapterText(
        ctx,
        api,
        'Same held-out photos',
        1210,
        300,
        32,
        themeColors.green,
        'center',
      );
      const cases = [
        [
          'tiny mark',
          [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
          ],
        ],
        [
          'border mark',
          [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        ],
      ];
      cases.forEach(([name, a], i) => {
        const x = 1110 + i * 330;
        valueGrid(ctx, api, a, x, 400, 85, {
          kind: 'image',
          show: q > 0 ? 9 : 0,
        });
        chapterText(ctx, api, name, x + 130, 760, 29, themeColors.yellow, 'center');
      });
      chapterText(
        ctx,
        api,
        'resize · padding · pooling · inference cost',
        1225,
        945,
        28,
        themeColors.cyan,
        'center',
      );
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'architecture-choice',
  draw: drawArchitectureChoice,
  cues: ['architecture-choice-b1', 'architecture-choice-b2', 'inspect-slices'],
};
