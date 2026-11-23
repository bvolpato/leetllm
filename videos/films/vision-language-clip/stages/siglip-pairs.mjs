import { pairLogisticLoss } from '../arithmetic.mjs';
import { spokenProgress } from '../construction.mjs';
import {
  drawClipEquation,
  drawClipRectangle,
  drawClipText,
  rackPhoto,
  withClipFocus,
} from '../defaults.mjs';
export function drawSiglipPairs(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    if (currentBeat < 2) {
      drawClipText(ctx, api, 'Each labeled pair owns its logistic penalty', 960, 280, 37);
      const inputs = [3.2, -2.1, 0.4],
        positive = [true, false, false],
        q = clauseProgress('siglip-values', 1);
      inputs.forEach((z, i) => {
        const x = 380 + i * 580;
        drawClipText(
          ctx,
          api,
          positive[i] ? 'matched pair +1' : 'mismatched pair -1',
          x,
          380,
          30,
          i ? themeColors.pink : themeColors.green,
        );
        const point = z * (currentBeat === 0 ? clauseProgress('siglip-sign', 0) : 1);
        drawClipEquation(ctx, api, 'z=' + point.toFixed(1), x, 525, 45, themeColors.cyan);
        const loss = pairLogisticLoss(point, positive[i]);
        drawClipRectangle(
          ctx,
          api,
          x - 110,
          830 - loss * 280,
          220,
          loss * 280,
          i ? themeColors.pink : themeColors.green,
        );
        withClipFocus(ctx, api, 'pair-losses', () =>
          drawClipText(
            ctx,
            api,
            currentBeat === 1 && q > 0.95
              ? 'loss ' + loss.toFixed(3)
              : 'one pair · no row denominator',
            x,
            965,
            currentBeat === 1 ? 34 : 24,
            themeColors.yellow,
          ),
        );
      });
    } else if (currentBeat === 2) {
      const q = clauseProgress('siglip-batch', 2),
        n = Math.floor(4 * q + 1e-9);
      drawClipText(ctx, api, 'Four zero-logit pair terms · N=2', 960, 290, 38);
      for (let i = 0; i < 4; i++) {
        drawClipRectangle(
          ctx,
          api,
          430 + (i % 2) * 320,
          430 + Math.floor(i / 2) * 170,
          270,
          120,
          i < n ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
        drawClipText(
          ctx,
          api,
          i < n ? 'log 2' : '?',
          565 + (i % 2) * 320,
          510 + Math.floor(i / 2) * 170,
          36,
          themeColors.bg,
        );
      }
      withClipFocus(ctx, api, 'pair-losses', () => {
        drawClipEquation(
          ctx,
          api,
          clauseProgress('siglip-batch-result', 2) === 1
            ? '\\mathcal L=4\\log 2/2=1.386'
            : '\\mathcal L=\\sum_{ij}\\ell_{ij}/N',
          1450,
          525,
          40,
        );
        drawClipText(
          ctx,
          api,
          clauseProgress('siglip-pair-mean', 2) === 1
            ? 'pair mean=.693 · half the gradient scale'
            : 'paper denominator is batch N',
          1450,
          720,
          29,
          themeColors.yellow,
        );
      });
    } else {
      rackPhoto(ctx, api, 250, 380, 520, 410, {
        grid: 8,
      });
      const q = clauseProgress('siglip-recipe', 3);
      withClipFocus(ctx, api, 'pair-losses', () => {
        ['caption learning', 'self-distillation', 'masked prediction', 'online curation'].forEach(
          (v, i) => {
            if (q > i / 4)
              drawClipText(
                ctx,
                api,
                v,
                1330,
                430 + i * 125,
                33,
                [themeColors.cyan, themeColors.blue, themeColors.pink, themeColors.yellow][i],
              );
          },
        );
        drawClipText(
          ctx,
          api,
          'NaFlex varies compatible resolution/aspect ratio; validate the actual checkpoint',
          960,
          1010,
          29,
          themeColors.muted,
        );
      });
    }
  }
}
export default {
  id: 'siglip-pairs',
  draw: drawSiglipPairs,
  cues: [
    'siglip-sign',
    'siglip-values',
    'siglip-batch',
    'siglip-batch-result',
    'siglip-pair-mean',
    'siglip-recipe',
  ],
};
