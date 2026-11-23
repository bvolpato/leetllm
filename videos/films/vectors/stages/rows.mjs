import { H, P, WORDS } from '../fixtures.mjs';
import { done, rowsFrame } from '../model.mjs';
import { drawEquation, drawMatrix, drawTarget, drawText } from '../defaults.mjs';
export function drawRows(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    const f = rowsFrame(state);
    drawText(ctx, api, 'word rows × input features', 425, 285, 29, themeColors.blue, 'center');
    drawText(ctx, api, 'shared map P', 950, 285, 29, themeColors.yellow, 'center');
    drawText(ctx, api, 'word rows × output features', 1490, 285, 29, themeColors.green, 'center');
    drawTarget(ctx, api, 'word-inputs', () => {
      WORDS[0].forEach((word, t) =>
        drawText(ctx, api, word, 285, 425 + t * 125, 31, themeColors.ink, 'right'),
      );
      drawMatrix(ctx, api, H[0], 320, 350, themeColors.blue, 125);
    });
    drawTarget(ctx, api, 'word-map', () =>
      drawMatrix(ctx, api, P, 800, 395, themeColors.yellow, 100),
    );
    drawText(ctx, api, '×', 680, 560, 55);
    drawText(ctx, api, '=', 1200, 560, 55);
    drawTarget(ctx, api, 'word-outputs', () => {
      WORDS[0].forEach((word, t) =>
        drawTarget(ctx, api, 'row-' + word + '-output', () => {
          drawText(ctx, api, word, 1735, 425 + t * 125, 28, themeColors.ink);
          return drawMatrix(
            ctx,
            api,
            [f.output[t]],
            1330,
            350 + t * 125,
            themeColors.green,
            125,
            () => done(f.progress[t]),
          );
        }),
      );
    });
    if (beat === 1) {
      const t = f.active;
      api.rect(ctx, 313, 343 + t * 125, 252, 125, 'transparent', themeColors.yellow, 7, 7);
      api.rect(ctx, 1323, 343 + t * 125, 377, 125, 'transparent', themeColors.yellow, 7, 7);
      drawText(
        ctx,
        api,
        WORDS[0][t] + ' owns this output row',
        960,
        825,
        33,
        themeColors.yellow,
        'center',
      );
    } else
      drawText(
        ctx,
        api,
        beat === 0 ? 'one vector per word position' : 'three input rows → three owned output rows',
        960,
        825,
        34,
        beat === 0 ? themeColors.muted : themeColors.green,
        'center',
      );
    drawEquation(ctx, api, '[3,2]\\;@\\;[2,3]\\longrightarrow[3,3]', 960, 960, 48, themeColors.ink);
  }
}
export default {
  id: 'rows',
  draw: drawRows,
  cues: ['stack-word-rows', 'row-reset', 'row-my', 'row-password', 'preserve-word-axis'],
};
