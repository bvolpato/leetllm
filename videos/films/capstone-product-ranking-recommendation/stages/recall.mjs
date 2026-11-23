import { dcg } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawRecall(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('recall', state);
  {
    text(
      ctx,
      api,
      `Recall relevance: grade ≥ ${modelState.recall.minGrade} · NDCG retains all graded gains`,
      960,
      280,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('retained-p5', () =>
      card(ctx, api, 'P5 · grade 3', 210, 410, 400, themeColors.cyan, 125),
    );
    api.focus.target('removed-p6', () =>
      card(
        ctx,
        api,
        modelState.removed ? 'P6 · excluded' : 'P6 · grade 2',
        740,
        410 + 150 * modelState.removal,
        400,
        modelState.removal > 0 ? themeColors.pink : themeColors.cyan,
        125 - 50 * modelState.removal,
      ),
    );
    api.focus.target('retained-p4', () =>
      card(ctx, api, 'P4 · grade 1', modelState.p4x, 410, 400, themeColors.cyan, 125),
    );
    const local = dcg(modelState.grades) / dcg([...modelState.grades].sort((a, b) => b - a));
    api.focus.target('recall-metrics', () =>
      teaching.bars({
        x: 300,
        y: 675,
        width: 1320,
        height: 140,
        values: [modelState.recall.value, local, dcg(modelState.grades) / dcg([3, 2, 1])],
        labels: [
          `Relevant recall (${modelState.recall.numerator}/${modelState.recall.denominator})`,
          'Survivor NDCG',
          'Fixed-universe NDCG',
        ],
        colors: [themeColors.pink, themeColors.blue, themeColors.green],
        max: 1.1,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 27,
        gap: 150,
      }),
    );
  }
}
export default {
  id: 'recall',
  draw: drawRecall,
  cues: ['recall-b1-1', 'recall-b1-2', 'recall-b1-3', 'recall-b2-1', 'recall-b2-2'],
};
