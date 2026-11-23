import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawBenchmarkScopes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('benchmark-scopes', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    if (currentBeat === 0) {
      const names = ['Baseline MLPerf 1.1', 'FlashAttention'],
        mins = [20, 17.4];
      for (let i = 0; i < 2; i++) {
        drawFlashExtensionText(ctx, api, names[i], 290, 415 + i * 250, 34, colors[i]);
        drawFlashExtensionRectangle(
          ctx,
          api,
          290,
          450 + i * 250,
          (1050 * mins[i]) / 20,
          100,
          colors[i],
        );
        drawFlashExtensionText(
          ctx,
          api,
          mins[i].toFixed(1) + ' min',
          1450,
          515 + i * 250,
          40,
          colors[i],
          'center',
        );
      }
      drawFlashExtensionText(
        ctx,
        api,
        'BERT-large · target MLM accuracy · seq 512 · 8 A100 · mean of 10 runs',
        960,
        290,
        32,
        themeColors.ink,
        'center',
      );
    } else if (currentBeat === 1) {
      api.text(ctx, 'GPT-style training step', 300, 350, 56, themeColors.ink);
      api.text(ctx, '225 TFLOPs/s per GPU', 300, 498, 74, themeColors.cyan);
      api.text(ctx, 'Model FLOPs utilization', 300, 632, 43, themeColors.ink);
      api.rect(ctx, 300, 690, 1050, 80, themeColors.panel);
      api.rect(ctx, 300, 690, 1050 * 0.72, 80, themeColors.cyan);
      api.text(ctx, '72%', 1460, 755, 66, themeColors.cyan, 'center');
    } else {
      const k = f.go('fa-half-attention', progress),
        attention = 20 - 10 * k;
      drawFlashExtensionText(
        ctx,
        api,
        'One request, timed from start to finish',
        960,
        290,
        35,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 2; i++) {
        const y = 430 + i * 235,
          a = i ? attention : 20;
        drawFlashExtensionRectangle(ctx, api, 280, y, a * 12, 120, themeColors.cyan);
        drawFlashExtensionRectangle(ctx, api, 280 + a * 12, y, 80 * 12, 120, themeColors.blue);
        drawFlashExtensionText(
          ctx,
          api,
          a.toFixed(1) + ' ms attention',
          280 + a * 6,
          y - 25,
          28,
          themeColors.cyan,
          'center',
        );
        drawFlashExtensionText(
          ctx,
          api,
          '80 ms rest',
          280 + a * 12 + 480,
          y + 75,
          37,
          themeColors.bg,
          'center',
        );
        drawFlashExtensionText(
          ctx,
          api,
          (a + 80).toFixed(1) + ' ms',
          1660,
          y + 75,
          36,
          themeColors.yellow,
          'center',
        );
      }
    }
    if (currentBeat === 2 && f.go('fa-half-attention', progress) === 1)
      drawFlashExtensionFooter(ctx, api, '100 ms ÷ 90 ms ≈ 1.11× the serial throughput');
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('benchmark-scopes-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'benchmark-scopes',
  draw: drawBenchmarkScopes,
  cues: [
    'benchmark-scopes-beat-1',
    'benchmark-scopes-beat-2',
    'benchmark-scopes-beat-3',
    'fa-half-attention',
  ],
};
