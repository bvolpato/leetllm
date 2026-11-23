import { history, regression, rows } from '../fixtures.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const exact = [2, -1, 0];
const fit = regression(exact);
export function drawRegressionOracle(ctx, scene, state, api) {
  const { C } = api;
  const fitted = operationProgress(state, 'oracle-weights') > 0;
  const fill = operationProgress(state, 'oracle-predictions');
  const initial = history[0];
  api.focus.target('oracle-table', () => {
    drawLeftText(
      ctx,
      api,
      fitted ? 'w = [2, −1]     b = 0' : 'w = [0, 0]     b = 0',
      112,
      270,
      45,
      C.blue,
    );
    const xs = [250, 715, 1100, 1570];
    ['Features', 'Target', 'Prediction', 'Squared error'].forEach((s, j) =>
      drawText(ctx, api, s, xs[j], 378, 32, C.muted),
    );
    rows.forEach((row, i) => {
      const y = 469 + i * 94;
      const computed = !fitted || i < Math.ceil(4 * fill);
      const pred = fitted ? fit.pred[i] : initial.pred[i];
      const terms = [
        '[' + row.x.join(', ') + ']',
        row.y,
        computed ? pred : '?',
        computed ? (pred - row.y) ** 2 : '?',
      ];
      terms.forEach((term, j) =>
        drawText(ctx, api, term, xs[j], y, 47, [C.blue, C.ink, C.cyan, C.yellow][j]),
      );
    });
  });
  api.focus.target('oracle-mean', () => {
    const loss = fitted
      ? resultAfter(state, 'oracle-exact')
        ? fit.loss
        : '?'
      : resultAfter(state, 'oracle-loss')
        ? initial.loss
        : '?';
    const expr = fitted ? 'Mean squared error' : '(4 + 1 + 1 + 9) / 4';
    drawLeftText(ctx, api, expr + ' = ' + loss, 116, 927, 55, C.yellow);
  });
}
export default {
  id: 'regression-oracle',
  draw: drawRegressionOracle,
  cues: ['oracle-loss', 'oracle-weights', 'oracle-predictions', 'oracle-exact'],
};
