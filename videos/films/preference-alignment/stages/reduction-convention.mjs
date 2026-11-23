import { prefBound } from '../arithmetic.mjs';
import { alignmentReduction } from '../model.mjs';
import { caption, cell, constructionText, focusTarget, heading, rectangle } from '../defaults.mjs';
export function drawReductionConvention(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue reduction-convention/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    heading(
      ctx,
      api,
      'Same response owners · divide the same contributions by each response length',
    );
    const q = currentBeat === 0 ? 0 : currentBeat === 1 ? cueProgress('pa-reduction-divide', 1) : 1,
      v = alignmentReduction(q);
    for (const [i, r] of v.rows.entries()) {
      const y = 435 + i * 235,
        col = i === 0 ? themeColors.green : themeColors.pink;
      constructionText(ctx, api, r.id, 170, y + 45, 31, col);
      for (let k = 0; k < r.count; k++) {
        const x = 440 + k * 200;
        cell(ctx, api, r.contribution.toFixed(2), x, y, 170, 80, col, 31);
        if (q > 0)
          constructionText(
            ctx,
            api,
            '× ' + r.weight.toFixed(3),
            x + 85,
            y + 135,
            25,
            themeColors.yellow,
            'center',
          );
      }
      const label = q === 0 ? 'sum' : q === 1 ? 'mean' : 'weighted score';
      constructionText(ctx, api, label + ' = ' + r.score.toFixed(3), 1300, y - 25, 30, col);
      rectangle(ctx, api, 1300, y + 10, r.score * 1000, 55, col, col);
    }
    if (currentBeat > 0 && resultComplete('pa-reduction-sum', 1))
      constructionText(
        ctx,
        api,
        'Original sum margin: 0.40 − 0.30 = 0.10',
        170,
        885,
        31,
        themeColors.cyan,
      );
    if (q > 0)
      focusTarget(ctx, api, 'pa-reduction-result', () =>
        constructionText(
          ctx,
          api,
          q === 1 && resultComplete('pa-reduction-mean', 1)
            ? 'Mean margin: 0.10 − 0.15 = −0.05'
            : q === 1
              ? 'Both response sums have been divided by their own lengths'
              : 'Apply 1/4 to each chosen term and 1/2 to each rejected term',
          170,
          955,
          31,
          q === 1 && resultComplete('pa-reduction-mean', 1) ? themeColors.pink : themeColors.yellow,
        ),
      );
    caption(
      ctx,
      api,
      'Dataset-row averaging and within-completion token averaging are different operations.',
    );
    return;
  };
  focusTarget(ctx, api, 'reduction-convention-construction', construction);
}
export default {
  id: 'reduction-convention',
  draw: drawReductionConvention,
  cues: [
    'reduction-convention-b0',
    'reduction-convention-b1',
    'pa-reduction-sum',
    'pa-reduction-mean',
    'pa-reduction-divide',
    'reduction-convention-b2',
  ],
};
