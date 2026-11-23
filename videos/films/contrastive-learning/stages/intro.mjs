import { ANGLES, START } from '../fixtures.mjs';
import { evaluate, formatValue, vector } from '../arithmetic.mjs';
import { drawCells, drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-intro-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('intro-mechanism', () => {
    drawText(ctx, api, 'A dog is running.', 960, 310, 44, themeColors.yellow);
    const names = ['a puppy runs', 'a dog sleeps', 'the sky is blue'],
      cols = [themeColors.green, themeColors.pink, themeColors.blue],
      d = evaluate();
    names.forEach((v, i) => {
      const x = 420 + i * 540;
      api.focus.target('candidate-sentence-' + i, () =>
        drawPill(ctx, api, v, x, currentBeat ? 430 : 570, 480, cols[i]),
      );
      if (!currentBeat && resultComplete('partner'))
        v.split(' ').forEach((word, j) =>
          drawText(
            ctx,
            api,
            word,
            x - 125 + j * 90,
            730,
            27,
            word === 'runs'
              ? themeColors.green
              : word === 'sleeps'
                ? themeColors.pink
                : themeColors.muted,
          ),
        );
      if (currentBeat) {
        drawText(ctx, api, 'supplied unit vector', x, 540, 28, themeColors.muted);
        drawCells(
          ctx,
          api,
          vector(ANGLES[i]).map((v) => formatValue(v, 3)),
          x - 170,
          590,
          180,
          80,
          cols[i],
        );
        if (resultComplete('build') || currentBeat > 1)
          drawText(ctx, api, 'q · d = ' + formatValue(d.scores[i]), x, 785, 33, cols[i]);
      }
    });
    if (currentBeat > 1) {
      drawText(
        ctx,
        api,
        'Same anchor q = [' +
          vector(START)
            .map((v) => formatValue(v, 3))
            .join(', ') +
          ']',
        960,
        910,
        32,
        themeColors.yellow,
      );
      drawNote(ctx, api, 'Constructed vectors preserve inspectable geometry and arithmetic');
    } else
      drawNote(
        ctx,
        api,
        currentBeat
          ? 'Retain the same sentences while the comparison gains numerical operands'
          : 'Compare the action carried by each sentence',
      );
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-candidate-sentence-0-b1-1',
    'cl-intro-partner',
    'intro-candidate-sentence-0-b2-1',
    'cl-intro-build',
    'intro-candidate-sentence-0-b3-1',
    'cl-intro-scope',
  ],
};
