import { bound } from '../arithmetic.mjs';
import { SENTENCE, TARGET_PROBS } from '../fixtures.mjs';
import { sequenceState } from '../model.mjs';
import { card, equation, target, text } from '../defaults.mjs';
export function drawSequence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = bound(state.beatP ?? 0),
    cues = state.cues;
  const colors = [themeColors.blue, themeColors.green, themeColors.pink, themeColors.yellow];
  {
    const v = sequenceState(currentBeat, progress2, cues);
    const xs = [260, 640, 1020, 1400];
    text(ctx, api, 'Score from the start of the sentence', xs[0], 277, 39, themeColors.ink);
    SENTENCE.forEach((word, i) =>
      target(ctx, api, 'sequence-factor-' + i, () => {
        const label = i === 3 && v.amounts[i] === 0 ? '?' : word;
        card(ctx, api, label, xs[i], 400, 260, 100, i < v.count ? colors[i] : themeColors.muted, 40);
        text(
          ctx,
          api,
          v.amounts[i] > 0 || i < v.count ? TARGET_PROBS[i].toFixed(2) : '?',
          xs[i] + 130,
          600,
          39,
          colors[i],
          'center',
        );
      }),
    );
    const completeText =
      v.count === 0
        ? 'P(empty prefix) = 1'
        : 'P(' + (v.count === 4 ? 'complete sequence' : 'prefix') + ') = ' + v.product.toFixed(4);
    target(ctx, api, 'sequence-product', () => {
      let prior = 1;
      v.amounts.forEach((progress, i) => {
        if (progress > 0) {
          const y = 750 + 46 * i,
            current = prior * (1 + (TARGET_PROBS[i] - 1) * progress);
          text(ctx, api, SENTENCE.slice(0, i + 1).join(' '), 330, y + 24, 28, colors[i], 'right');
          api.rect(ctx, 370, y, 1270 * prior, 28, themeColors.panel, themeColors.muted, 1);
          api.rect(ctx, 370, y, 1270 * current, 28, colors[i]);
          if (progress >= 1)
            text(ctx, api, (prior * TARGET_PROBS[i]).toFixed(4), 1730, y + 23, 25, colors[i]);
        }
        prior *= TARGET_PROBS[i];
      });
      text(
        ctx,
        api,
        v.constructing ? 'Applying the next conditional factor' : completeText,
        960,
        710,
        35,
        themeColors.cyan,
        'center',
      );
      text(ctx, api, '0', 370, 955, 25, themeColors.muted, 'center');
      text(ctx, api, '1', 1640, 955, 25, themeColors.muted, 'center');
    });
    if (v.count)
      equation(
        ctx,
        api,
        TARGET_PROBS.slice(0, v.count)
          .map((n) => n.toFixed(1))
          .join('\\times') +
          '=' +
          v.product.toFixed(4),
        960,
        1010,
        41,
        themeColors.yellow,
      );
  }
}
export default {
  id: 'sequence',
  draw: drawSequence,
  cues: ['sequence-the', 'sequence-cat', 'sequence-sat', 'sequence-end'],
};
