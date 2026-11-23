import { visionBound } from '../construction.mjs';
import { detailText, footer, line, patchGrid, title } from '../defaults.mjs';
export function drawInductiveBias(ctx, scene, state, api) {
  api.focus.target('inductive-bias-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    {
      title(ctx, api, 'Compare actual wiring before comparing trained behavior');
      const radius = currentBeat === 0 ? 1 + Math.floor(progress * 3) : 3;
      patchGrid(ctx, api, 9, 9, 220, 375, 540, 540, 40);
      for (let r = 0; r < 9; r++)
        for (let k = 0; k < 9; k++)
          if (Math.abs(r - 4) <= radius && Math.abs(k - 4) <= radius)
            api.rect(
              ctx,
              220 + k * 60,
              375 + r * 60,
              58,
              58,
              (r === 4 && k === 4 ? themeColors.pink : themeColors.blue) + '50',
              themeColors.blue,
              1,
            );
      patchGrid(ctx, api, 9, 9, 1120, 375, 540, 540, 40);
      const origin = {
        x: 1390,
        y: 645,
      };
      for (const r of [0, 2, 6, 8])
        for (const k of [0, 3, 5, 8])
          line(ctx, api, origin.x, origin.y, 1150 + k * 60, 405 + r * 60, themeColors.cyan, 2);
      detailText(ctx, api, 'stacked local convolution', 490, 335, 30, themeColors.blue, 'center');
      detailText(
        ctx,
        api,
        'full-attention connectivity',
        1390,
        335,
        30,
        themeColors.cyan,
        'center',
      );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Use matched held-out screenshot and exact-ID tasks; pretraining and recipe are variables'
          : 'Illustrative receptive fields; no downsampling is needed for this growth',
      );
    }
    return true;
  });
}
export default {
  id: 'inductive-bias',
  draw: drawInductiveBias,
  cues: ['inductive-bias-beat-0', 'inductive-bias-beat-1', 'inductive-bias-beat-2'],
};
