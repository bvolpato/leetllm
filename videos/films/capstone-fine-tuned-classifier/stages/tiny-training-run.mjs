import { clamp01, format } from '../arithmetic.mjs';
import { TRAINING_TRACE } from '../fixtures/training-trace.mjs';
import { classifierCueProgress, trainingFrame } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierMatrix,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawTinyTrainingRun(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id),
    done = (id) => cueProgress(id) >= 1;
  api.focus.target('tiny-training', () => {
    const progress = currentBeat === 0 ? 0 : currentBeat === 1 ? cueProgress('tiny-update') : 1,
      f = trainingFrame(progress),
      tokens = ['show', 'access', 'policy', 'PAD', 'PAD', 'PAD'];
    drawExpandedClassifierText(
      ctx,
      api,
      'Actual CPU run · seed 7 · 8-D embeddings · Adam 0.05',
      960,
      280,
      31,
      themeColors.yellow,
      'center',
    );
    tokens.forEach((word, i) => {
      const yy = 350 + i * 76,
        color =
          i < 3 ? [themeColors.blue, themeColors.cyan, themeColors.pink][i] : themeColors.muted;
      drawExpandedClassifierText(ctx, api, word, 180, yy + 42, 27, color);
      drawExpandedClassifierMatrix(ctx, api, [f.embeddingRows[i]], 360, yy, {
        cell: 90,
        height: 64,
        color,
        size: 23,
      });
      drawExpandedClassifierText(ctx, api, i < 3 ? 'mask 1' : 'mask 0', 1175, yy + 43, 25, color);
    });
    if (currentBeat || cueProgress('tiny-mean') > 0) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Masked mean · divide by 3 live rows',
        960,
        865,
        29,
        themeColors.green,
        'center',
      );
      drawExpandedClassifierMatrix(ctx, api, [f.pooled], 600, 895, {
        cell: 90,
        height: 64,
        color: themeColors.green,
        size: 23,
      });
    }
    if (currentBeat) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Completed updates ' + f.step,
        1560,
        355,
        30,
        themeColors.green,
        'center',
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Loss ' + format(f.loss, 5),
        1560,
        420,
        31,
        themeColors.yellow,
        'center',
      );
      const losses = TRAINING_TRACE.slice(0, f.step + 1),
        x = 1350,
        y = 750,
        w = 420,
        h = 230;
      drawExpandedClassifierLine(ctx, api, x, y, x + w, y, themeColors.muted, 2);
      drawExpandedClassifierLine(ctx, api, x, y - h, x, y, themeColors.muted, 2);
      for (let i = 1; i < losses.length; i++)
        drawExpandedClassifierLine(
          ctx,
          api,
          x + ((i - 1) / 80) * w,
          y - losses[i - 1].loss * h,
          x + (i / 80) * w,
          y - losses[i].loss * h,
          themeColors.green,
          4,
        );
      drawExpandedClassifierText(ctx, api, '0', x, y + 40, 25, themeColors.muted, 'center');
      drawExpandedClassifierText(ctx, api, '80', x + w, y + 40, 25, themeColors.muted, 'center');
    }
    if (currentBeat === 2 && done('tiny-restore'))
      drawExpandedClassifierCard(
        ctx,
        api,
        'Reloaded logits match',
        1370,
        850,
        420,
        themeColors.green,
        72,
        25,
      );
    drawExpandedClassifierNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Four nearby strings pass; order permutations retain the same mean'
        : 'Each shown completed step is an actual recorded optimizer state',
    );
  });
}
export default {
  id: 'tiny-training-run',
  draw: drawTinyTrainingRun,
  cues: ['tiny-input', 'tiny-mean', 'tiny-update', 'tiny-shape', 'tiny-restore', 'tiny-order'],
};
