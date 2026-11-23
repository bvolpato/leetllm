import { centeredText, clauseComplete, clauseProgress, tag } from '../defaults.mjs';
export function drawAccumulationWeight(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('accumulation-weight-mechanism', () => {
    if (currentBeat === 0) {
      const real = ['H1', 'H2', 'H3'],
        synthetic = ['G1', 'G2', 'G3', 'G4'];
      centeredText(ctx, api, 'Retained identities', 960, 295, 35, themeColors.blue);
      if (clauseProgress(ctx, api, 'real-three'))
        real.forEach((id, i) => tag(ctx, api, id, 370 + i * 570, 430, themeColors.blue, 350));
      if (clauseProgress(ctx, api, 'add-two'))
        synthetic.forEach((id, i) => tag(ctx, api, id, 300 + i * 440, 640, themeColors.cyan, 300));
      if (clauseComplete(ctx, api, 'pool-seven'))
        centeredText(
          ctx,
          api,
          'Accumulated: 3 real + 2 + 2 = 7 IDs',
          960,
          800,
          38,
          themeColors.green,
        );
      if (clauseComplete(ctx, api, 'replace-two'))
        centeredText(
          ctx,
          api,
          'Latest replacement: G3, G4 · 0 original real rows',
          960,
          925,
          34,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      centeredText(ctx, api, 'Error across training rounds', 960, 305, 35, themeColors.blue);
      const plot = api.teaching.axes({
        x: 240,
        y: 425,
        width: 1390,
        height: 400,
        xDomain: [0, 6],
        yDomain: [0, 7],
        xTicks: [0, 2, 4, 6],
        yTicks: [0, 2, 4, 6],
        xLabel: 'generation',
        yLabel: 'schematic error',
        fontSize: 27,
      });
      const q = clauseProgress(ctx, api, 'bounded-study'),
        n = Math.max(1, Math.floor(6 * q));
      if (q > 0)
        api.teaching.curve({
          plot,
          points: Array.from(
            {
              length: n + 1,
            },
            (_, i) => ({
              x: i,
              y: i,
            }),
          ),
          color: themeColors.pink,
        });
      if (q > 0)
        api.teaching.curve({
          plot,
          points: Array.from(
            {
              length: n + 1,
            },
            (_, i) => ({
              x: i,
              y: Array.from(
                {
                  length: i,
                },
                (_, k) => 1 / (k + 1) ** 2,
              ).reduce((a, b) => a + b, 0),
            }),
          ),
          color: themeColors.blue,
        });
      centeredText(ctx, api, 'Replace each batch', 540, 935, 33, themeColors.pink);
      centeredText(ctx, api, 'Keep earlier batches', 1380, 935, 33, themeColors.blue);
    } else {
      centeredText(
        ctx,
        api,
        'Membership and training exposure are different quantities',
        960,
        295,
        35,
        themeColors.blue,
      );
      tag(ctx, api, 'H3 retained in the dataset', 960, 440, themeColors.blue, 1450);
      if (clauseComplete(ctx, api, 'weight-negligible')) {
        tag(ctx, api, 'Sampling weight: 1 / 1,000,000', 960, 625, themeColors.pink, 1450);
        centeredText(
          ctx,
          api,
          'Positive membership · potentially negligible exposure',
          960,
          760,
          33,
          themeColors.pink,
        );
      }
      if (clauseComplete(ctx, api, 'weight-positive'))
        centeredText(
          ctx,
          api,
          'Explicit positive weight permits a rare draw · probability follows the mixture',
          960,
          925,
          31,
          themeColors.green,
        );
    }
  });
}
export default {
  id: 'accumulation-weight',
  draw: drawAccumulationWeight,
  cues: [
    'pool-accumulate',
    'real-three',
    'add-two',
    'pool-seven',
    'replace-two',
    'accumulation-scope',
    'bounded-study',
    'exposure-weight',
    'weight-negligible',
    'weight-positive',
  ],
};
