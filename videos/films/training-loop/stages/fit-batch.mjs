import { modelSnapshot } from '../construction.mjs';
import { card, optionalFocusTarget, text } from '../defaults.mjs';
export function drawFitBatch(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const fit = modelSnapshot('fit-batch', state);
    text(
      ctx,
      api,
      'Eight training tickets · one two-layer classifier',
      960,
      300,
      36,
      themeColors.ink,
      'center',
    );
    optionalFocusTarget(ctx, api, 'fit-batch-simulation-37', () => {
      for (let i = 0; i < 8; i++) {
        const x = 345 + (i % 4) * 315,
          y = 390 + Math.floor(i / 4) * 125;
        optionalFocusTarget(ctx, api, 'fit-batch-object-ticket-38', () =>
          card(
            ctx,
            api,
            `ticket ${i + 1}`,
            x,
            y,
            260,
            78,
            i < 4 ? themeColors.blue : themeColors.green,
            1,
            28,
          ),
        );
        const prediction = fit.predictions[i],
          route = prediction.prediction === 1 ? 'escalate' : 'standard';
        text(
          ctx,
          api,
          `${route} ${prediction.correct ? '✓' : '×'}`,
          x + 130,
          y + 105,
          26,
          prediction.correct ? themeColors.green : themeColors.pink,
          'center',
        );
      }
    });
    const plot = teaching.axes({
      x: 310,
      y: 690,
      width: 1320,
      height: 190,
      xDomain: [0, 120],
      yDomain: [0, 0.7],
      xTicks: [0, 30, 60, 90, 120],
      yTicks: [0, 0.2, 0.4, 0.6],
      xLabel: 'SGD updates',
      yLabel: 'training loss',
      fontSize: 22,
    });
    const lossCurve = fit.history.map((point) => ({
      x: point.updates,
      y: point.loss,
    }));
    teaching.curve({
      plot,
      points: lossCurve,
      color: themeColors.cyan,
      width: 5,
    });
    optionalFocusTarget(ctx, api, 'fit-batch-object-distribution-fit-batch-40', () =>
      teaching.scatter({
        plot,
        points: [
          {
            x: fit.updates,
            y: fit.loss,
            color: fit.accuracy === 1 ? themeColors.green : themeColors.yellow,
            radius: 10,
          },
        ],
      }),
    );
    text(
      ctx,
      api,
      `optimizer updates ${fit.updates} / 120 · correct ${fit.correct} / 8 · weight norm ${fit.weightNorm.toFixed(3)}`,
      960,
      655,
      28,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      `Seeded PyTorch fixture · loss ${fit.loss.toFixed(4)}${fit.accuracy === 1 ? ' · all routes correct' : ''}`,
      960,
      980,
      32,
      fit.accuracy === 1 ? themeColors.green : themeColors.yellow,
      'center',
    );
    {
    }
  }
}
export default {
  id: 'fit-batch',
  draw: drawFitBatch,
  cues: [
    'fit-batch-beat-1-focus-1',
    'fit-batch-beat-1-focus-2',
    'fit-batch-beat-2-focus-1',
    'fit-batch-beat-2-focus-2',
  ],
};
