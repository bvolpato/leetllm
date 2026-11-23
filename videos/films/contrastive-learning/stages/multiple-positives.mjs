import { comparisonRow, formatValue } from '../arithmetic.mjs';
import { drawCells, drawNote, drawRowBars, drawText } from '../defaults.mjs';
export function drawMultiplePositives(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-multiple-positives-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('multiple-positives-mechanism', () => {
    if (currentBeat === 0) {
      const masked = B('masked'),
        r = comparisonRow([0.8, 0.8, 0.1], 0.2, 0, [true, !masked, true]);
      drawText(
        ctx,
        api,
        'Positive P9 · duplicate P9 · unrelated P4',
        960,
        295,
        35,
        themeColors.blue,
      );
      drawRowBars(
        ctx,
        api,
        r.probs,
        ['positive P9', 'duplicate P9', 'unrelated P4'],
        475,
        1,
        [themeColors.green, masked ? themeColors.muted : themeColors.pink, themeColors.blue],
        resultComplete('scores'),
      );
      if (resultComplete('wrong') && !masked)
        drawText(
          ctx,
          api,
          'Duplicate gradient +' + formatValue(r.gradients[1], 6),
          960,
          890,
          37,
          themeColors.pink,
        );
      if (resultComplete('masked'))
        drawText(
          ctx,
          api,
          'Masked gradient 0 · loss ' + formatValue(r.loss, 6),
          960,
          890,
          37,
          themeColors.green,
        );
      if (resultComplete('floor'))
        drawText(ctx, api, 'Tied unmasked copies: loss ≥ log 2', 960, 955, 31, themeColors.yellow);
      drawNote(
        ctx,
        api,
        'Mask only a verified equivalence · shared parameters still couple the remaining updates',
      );
    } else {
      drawText(
        ctx,
        api,
        'Same positive probabilities · two aggregation contracts',
        960,
        300,
        35,
        themeColors.yellow,
      );
      drawCells(ctx, api, ['0.999', '0.0005'], 300, 440, 600, 100, themeColors.green);
      const pm = -Math.log(0.9995),
        ml = -(Math.log(0.999) + Math.log(0.0005)) / 2;
      if (resultComplete('mass'))
        drawText(
          ctx,
          api,
          '−log(p1 + p2) = ' + formatValue(pm, 6),
          960,
          695,
          40,
          themeColors.green,
        );
      if (resultComplete('mean'))
        drawText(
          ctx,
          api,
          '−(log p1 + log p2)/2 = ' + formatValue(ml, 6),
          960,
          875,
          39,
          themeColors.pink,
        );
      drawNote(
        ctx,
        api,
        'A large total can hide one neglected positive under the mass aggregation',
      );
    }
  });
}
export default {
  id: 'multiple-positives',
  draw: drawMultiplePositives,
  cues: [
    'cl-multiple-positives-scores',
    'cl-multiple-positives-wrong',
    'cl-multiple-positives-masked',
    'cl-multiple-positives-floor',
    'cl-multiple-positives-mass',
    'cl-multiple-positives-mean',
  ],
};
