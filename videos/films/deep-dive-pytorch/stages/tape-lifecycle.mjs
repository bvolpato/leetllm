import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawLine, drawRows, drawText } from '../defaults.mjs';
export function drawTapeLifecycle(ctx, scene, state, api) {
  return api.focus.target('pt-tape-lifecycle-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('tape-lifecycle', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat < 2) {
        drawText(
          ctx,
          api,
          'Executed scalar path: y = 2x, L = y²',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        const labs = ['x = 3', 'y = 6', 'L = 36'];
        labs.forEach((v, i) => {
          drawCard(
            ctx,
            api,
            i <= Math.floor(progress * 3) || currentBeat === 1 ? v : 'pending',
            210 + i * 570,
            410,
            440,
            themeColors.blue,
            100,
          );
          if (i < 2) drawArrow(ctx, api, 670 + i * 570, 460, 760 + i * 570, 460, themeColors.cyan);
        });
        if (currentBeat === 1) {
          drawText(
            ctx,
            api,
            'Saved y = 6 · square derivative 2y = 12',
            960,
            650,
            34,
            themeColors.cyan,
            'center',
          );
          drawLine(ctx, api, 1530, 730, 430 + 1100 * (1 - progress), 730, themeColors.yellow, 5);
          drawText(ctx, api, '× 2', 610, 815, 38, themeColors.yellow, 'center');
          drawText(
            ctx,
            api,
            modelState.dx === null ? 'Input gradient ?' : 'Input gradient = ' + modelState.dx,
            960,
            925,
            43,
            modelState.dx === null ? themeColors.yellow : themeColors.green,
            'center',
          );
        } else
          drawText(
            ctx,
            api,
            'Backward follows the two operations that ran',
            960,
            850,
            31,
            themeColors.muted,
            'center',
          );
      } else {
        drawRows(
          ctx,
          api,
          [
            ['Grad-requiring leaf write', 'Immediate enabled-grad error', themeColors.pink],
            ['Detached saved alias write', 'Version mismatch at backward', themeColors.pink],
            ['No-grad', 'Recording disabled; saved-value safety remains', themeColors.cyan],
            ['Inference mode', 'Stricter metadata and later-use rules', themeColors.blue],
          ],
          360,
          145,
        );
      }
    }
  });
}
export default {
  id: 'tape-lifecycle',
  draw: drawTapeLifecycle,
  cues: ['pt-tape-lifecycle-0', 'pt-tape-lifecycle-1', 'pt-tape-gradient', 'pt-tape-lifecycle-2'],
};
