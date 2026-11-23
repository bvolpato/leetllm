import { sampleModel } from '../model.mjs';
import { directed } from '../construction.mjs';
import {
  drawOriginalEquation,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
} from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('budget', state);
  {
    drawOriginalText(ctx, api, 'One full-precision Adam parameter', 180, 290, 35, themeColors.cyan);
    drawOriginalMark(ctx, api, 'parameter-budget', () => {
      const parts = [
        {
          label: 'weight',
          bytes: 4,
          p: modelState.weights,
          color: themeColors.blue,
        },
        {
          label: 'gradient',
          bytes: 4,
          p: modelState.gradients,
          color: themeColors.cyan,
        },
        {
          label: 'two moments',
          bytes: 8,
          p: modelState.moments,
          color: themeColors.pink,
        },
      ];
      let x = 180;
      parts.forEach((part) => {
        if (part.label === 'two moments') {
          drawOriginalMark(ctx, api, 'adam-moments', () => {
            drawOriginalText(ctx, api, part.label, x, 385, 33, part.color);
            if (directed(state, 'adam-first-gradient', 1, 0.83, 0.94) > 0)
              drawOriginalText(ctx, api, 'First step with a gradient for this parameter', x, 330, 31, part.color);
          });
        } else {
          drawOriginalText(ctx, api, part.label, x, 385, 33, part.color);
        }
        if (part.p > 0)
          api.rect(
            ctx,
            x,
            440,
            Math.max(1, part.bytes * 91 * part.p),
            125,
            part.color,
            undefined,
            3,
          );
        if (part.p === 1) drawOriginalText(ctx, api, part.bytes + ' bytes', x, 635, 37, part.color);
        x += part.bytes * 91 + 20;
      });
      drawOriginalText(
        ctx,
        api,
        modelState.moments === 1 ? '16 bytes per parameter' : 'Building the parameter ledger',
        960,
        740,
        42,
        themeColors.green,
        'center',
      );
    });
    drawOriginalMark(ctx, api, 'scaled-budget', () => {
      if (currentBeat === 1)
        drawOriginalEquation(
          ctx,
          api,
          modelState.scale === 1
            ? '\\frac{16\\times10^9}{2^{30}}\\approx14.90\\;\\mathrm{GiB}'
            : '16\\;\\text{bytes}\\times10^9',
          960,
          870,
          55,
          themeColors.yellow,
        );
    });
    drawOriginalMark(ctx, api, 'additional-memory', () => {
      if (currentBeat === 1)
        drawOriginalText(
          ctx,
          api,
          '+ activations + temporary workspace + allocator overhead',
          960,
          960,
          31,
          modelState.extra > 0 ? themeColors.pink : themeColors.muted,
          'center',
        );
    });
    if (currentBeat === 0)
      drawOriginalFooter(
        ctx,
        api,
        'A simplified parameter-related floor; storage choices can differ.',
      );
  }
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: ['weight-bytes', 'gradient-bytes', 'moment-bytes', 'scale-budget', 'activation-budget', 'adam-first-gradient'],
};
