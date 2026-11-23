import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedEquation,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  drawExtendedTokenRow,
  mixLanguage,
} from '../defaults.mjs';
export function drawSparseHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('sparse-history', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('sparse-history-construction', () => {
    if (currentBeat === 1) {
      drawExtendedHead(ctx, api, 'Which counts can we use after “error returns”?');
      drawExtendedCell(ctx, api, 'error returns', 210, 409, 460, 108, themeColors.cyan, 50);
      drawExtendedText(
        ctx,
        api,
        'No examples in the six comments',
        440,
        604,
        34,
        themeColors.muted,
        'center',
      );
      const back = S(1, 1);
      if (back > 0) {
        api.arrow(ctx, 690, 463, 690 + 400 * back, 463, themeColors.yellow, 5);
        drawExtendedCell(ctx, api, 'returns', 1110, 409, 500, 108, themeColors.yellow, 50);
        drawExtendedText(
          ctx,
          api,
          'value × 3     result × 2     error × 1',
          1360,
          604,
          35,
          themeColors.ink,
          'center',
        );
      }
      if (S(1, 2) > 0) {
        drawExtendedText(ctx, api, 'Neural predictor', 280, 863, 35, themeColors.ink);
        drawExtendedCell(ctx, api, 'shared embeddings', 650, 805, 420, 90, themeColors.green, 34);
        api.arrow(ctx, 1090, 850, 1200, 850, themeColors.green, 4);
        drawExtendedCell(ctx, api, 'shared weights', 1220, 805, 400, 90, themeColors.green, 34);
      }
      return;
    }
    drawExtendedHead(ctx, api, 'Group the next words by the two words before them');
    drawExtendedCell(ctx, api, 'returns', 150, 510, 240, 90, themeColors.cyan, 35);
    const split = S(0, 1);
    for (const [i, name] of ['function returns', 'test returns'].entries()) {
      const y = 390 + i * 260;
      api.arrow(
        ctx,
        400,
        555,
        mixLanguage(ctx, api, 400, 650, split),
        mixLanguage(ctx, api, 555, y + 40, split),
        i ? themeColors.blue : themeColors.cyan,
        4,
      );
      if (split > 0) {
        drawExtendedCell(
          ctx,
          api,
          name,
          670,
          y,
          430,
          80,
          i ? themeColors.blue : themeColors.cyan,
          31,
        );
        drawExtendedCell(
          ctx,
          api,
          i ? 'result × 1     error × 1' : 'value × 2',
          1220,
          y,
          540,
          80,
          themeColors.ink,
          30,
        );
      }
    }
    if (S(0, 3) > 0) {
      drawExtendedTokenRow(
        ctx,
        api,
        ['50,000', '50,000', '50,000', '50,000'],
        360,
        830,
        260,
        28,
        themeColors.yellow,
      );
      if (E(0, 3))
        drawExtendedEquation(
          ctx,
          api,
          String.raw`50{,}000^4=6.25\times10^{18}`,
          960,
          965,
          37,
          themeColors.yellow,
        );
    }
    if (E(0, 3))
      drawExtendedFoot(ctx, api, 'Possible four-token sequences in a 50,000-token vocabulary');
  });
}
export default {
  id: 'sparse-history',
  draw: drawSparseHistory,
  cues: [
    'sparse-history-b1',
    'sparse-history-voice-1',
    'sparse-history-step-0-1',
    'sparse-history-step-0-2',
    'sparse-history-step-0-3',
    'sparse-history-step-0-4',
    'sparse-history-b2',
    'sparse-history-voice-2',
    'sparse-history-step-1-1',
    'sparse-history-step-1-2',
    'sparse-history-step-1-3',
    'sparse-history-step-1-4',
  ],
};
