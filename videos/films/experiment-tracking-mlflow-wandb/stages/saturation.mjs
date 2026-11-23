import { clause } from '../construction.mjs';
import { drawCoreCell, drawCoreNote, drawCoreRectangle, drawCoreText } from '../defaults.mjs';
export function drawSaturation(ctx, scene, state, api) {
  api.focus.target('tr-saturation-trace', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat,
      op = (beat, n) => clause(state, 'saturation', beat, n, api),
      done = (beat, n) => op(beat, n) >= 1;
    {
      const rows = ['candidate X', 'candidate Y', 'candidate Z'];
      drawCoreText(
        ctx,
        api,
        currentBeat === 0
          ? 'Separate supplied ceiling scenario: all three tie'
          : 'Judge inputs are part of scoring semantics',
        150,
        285,
        34,
        themeColors.cyan,
      );
      rows.forEach((name, i) => {
        const y = 405 + i * 145;
        drawCoreCell(ctx, api, name, 150, y, 340, 85, themeColors.blue);
        drawCoreRectangle(ctx, api, 650, y + 15, 900, 50, themeColors.green);
        drawCoreText(
          ctx,
          api,
          currentBeat === 0 ? '4 / 4' : 'prior 4 / 4',
          1710,
          y + 52,
          32,
          themeColors.green,
          'right',
        );
      });
      if (currentBeat === 0 && done(0, 2)) {
        drawCoreCell(ctx, api, 'Reviewed new case E5', 650, 865, 900, 75, themeColors.yellow);
        drawCoreNote(
          ctx,
          api,
          'Keep old regressions; expanding the suite creates a new comparison contract',
        );
      } else if (currentBeat === 1) {
        const names = ['Judge prompt', 'Judge model', 'Judge settings'];
        names.forEach((v, i) =>
          drawCoreCell(
            ctx,
            api,
            v,
            150 + i * 540,
            865,
            470,
            75,
            done(1, 1) ? themeColors.yellow : themeColors.muted,
          ),
        );
        drawCoreNote(
          ctx,
          api,
          'A changed judge requires a matched rerun before attributing a score change',
        );
      }
    }
  });
}
export default {
  id: 'saturation',
  draw: drawSaturation,
  cues: [
    'tr-saturation-0-0',
    'tr-saturation-0-1',
    'tr-saturation-0-2',
    'tr-saturation-0-3',
    'tr-saturation-0-4',
    'tr-saturation-1-0',
    'tr-saturation-1-1',
    'tr-saturation-1-2',
    'tr-saturation-1-3',
    'tr-saturation-1-4',
  ],
};
