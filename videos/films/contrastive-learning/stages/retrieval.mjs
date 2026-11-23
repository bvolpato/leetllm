import { evaluate, formatValue, steps } from '../arithmetic.mjs';
import { drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawRetrieval(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    cue = (k) => state.cues?.['cl-retrieval-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('retrieval-mechanism', () => {
    const scores = evaluate(steps().at(-1)).scores,
      ranking = scores
        .map((score, i) => ({
          score,
          i,
        }))
        .sort((a, b) => b.score - a.score),
      count = Math.min(3, 1 + Math.floor((currentBeat + progress) * 1.1));
    drawText(
      ctx,
      api,
      'Stored candidate vectors · one encoded query',
      960,
      290,
      36,
      themeColors.blue,
    );
    ranking.slice(0, count).forEach((row, i) => {
      api.focus.target('ranked-document-' + i, () =>
        drawPill(
          ctx,
          api,
          i + 1 + '. ' + ['a puppy runs', 'a dog sleeps', 'the sky is blue'][row.i],
          760,
          435 + i * 165,
          1000,
          [themeColors.green, themeColors.pink, themeColors.blue][row.i],
        ),
      );
      drawText(
        ctx,
        api,
        formatValue(row.score),
        1510,
        447 + i * 165,
        37,
        [themeColors.green, themeColors.pink, themeColors.blue][row.i],
      );
    });
    if (currentBeat === 1 && resultComplete('missing'))
      drawText(
        ctx,
        api,
        'Missing relevant source has no shortlist slot',
        960,
        955,
        33,
        themeColors.pink,
      );
    drawNote(ctx, api, 'Measure shortlist coverage before celebrating an improved order');
  });
}
export default {
  id: 'retrieval',
  draw: drawRetrieval,
  cues: [
    'retrieval-ranked-document-0-b1-1',
    'cl-retrieval-rank',
    'retrieval-ranked-document-0-b2-1',
    'cl-retrieval-missing',
    'retrieval-ranked-document-0-b3-1',
  ],
};
