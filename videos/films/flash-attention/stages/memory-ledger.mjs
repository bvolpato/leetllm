import { faClamp } from '../arithmetic.mjs';
import { attentionInventory, flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawMemoryLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('memory-ledger', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    const inv = attentionInventory(8, 32, 8192),
      factor = currentBeat === 0 ? f.go('fa-score-bytes', progress) : 1;
    drawFlashExtensionText(
      ctx,
      api,
      '8 batches × 32 heads × 8192 × 8192 × 2 bytes',
      960,
      290,
      34,
      themeColors.ink,
      'center',
    );
    if (currentBeat === 1) {
      const names = ['write S', 'read S', 'write P', 'read P'];
      for (let i = 0; i < 4; i++) {
        const amount = faClamp(f.go('fa-four-passes', progress) * 4 - i),
          x = 290 + i * 340;
        drawFlashExtensionRectangle(ctx, api, x, 440, 280, 260 * amount, colors[i]);
        drawFlashExtensionText(ctx, api, names[i], x + 140, 405, 30, colors[i], 'center');
        drawFlashExtensionText(
          ctx,
          api,
          amount === 1 ? '32 GiB' : 'constructing',
          x + 140,
          755,
          31,
          colors[i],
          'center',
        );
      }
      drawFlashExtensionEquation(
        ctx,
        api,
        f.go('fa-four-passes', progress) === 1
          ? '4\\times32=128\\ \\mathrm{GiB}'
          : '4\\times32=\\ ?',
        960,
        890,
        45,
        themeColors.yellow,
        'center',
      );
    } else {
      drawFlashExtensionRectangle(ctx, api, 300, 430, 950 * factor, 280, themeColors.blue);
      drawFlashExtensionNum(
        ctx,
        api,
        'One FP16 score slab',
        factor === 1 ? '32 GiB' : 'counting',
        430,
      );
      drawFlashExtensionNum(
        ctx,
        api,
        'Same bytes, decimal',
        factor === 1 ? '34.36 GB' : '?',
        655,
        themeColors.yellow,
      );
      if (currentBeat === 2) {
        drawFlashExtensionText(
          ctx,
          api,
          'LSE has one value per query row',
          960,
          870,
          38,
          themeColors.cyan,
          'center',
        );
      }
    }
    drawFlashExtensionFooter(
      ctx,
      api,
      'Array allocation, logical transfers and profiler-observed HBM bytes are different quantities',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('memory-ledger-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'memory-ledger',
  draw: drawMemoryLedger,
  cues: [
    'memory-ledger-beat-1',
    'fa-score-bytes',
    'memory-ledger-beat-2',
    'fa-four-passes',
    'memory-ledger-beat-3',
  ],
};
