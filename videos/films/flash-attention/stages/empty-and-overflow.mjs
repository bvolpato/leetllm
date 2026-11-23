import { finiteAccumulatorExample, flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawEmptyAndOverflow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('empty-and-overflow', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink],
    row = (values, x, y, cell = 130, cols = values.length) => {
      values.forEach((v, i) => {
        const xx = x + (i % cols) * (cell + 12),
          yy = y + Math.floor(i / cols) * 95;
        drawFlashExtensionRectangle(ctx, api, xx, yy, cell, 74, themeColors.panel, colors[i % 4]);
        drawFlashExtensionText(ctx, api, v, xx + cell / 2, yy + 49, 30, colors[i % 4], 'center');
      });
    };
  const paint = () => {
    if (currentBeat < 2) {
      drawFlashExtensionText(
        ctx,
        api,
        'One query · every key masked',
        960,
        300,
        38,
        themeColors.ink,
        'center',
      );
      row(['−∞', '−∞', '−∞', '−∞'], 440, 400, 220);
      drawFlashExtensionEquation(
        ctx,
        api,
        'm=-\\infty,\\quad\\ell=0,\\quad N=0',
        960,
        630,
        48,
        themeColors.cyan,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        currentBeat === 1 && f.go('fa-empty-zero', progress) === 1
          ? 'Empty row returns 0 and contributes zero gradient'
          : '−∞ − (−∞) gives NaN',
        960,
        820,
        38,
        currentBeat === 1 ? themeColors.green : themeColors.pink,
        'center',
      );
    } else {
      const over = finiteAccumulatorExample();
      drawFlashExtensionText(
        ctx,
        api,
        'Two finite values: 10³⁰⁸ and 10³⁰⁸',
        960,
        300,
        38,
        themeColors.blue,
        'center',
      );
      drawFlashExtensionRectangle(ctx, api, 300, 430, 550, 120, themeColors.blue);
      drawFlashExtensionRectangle(ctx, api, 300, 650, 550, 120, themeColors.blue);
      drawFlashExtensionText(
        ctx,
        api,
        'unnormalized sum exceeds FP64',
        1230,
        490,
        34,
        themeColors.pink,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        over.accepted ? 'accepted' : 'reject accumulator overflow',
        1230,
        560,
        36,
        themeColors.pink,
        'center',
      );
      drawFlashExtensionText(
        ctx,
        api,
        'Normalized mean remains finite: 10³⁰⁸',
        1230,
        730,
        34,
        themeColors.green,
        'center',
      );
    }
    drawFlashExtensionFooter(
      ctx,
      api,
      currentBeat < 2 ? 'Zero admitted keys  ·  zero total weight' : 'With equal scores, each normalized weight is ½',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('empty-and-overflow-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'empty-and-overflow',
  draw: drawEmptyAndOverflow,
  cues: [
    'empty-and-overflow-beat-1',
    'empty-and-overflow-beat-2',
    'fa-empty-zero',
    'empty-and-overflow-beat-3',
    'fa-overflow',
  ],
};
