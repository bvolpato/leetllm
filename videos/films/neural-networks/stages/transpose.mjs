import { PARAMETERS } from '../fixtures.mjs';
import { transposeExample } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  alpha,
  block,
  equation,
  focusTarget,
  formatNumber,
  head,
  note,
  outline,
  text,
  vector,
} from '../defaults.mjs';
export function drawTranspose(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'transpose-mechanism', () => {
    head(ctx, api, 'Both products have shape [1,2] · which feature-weight pairs are used?');
    const reveal = S('transpose-answer', 1),
      progress = cueProgress('transpose-answer', 1),
      right = transposeExample();
    vector(ctx, api, [2, 5], 340, 430, 160, themeColors.ink);
    text(ctx, api, 'request X', 420, 345, 31, themeColors.ink, 'center');
    block(ctx, api, PARAMETERS.w1, 940, 415, 170, themeColors.cyan);
    text(ctx, api, 'W₁ · one neuron per row', 1025, 330, 30, themeColors.cyan, 'center');
    alpha(ctx, api, Math.max(0.2, 1 - progress), () => {
      for (let i = 0; i < 2; i++)
        outline(ctx, api, 854, 376 + i * 85, 342, 78, themeColors.cyan, 3);
    });
    if (progress > 0)
      alpha(ctx, api, progress, () => {
        for (let j = 0; j < 2; j++)
          outline(ctx, api, 854 + j * 170, 376, 172, 163, themeColors.pink, 3);
      });
    focusTarget(ctx, api, 'transpose-right', () => {
      equation(
        ctx,
        api,
        String.raw`XW_1^\top:\ [0.3(2)-0.1(5),\;0.1(2)+0.6(5)]`,
        960,
        685,
        40,
        themeColors.cyan,
      );
      if (reveal)
        text(
          ctx,
          api,
          '[' + right.right.map((v) => formatNumber(ctx, api, v)).join(', ') + ']',
          1640,
          790,
          39,
          themeColors.cyan,
          'center',
        );
    });
    focusTarget(ctx, api, 'transpose-wrong', () => {
      equation(
        ctx,
        api,
        String.raw`XW_1:\ [0.3(2)+0.1(5),\;-0.1(2)+0.6(5)]`,
        960,
        885,
        40,
        themeColors.pink,
      );
      if (reveal)
        text(
          ctx,
          api,
          '[' + right.wrong.map((v) => formatNumber(ctx, api, v)).join(', ') + ']',
          1640,
          970,
          39,
          themeColors.pink,
          'center',
        );
    });
    note(
      ctx,
      api,
      'Changing the pairing in place exposes an error that a shape check cannot catch.',
    );
    return;
  });
}
export default {
  id: 'transpose',
  draw: drawTranspose,
  cues: ['transpose-question', 'transpose-answer'],
};
