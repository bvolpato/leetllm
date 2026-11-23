import { sampleModel } from '../construction.mjs';
import { equation, text } from '../defaults.mjs';
export function drawPairwise(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('pairwise', state);
  {
    text(
      ctx,
      api,
      'Turn the scoring direction toward the preferred product',
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    const plot = teaching.axes({
      x: 210,
      y: 385,
      width: 720,
      height: 410,
      xDomain: [0, 1.4],
      yDomain: [0, 1.4],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'semantic match',
      yLabel: 'listing quality',
      equalUnits: true,
      fontSize: 26,
    });
    const origin = plot.point(0, 0),
      tip = plot.point(modelState.w[0], modelState.w[1]);
    api.focus.target('weights', () =>
      api.arrow(ctx, origin.x, origin.y, tip.x, tip.y, themeColors.cyan, 7),
    );
    [
      [0.85, 0.9, themeColors.green, 'P5'],
      [0.95, 0.3, themeColors.pink, 'P4'],
    ].forEach(([x, y, color, id]) => {
      const point = plot.point(x, y),
        score = x * modelState.w[0] + y * modelState.w[1];
      const scale = score / (modelState.w[0] ** 2 + modelState.w[1] ** 2),
        projection = plot.point(scale * modelState.w[0], scale * modelState.w[1]);
      api.focus.target('feature-pair', () => api.circle(ctx, point.x, point.y, 13, color));
      api.focus.target('feature-pair', () =>
        text(ctx, api, id, point.x + 80, point.y - 16, 30, color),
      );
      api.focus.target('score-projections', () => {
        api.line(ctx, point.x, point.y, projection.x, projection.y, color, 2);
        api.circle(ctx, projection.x, projection.y, 8, themeColors.panel, color, 3);
      });
    });
    api.focus.target('learned-scores', () =>
      teaching.bars({
        x: 1130,
        y: 440,
        width: 570,
        height: 300,
        values: modelState.scores,
        labels: ['Preferred P5', 'Weaker P4'],
        colors: [themeColors.green, themeColors.pink],
        max: 2.1,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 28,
        gap: 110,
      }),
    );
    api.focus.target('weights', () =>
      text(
        ctx,
        api,
        'Updates: ' +
          modelState.n +
          ' · w = [' +
          modelState.w.map((v) => v.toFixed(2)).join(', ') +
          ']',
        960,
        875,
        30,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('pairwise-loss', () =>
      equation(ctx, api, String.raw`s_i=w^\top x_i\qquad\ell=\log(1+e^{-(s_{P5}-s_{P4})})`),
    );
  }
}
export default {
  id: 'pairwise',
  draw: drawPairwise,
  cues: ['pairwise-b1-1', 'pairwise-b1-2', 'pairwise-b2-1', 'pairwise-b2-2', 'pairwise-b2-3'],
};
