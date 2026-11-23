import { actual, baseline, candidate } from '../fixtures.mjs';
import { capacity, metrics, sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawMetrics(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('metrics', state);
  {
    const evaluated = true,
      n =
        state.cues && state.cues['metrics-b1-1'].phase !== 'before'
          ? Math.max(1, modelState.n)
          : modelState.n;
    if (n !== modelState.n) Object.assign(modelState, metrics(n));
    const plot = teaching.axes({
      x: 230,
      y: 380,
      width: 1450,
      height: 410,
      xDomain: [0.7, 14.3],
      yDomain: [60, 200],
      xTicks: [1, 4, 7, 10, 14],
      yTicks: [80, 140, 200],
      xLabel: 'Target day in the two issued windows',
      yLabel: 'Requested parcels',
      fontSize: 26,
    });
    api.focus.target('original-forecast', () =>
      api.focus.target('issued-forecast', () =>
        teaching.curve({
          plot,
          points: candidate.slice(0, 14).map((y, i) => ({
            x: i + 1,
            y,
          })),
          color: themeColors.cyan,
          width: 4,
        }),
      ),
    );
    api.focus.target('issued-capacity', () =>
      teaching.curve({
        plot,
        points: capacity.map((y, i) => ({
          x: i + 1,
          y,
        })),
        color: themeColors.yellow,
        width: 3,
      }),
    );
    {
      api.focus.target('seasonal-forecast', () =>
        teaching.curve({
          plot,
          points: baseline.map((y, i) => ({
            x: i + 1,
            y,
          })),
          color: themeColors.blue,
          width: 3,
        }),
      );
      api.focus.target('paired-residuals', () =>
        actual.slice(0, n).forEach((y, i) => {
          const a = plot.point(i + 1, y),
            base = plot.point(i + 1, baseline[i]),
            model = plot.point(i + 1, candidate[i]);
          api.line(ctx, a.x - 3, base.y, a.x - 3, a.y, themeColors.blue, 2);
          api.line(ctx, a.x + 3, model.y, a.x + 3, a.y, themeColors.cyan, 2);
        }),
      );
      api.focus.target('mature-actuals', () =>
        teaching.scatter({
          plot,
          points: actual.slice(0, n).map((y, i) => ({
            x: i + 1,
            y,
            color: Math.abs(y - candidate[i]) <= 6 ? themeColors.green : themeColors.pink,
            radius: 9,
          })),
        }),
      );
    }
    text(
      ctx,
      api,
      'Cyan: frozen forecast \xB7 yellow: issued capacity \xB7 blue: seasonal baseline \xB7 dots: mature actuals',
      960,
      300,
      27,
      themeColors.ink,
      'center',
    );
    {
      api.focus.target('mature-count', () =>
        text(ctx, api, 'Same mature rows: ' + n + '/14', 160, 890, 28, themeColors.ink),
      );
      api.focus.target('mae', () =>
        text(
          ctx,
          api,
          'Candidate MAE: ' + (modelState.mae === null ? 'pending' : modelState.mae.toFixed(3)),
          590,
          890,
          28,
          themeColors.cyan,
        ),
      );
      api.focus.target('seasonal-mae', () =>
        text(
          ctx,
          api,
          'Seasonal MAE: ' +
            (modelState.baseline === null ? 'pending' : modelState.baseline.toFixed(3)),
          1070,
          890,
          28,
          themeColors.blue,
        ),
      );
      api.focus.target('tolerance-count', () =>
        text(
          ctx,
          api,
          'Within tolerance: ' + modelState.inside + '/' + n,
          1630,
          890,
          28,
          themeColors.green,
          'center',
        ),
      );
      if (n)
        api.focus.target('paired-mae-calculation', () =>
          api.math(
            ctx,
            `\\mathrm{Candidate}:\\frac{${modelState.candidateSum.toFixed(2)}}{${n}}\\approx${modelState.mae.toFixed(3)}\\quad\\mathrm{Seasonal}:\\frac{${modelState.baselineSum.toFixed(2)}}{${n}}\\approx${modelState.baseline.toFixed(3)}`,
            960,
            1000,
            36,
            themeColors.yellow,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'metrics',
  draw: drawMetrics,
  cues: [
    'metrics-b1-1',
    'metrics-b1-2',
    'metrics-shared-baseline',
    'metrics-b1-3',
    'metrics-b2-1',
    'metrics-b2-2',
  ],
};
