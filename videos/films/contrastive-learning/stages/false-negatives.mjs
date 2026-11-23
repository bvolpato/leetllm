import { TAU } from '../fixtures.mjs';
import { formatValue } from '../arithmetic.mjs';
import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawFalseNegatives(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-false-negatives-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('false-negatives-mechanism', () => {
    const probs = stableSoftmax([0.9, 0.85, 0.1], TAU),
      mass = probs[0] + probs[1],
      single = probs.map((v, i) => (v - Number(i === 0)) / TAU),
      multi = probs.map((v, i) => (v - (i < 2 ? v / mass : 0)) / TAU),
      repair = currentBeat > 0 && resultComplete('repair');
    drawText(
      ctx,
      api,
      'Verified running descriptions retain their labels',
      960,
      290,
      34,
      themeColors.green,
    );
    [
      ['puppy runs', themeColors.green],
      ['dog is running', themeColors.green],
      ['sky blue', themeColors.blue],
    ].forEach(([v, col], i) => {
      const x = 420 + i * 540;
      drawPill(ctx, api, v, x, 430, 450, col);
      const g = (repair ? multi : single)[i];
      api.focus.target('single-positive-gradient', () =>
        api.focus.target('multiple-positive-gradient', () =>
          drawRectangle(ctx, api, x - 220, 565, 440, 140, themeColors.panel),
        ),
      );
      api.focus.target(repair ? 'multiple-positive-gradient' : 'single-positive-gradient', () => {
        if (currentBeat > 0 || resultComplete('wrong')) {
          drawText(
            ctx,
            api,
            '∂L/∂s = ' + formatValue(g),
            x,
            640,
            34,
            g > 0 ? themeColors.pink : themeColors.green,
          );
          api.arrow(
            ctx,
            x,
            780,
            x,
            780 + (g > 0 ? 85 : -85),
            g > 0 ? themeColors.pink : themeColors.green,
            5,
          );
          drawText(
            ctx,
            api,
            g > 0 ? 'descent lowers score' : 'descent raises score',
            x,
            910,
            27,
            g > 0 ? themeColors.pink : themeColors.green,
          );
        }
      });
    });
    drawNote(
      ctx,
      api,
      repair
        ? 'Positive-mass objective changes the numerator contract'
        : 'A correct answer can receive the wrong training direction',
    );
  });
}
export default {
  id: 'false-negatives',
  draw: drawFalseNegatives,
  cues: [
    'false-negatives-single-positive-gradient-b1-1',
    'cl-false-negatives-wrong',
    'false-negatives-multiple-positive-gradient-b2-1',
    'cl-false-negatives-repair',
    'false-negatives-multiple-positive-gradient-b3-1',
  ],
};
