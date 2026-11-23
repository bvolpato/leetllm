import { languageStep } from '../construction.mjs';
import { extendedLanguageState } from '../model.mjs';
import {
  drawExtendedBar,
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedRail,
  drawExtendedText,
  drawExtendedTokenRow,
  formatLanguage,
  mixLanguage,
} from '../defaults.mjs';
export function drawTemperatureFilter(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('temperature-filter', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('temperature-filter-construction', () => {
    const m = extendedLanguageState('temperature-filter', state);
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Rescale the same logits; recompute the whole denominator'
        : currentBeat === 1
          ? 'Discarded mass must leave the denominator'
          : 'Selected output becomes a new model input',
    );
    if (currentBeat === 0) {
      const words = ['error', 'warning', 'success', 'the', 'end'];
      drawExtendedText(
        ctx,
        api,
        'temperature ' + formatLanguage(ctx, api, m.temperature, 2),
        960,
        340,
        35,
        themeColors.yellow,
        'center',
      );
      words.forEach((word, i) => {
        const y = 415 + i * 85;
        drawExtendedText(ctx, api, word, 190, y + 27, 28, themeColors.blue);
        drawExtendedBar(
          ctx,
          api,
          m.probabilities[i],
          500,
          y,
          1050,
          45,
          i ? themeColors.blue : themeColors.green,
        );
        drawExtendedText(
          ctx,
          api,
          m.probabilities[i].toFixed(4),
          1690,
          y + 28,
          29,
          themeColors.ink,
          'right',
        );
      });
      if (E(0, 4)) {
        drawExtendedText(
          ctx,
          api,
          'equal maxima: [2, 2, 0] · T→0⁺ gives [0.5, 0.5, 0]',
          960,
          930,
          29,
          themeColors.yellow,
          'center',
        );
      }
      drawExtendedFoot(
        ctx,
        api,
        'The displayed distribution is recomputed at the displayed positive temperature',
      );
    } else if (currentBeat === 1) {
      drawExtendedTokenRow(
        ctx,
        api,
        ['A: 0.6', 'B: 0.3', 'C: 0.1'],
        390,
        365,
        330,
        50,
        themeColors.blue,
      );
      drawExtendedRail(
        ctx,
        api,
        280,
        545,
        1360,
        [0.6, 0.3],
        ['A', 'B'],
        [themeColors.blue, themeColors.green],
      );
      const dropped = S(1, 0);
      api.rect(ctx, 1504, 545 + 125 * dropped, 136, 65, themeColors.pink);
      drawExtendedText(ctx, api, 'C: 0.1', 1572, 588 + 125 * dropped, 24, themeColors.bg, 'center');
      if (E(1, 0))
        drawExtendedText(ctx, api, 'retained mass 0.9', 960, 725, 35, themeColors.yellow, 'center');
      if (E(1, 3)) {
        drawExtendedRail(
          ctx,
          api,
          280,
          825,
          1360,
          [2 / 3, 1 / 3],
          ['A: 2/3', 'B: 1/3'],
          [themeColors.blue, themeColors.green],
        );
        drawExtendedText(
          ctx,
          api,
          '0.6 / 0.9 + 0.3 / 0.9 = 1',
          960,
          960,
          32,
          themeColors.cyan,
          'center',
        );
      }
      drawExtendedFoot(
        ctx,
        api,
        'Top-k / nucleus choose a retained set; renormalization supplies its draw probabilities',
      );
    } else {
      drawExtendedTokenRow(ctx, api, ['The', 'cat'], 250, 400, 250, 25, themeColors.blue);
      const travel = S(2, 1);
      drawExtendedCell(
        ctx,
        api,
        'slept',
        mixLanguage(ctx, api, 1320, 800, travel),
        mixLanguage(ctx, api, 690, 400, travel),
        250,
        70,
        travel === 1 ? themeColors.green : themeColors.yellow,
        33,
      );
      if (travel === 1)
        drawExtendedCell(ctx, api, 'new-prefix call', 1150, 400, 510, 70, themeColors.cyan, 32);
      if (S(2, 2) > 0)
        drawExtendedTokenRow(
          ctx,
          api,
          ['end selected', 'budget', 'timeout'],
          330,
          790,
          380,
          50,
          themeColors.yellow,
        );
      drawExtendedFoot(ctx, api, 'Record the actual stop reason beside the returned text');
    }
  });
}
export default {
  id: 'temperature-filter',
  draw: drawTemperatureFilter,
  cues: [
    'temperature-filter-b1',
    'temperature-filter-voice-1',
    'temperature-filter-step-0-1',
    'temperature-filter-step-0-2',
    'temperature-filter-step-0-3',
    'temperature-filter-step-0-4',
    'temperature-filter-step-0-5',
    'temperature-filter-b2',
    'temperature-filter-voice-2',
    'temperature-filter-step-1-1',
    'temperature-filter-step-1-2',
    'temperature-filter-step-1-3',
    'temperature-filter-step-1-4',
    'temperature-filter-b3',
    'temperature-filter-voice-3',
    'temperature-filter-step-2-1',
    'temperature-filter-step-2-2',
    'temperature-filter-step-2-3',
  ],
};
