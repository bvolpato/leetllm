import { bound } from '../arithmetic.mjs';
import { CORPUS, VERBS } from '../fixtures.mjs';
import { countState } from '../model.mjs';
import { card, equation, heading, target, text } from '../defaults.mjs';
export function drawCounts(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = bound(state.beatP ?? 0),
    cues = state.cues;
  const colors = [themeColors.blue, themeColors.green, themeColors.pink, themeColors.yellow];
  text(
    ctx,
    api,
    'C1 · counts from three observed sentences',
    960,
    205,
    23,
    themeColors.muted,
    'center',
  );
  {
    const v = countState(currentBeat, progress, cues);
    heading(
      ctx,
      api,
      currentBeat === 2
        ? 'Separate smoothing exercise · three eligible verbs'
        : 'Count adjacent words after cat',
    );
    CORPUS.forEach((line, i) =>
      target(ctx, api, 'count-row-' + i, () => {
        card(
          ctx,
          api,
          line,
          170,
          410 + i * 140,
          680,
          100,
          i < v.observed ? colors[i === 2 ? 1 : 0] : themeColors.muted,
          38,
        );
        if (i < v.observed)
          text(
            ctx,
            api,
            '+1 ' + (i === 2 ? 'slept' : 'sat'),
            890,
            475 + i * 140,
            29,
            themeColors.yellow,
          );
      }),
    );
    target(ctx, api, 'count-bars', () =>
      teaching.bars({
        values: v.values,
        labels: VERBS,
        x: 1080,
        y: 440,
        width: 640,
        height: 340,
        max: v.normalize ? 1 : 3,
        colors: colors.slice(0, 3),
        gap: 80,
        fontSize: 31,
        showValues: true,
        format: (n) => (v.normalize ? n.toFixed(3) : n.toFixed(0)),
      }),
    );
    target(ctx, api, 'count-total', () =>
      text(
        ctx,
        api,
        currentBeat === 2
          ? '3 observations + 3α ≈ ' + v.total.toFixed(2)
          : 'Observed transitions: ' + v.total,
        1400,
        910,
        29,
        themeColors.cyan,
        'center',
      ),
    );
    target(ctx, api, 'count-ate', () =>
      text(
        ctx,
        api,
        'ate: ' + (currentBeat === 2 ? '(0 + α) / (3 + 3α)' : '0 observations'),
        1400,
        1010,
        28,
        themeColors.pink,
        'center',
      ),
    );
    if (currentBeat === 1 && v.normalize)
      equation(ctx, api, 'P(\\mathrm{sat}\\mid\\mathrm{cat})=2/3', 520, 990, 35, themeColors.blue);
    if (currentBeat === 2)
      text(
        ctx,
        api,
        'Pseudo-count α ≈ ' + v.alpha.toFixed(2),
        520,
        990,
        35,
        themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'counts',
  draw: drawCounts,
  cues: [
    'count-first',
    'count-second',
    'count-third',
    'count-normalize',
    'count-unseen',
    'count-smooth',
  ],
};
