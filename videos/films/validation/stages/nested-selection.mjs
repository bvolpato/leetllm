import { detailText, heading, line, phraseProgress, tile } from '../defaults.mjs';
export function drawNestedSelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    heading(ctx, api, 'Choose on the inner rows. Score the chosen rule on the outer rows.');
    const outerY = 390;
    tile(ctx, api, 'Outer cohort: [3,7,9,5]', 1180, outerY, 560, 100, themeColors.pink);
    tile(
      ctx,
      api,
      currentBeat < 2 ? 'Outer labels covered' : 'Outer labels [0,1,0,1]',
      1180,
      outerY + 160,
      560,
      100,
      currentBeat < 2 ? themeColors.muted : themeColors.pink,
    );
    line(ctx, api, 1090, 330, 1090, 940, themeColors.yellow, 3);
    if (currentBeat === 0) {
      tile(ctx, api, 'Candidate A: nearest-mean', 210, 430, 700, 100, themeColors.blue);
      tile(ctx, api, 'Candidate B: constant 0', 210, 680, 700, 100, themeColors.cyan);
    }
    if (currentBeat === 1) {
      tile(ctx, api, 'Inner fit: x 2 / y 0, x 8 / y 1', 210, 380, 700, 100, themeColors.blue);
      tile(ctx, api, 'Inner held: x 4 / y 0, x 10 / y 1', 210, 550, 700, 100, themeColors.pink);
      detailText(
        ctx,
        api,
        'A threshold 5 → [0,1] → 2/2',
        560,
        760,
        33,
        themeColors.green,
        'center',
      );
      detailText(ctx, api, 'B constant 0 → [0,0] → 1/2', 560, 850, 33, themeColors.cyan, 'center');
      const refit = phraseProgress(state, api, 'refit-threshold', 1, 0.47, 0.65);
      if (refit > 0)
        api.focus.target('inner-refit', () =>
          detailText(
            ctx,
            api,
            'Refit A on [2,4,8,10] → threshold ' + (refit === 1 ? '6' : '?'),
            560,
            1010,
            29,
            themeColors.yellow,
            'center',
          ),
        );
    }
    if (currentBeat === 2) {
      tile(ctx, api, 'Refitted A · threshold 6', 210, 430, 700, 100, themeColors.yellow);
      detailText(ctx, api, 'Held predictions [0,1,1,0]', 560, 710, 35, themeColors.blue, 'center');
      const scored = phraseProgress(state, api, 'outer-accuracy', 2, 0.09, 0.22) === 1;
      api.focus.target('outer-score', () =>
        detailText(
          ctx,
          api,
          scored ? 'Two of four correct · outer accuracy 0.50' : 'Outer accuracy  ?',
          560,
          880,
          34,
          themeColors.pink,
          'center',
        ),
      );
      detailText(
        ctx,
        api,
        'Using outer errors to revise A turns this cohort into development',
        960,
        1030,
        27,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'nested-selection',
  draw: drawNestedSelection,
  cues: ['refit-threshold', 'outer-accuracy'],
};
