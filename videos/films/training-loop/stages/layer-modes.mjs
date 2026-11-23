import { loopBound } from '../arithmetic.mjs';
import { loopCueStarted } from '../construction.mjs';
import { arrow, box, constructionText, footer, heading, matrix } from '../defaults.mjs';
export function drawLayerModes(ctx, scene, state, api) {
  api.focus.target('layer-modes-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    const cueStarted = (name, fallback = progress > 0.4) =>
      loopCueStarted(state.cues, name, fallback);
    {
      if (currentBeat === 0) {
        const evalMode = cueStarted('loop-dropout-eval', progress > 0.65),
          input = [1, 2, 3, 4],
          output = evalMode ? input : [2, 0, 6, 0];
        heading(ctx, api, 'Supplied Dropout mask [1,0,1,0] · p=½');
        matrix(ctx, api, [input], 230, 405, themeColors.blue, 140);
        arrow(ctx, api, 900, 475, 1040, 475);
        matrix(ctx, api, [output], 1120, 405, evalMode ? themeColors.green : themeColors.pink, 140);
        constructionText(
          ctx,
          api,
          evalMode ? 'eval: identity' : 'train: surviving activations ×2',
          960,
          770,
          36,
          evalMode ? themeColors.green : themeColors.pink,
          'center',
        );
        footer(
          ctx,
          api,
          'Two training calls can draw the same mask. Check the layer’s training flag.',
        );
      } else {
        heading(ctx, api, 'Layer mode and autograd recording are independent controls');
        const rows = [
          ['Dropout', 'train: sample and rescale', 'eval: identity'],
          ['BatchNorm tracking', 'train: batch + running update', 'eval: running buffers'],
          ['LayerNorm', 'same trailing-dimension rule', 'same trailing-dimension rule'],
        ];
        rows.forEach((row, i) => {
          const y = 400 + i * 150;
          constructionText(ctx, api, row[0], 170, y + 25, 29, themeColors.muted);
          box(ctx, api, row[1], 550, y - 20, 570, 100, themeColors.blue, 27);
          box(ctx, api, row[2], 1200, y - 20, 570, 100, themeColors.green, 27);
        });
        footer(
          ctx,
          api,
          currentBeat === 2
            ? 'Ordinary held-out loss uses eval + no-grad; attribution can keep eval + derivatives'
            : 'With tracking enabled, BatchNorm updates its running statistics in train mode, even inside no-grad.',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'layer-modes',
  draw: drawLayerModes,
  cues: [
    'layer-modes-beat-0',
    'loop-dropout-train',
    'loop-dropout-eval',
    'layer-modes-beat-1',
    'layer-modes-beat-2',
  ],
};
