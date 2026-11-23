import { absoluteCausalPairs, flashExtensionFrame } from '../model.mjs';
import { rowClock } from '../row-workspace.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawCpuCorrectness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('cpu-correctness', state),
    currentBeat = f.beat,
    clock = rowClock(scene, state);
  const paint = () => {
    const masks = absoluteCausalPairs([2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6]);
    masks[0] = masks[0].map(() => 'unused');
    drawFlashExtensionText(
      ctx,
      api,
      'FP64 on CPU     Q [5, 4]     K [7, 4]     V [7, 3]',
      960,
      290,
      36,
      themeColors.ink,
      'center',
    );
    for (let j = 0; j < 7; j++)
      api.text(ctx, j, 342 + j * 100, 365, 31, themeColors.muted, 'center');
    for (let i = 0; i < 5; i++) {
      api.text(ctx, 'Query ' + (i + 2), 260, 431 + i * 75, 30, themeColors.muted, 'right');
      for (let j = 0; j < 7; j++) {
        const allowed = masks[i][j] === 'allowed';
        drawFlashExtensionRectangle(
          ctx,
          api,
          300 + j * 100,
          390 + i * 75,
          84,
          58,
          allowed ? themeColors.cyan + '80' : themeColors.panel,
          allowed ? themeColors.cyan : themeColors.muted,
        );
        drawFlashExtensionText(
          ctx,
          api,
          allowed ? '✓' : '×',
          342 + j * 100,
          431 + i * 75,
          28,
          allowed ? themeColors.ink : themeColors.muted,
          'center',
        );
      }
    }
    if (currentBeat > 0) {
      const size = clock.started('one-wide-block') ? 20 : clock.started('one-key-blocks') ? 1 : 3;
      for (let j = 0; j < 7; j += size) {
        const count = Math.min(size, 7 - j);
        api.rect(ctx, 300 + j * 100, 770, count * 100 - 16, 10, themeColors.yellow);
        api.text(
          ctx,
          count,
          300 + (j + count / 2) * 100 - 8,
          830,
          37,
          themeColors.yellow,
          'center',
        );
      }
      drawFlashExtensionNum(ctx, api, 'Key block size', String(size), 430, themeColors.yellow);
    }
    drawFlashExtensionNum(
      ctx,
      api,
      'Compare with SDPA',
      'Output and Q, K, V gradients',
      650,
      themeColors.green,
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'FlashAttention saves a row statistic to reconstruct probabilities in backward'
        : 'Each check mark admits one query–key pair',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('cpu-correctness-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'cpu-correctness',
  draw: drawCpuCorrectness,
  cues: [
    'cpu-correctness-beat-1',
    'cpu-correctness-beat-2',
    'one-key-blocks',
    'one-wide-block',
    'cpu-correctness-beat-3',
  ],
};
