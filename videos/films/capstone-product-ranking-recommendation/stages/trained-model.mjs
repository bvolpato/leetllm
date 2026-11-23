import { TEST_REQUESTS } from '../fixtures.mjs';
import { FITS } from '../fitted-models.mjs';
import { evaluatedRanking } from '../model.mjs';
import { box, cueProgress, cueVisible, footer, miniSlate, rankingText } from '../defaults.mjs';
export function drawTrainedModel(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('trained-model-mechanism', () => {
    if (currentBeat === 0) {
      rankingText(ctx, api, 'Actual9-pair training · two specified candidates', 150, 270, 34);
      const steps = Math.floor(600 * cueProgress(ctx, api, 'model-fit')),
        plot = teaching.axes({
          x: 250,
          y: 410,
          width: 850,
          height: 450,
          xDomain: [0, 600],
          yDomain: [0, 9],
          xTicks: [0, 300, 600],
          yTicks: [0, 3, 6, 9],
          xLabel: 'fixed gradient step',
          yLabel: 'quality coefficient',
          fontSize: 25,
        });
      FITS.forEach((fit, i) => {
        teaching.curve({
          plot,
          points: fit.history.slice(0, steps + 1).map((w, index) => ({
            x: index,
            y: w[1],
          })),
          color: i ? themeColors.cyan : themeColors.blue,
          width: 4,
        });
        rankingText(
          ctx,
          api,
          'λ=' +
            [0, 0.1][i] +
            (cueProgress(ctx, api, 'model-choose') === 1 ? ' · validation1.000' : ''),
          1210,
          470 + i * 150,
          30,
          i ? themeColors.cyan : themeColors.blue,
        );
      });
      if (cueProgress(ctx, api, 'model-choose') === 1)
        box(ctx, api, 'Tie-break selects λ0.1', 1170, 810, 580, 95, themeColors.green, 32);
      footer(
        ctx,
        api,
        '600 steps is the declared recipe; no convergence or exhaustive search claim.',
      );
    } else if (currentBeat === 1) {
      const chosen = FITS[1].weights,
        ready = cueProgress(ctx, api, 'model-weights') === 1;
      rankingText(
        ctx,
        api,
        ready
          ? 'Frozen fitted w = [' + chosen.map((v) => v.toFixed(3)).join(', ') + ']'
          : 'Frozen fitted coefficients · awaiting spoken values',
        150,
        270,
        35,
        themeColors.cyan,
      );
      TEST_REQUESTS.forEach((r, i) => {
        const x = 170 + i * 850;
        rankingText(ctx, api, r.id + ' · later holdout', x, 370, 30, themeColors.green);
        const ranked = evaluatedRanking(r, chosen);
        if (cueProgress(ctx, api, 'model-test') === 1) {
          miniSlate(ctx, api, ranked.rows, x, 435, 600);
          rankingText(
            ctx,
            api,
            'NDCG ' + evaluatedRanking(r, [1, 0]).ndcg.toFixed(3) + ' → ' + ranked.ndcg.toFixed(3),
            x + 300,
            835,
            34,
            themeColors.yellow,
            'center',
          );
        } else
          r.products.forEach(([id, match, quality], j) =>
            box(
              ctx,
              api,
              id + ' · [' + match + ',' + quality + ']',
              x,
              435 + j * 105,
              600,
              74,
              themeColors.blue,
              29,
            ),
          );
      });
      if (cueProgress(ctx, api, 'model-test') === 1)
        rankingText(
          ctx,
          api,
          'Two-query test mean: 0.854 →1.000',
          960,
          960,
          38,
          themeColors.green,
          'center',
        );
    } else {
      rankingText(ctx, api, 'Retain the actual fitting artifact', 150, 270, 34);
      [
        ['data', 'authored24rows'],
        ['features', 'text match / quality'],
        ['fit', '600 steps, η = 0.3, λ = 0.1'],
        ['windows', '3 train / 2 valid / 2 test'],
        ['weights', '[−0.109,1.229]'],
      ].forEach(([name, value], i) => {
        rankingText(ctx, api, name, 190, 400 + i * 110, 28, themeColors.muted);
        box(ctx, api, value, 650, 355 + i * 110, 1000, 75, themeColors.blue, 30);
      });
      if (cueVisible(ctx, api, 'model-separate'))
        footer(
          ctx,
          api,
          'Separate from the hand-entered regression scores. Test reuse becomes development, not new evidence.',
        );
    }
  });
}
export default {
  id: 'trained-model',
  draw: drawTrainedModel,
  cues: ['model-fit', 'model-choose', 'model-weights', 'model-test', 'model-separate'],
};
