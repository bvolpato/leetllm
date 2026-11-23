import { sampleModel } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalMark,
  drawOriginalText,
} from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api, modelState = sampleModel('transfer', state);
  {
    drawOriginalText(
      ctx,
      api,
      'Request 103 · the original eight values plus two new tokens',
      160,
      285,
      32,
      themeColors.cyan,
    );
    drawOriginalMark(ctx, api, 'final-ownership', () => {
      const xs = [140, 735, 1330];
      modelState.blocks.forEach((block, i) => {
        const color = [themeColors.cyan, themeColors.pink, themeColors.blue][i];
        drawOriginalText(ctx, api, 'Block ' + i, xs[i], 385, 32, color);
        block.threads.forEach((thread, j) => {
          const x = xs[i] + j * 130;
          drawOriginalCard(
            ctx,
            api,
            thread.valid ? String(thread.value) : modelState.tail === 1 ? '0' : '?',
            x,
            455,
            120,
            110,
            thread.valid ? color : modelState.tail === 1 ? themeColors.yellow : themeColors.muted,
            40,
          );
          drawOriginalText(
            ctx,
            api,
            thread.valid ? 'T' + thread.index : 'no read',
            x + 60,
            615,
            25,
            thread.valid ? themeColors.muted : themeColors.pink,
            'center',
          );
        });
        if (modelState.sums === 1)
          drawOriginalText(
            ctx,
            api,
            'subtotal ' + block.subtotal,
            xs[i] + 255,
            710,
            37,
            color,
            'center',
          );
      });
      if (modelState.divide > 0) {
        const left = xs[0];
        const right = xs[2] + 130 + 120;
        const end = left + modelState.divide * (right - left);
        api.line(ctx, left, 740, left, 770, themeColors.cyan, 3);
        api.line(ctx, left, 770, end, 770, themeColors.cyan, 3);
        if (modelState.divide === 1) {
          api.line(ctx, right, 740, right, 770, themeColors.cyan, 3);
          drawOriginalText(ctx, api, 'Input ends at T9', end, 826, 30, themeColors.cyan, 'right');
        }
      }
    });
    drawOriginalMark(ctx, api, 'final-result', () =>
      drawOriginalEquation(
        ctx,
        api,
        modelState.divide === 1
          ? modelState.numeric
            ? '\\frac{10+11+6}{10}=2.7'
            : '\\frac{10+11+6}{10}'
          : modelState.sums === 1
            ? '\\frac{27}{?}=?'
            : '\\text{pooled feature}=?',
        960,
        898,
        55,
        modelState.numeric ? themeColors.green : themeColors.yellow,
      ),
    );
    drawOriginalMark(ctx, api, 'final-report', () => {
      const scalar = Math.fround(modelState.mean);
      drawOriginalText(ctx, api, modelState.report === 1 ? 'Python .item()   ' + scalar : 'Python report awaits completion',
        195, 993, 34, modelState.report === 1 ? themeColors.cyan : themeColors.muted, 'left', true);
      drawOriginalText(ctx, api, modelState.format === 1 ? 'Log (.1f)   ' + scalar.toFixed(1) : 'Log   ·',
        1640, 993, 34, modelState.format === 1 ? themeColors.green : themeColors.muted, 'right', true);
    });
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'final-tail',
    'final-predict',
    'final-sums',
    'final-divide',
    'final-numeric-result',
    'final-report',
    'final-format',
  ],
};
