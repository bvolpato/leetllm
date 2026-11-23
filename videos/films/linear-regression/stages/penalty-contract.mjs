import { meanX, meanY } from '../arithmetic.mjs';
import { directed } from '../construction.mjs';
import { data } from '../fixtures.mjs';
import { lassoLine, predict, ridgeLine, secondMoment } from '../model.mjs';
import { curve, target, text } from '../defaults.mjs';

function ridgeWithInterceptPenalty(lambda, interceptPenalty) {
  const xx = secondMoment + lambda;
  const determinant = (1 + interceptPenalty) * xx - meanX ** 2;
  const xy = data.reduce((sum, row) => sum + row.x * row.y, 0) / data.length;
  return {
    intercept: (xx * meanY - meanX * xy) / determinant,
    slope: ((1 + interceptPenalty) * xy - meanX * meanY) / determinant,
  };
}

export function drawPenaltyContract(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0,
    lasso = beat === 2;
  const lambda =
    beat === 0
      ? 2 * directed(state, 'ridge-slope', 0.22, 0.6)
      : lasso
        ? 80 * directed(state, 'lasso-slope', 0.25, 0.65)
        : 2;
  const interceptPenalty = beat === 1 ? lambda * directed(state, 'ridge-intercept', 0.2, 0.64) : 0;
  const f = lasso
    ? lassoLine(lambda)
    : beat === 1
      ? ridgeWithInterceptPenalty(lambda, interceptPenalty)
      : ridgeLine(lambda);
  const color = lasso ? C.pink : C.cyan;
  const q = api.teaching.axes({
    x: 206,
    y: 364,
    width: 925,
    height: 466,
    xDomain: [0, 5.5],
    yDomain: [0, 250],
    xTicks: [0, 1, 3, 5],
    yTicks: [0, 50, 100, 150, 200, 250],
    xLabel: 'context (100 tokens)',
    yLabel: 'latency (ms)',
  });
  const ghost = beat === 1 ? ridgeLine(2) : ridgeLine(0);
  curve(ctx, api, q, (x) => predict(x, ghost.intercept, ghost.slope), C.muted, 0, 5.5, 3);
  curve(ctx, api, q, (x) => predict(x, f.intercept, f.slope), color, 0, 5.5, 6);
  data.forEach((row) => {
    const p = q.point(row.x, row.y);
    api.circle(ctx, p.x, p.y, 8, C.yellow);
  });
  const center = q.point(meanX, meanY),
    fitted = q.point(meanX, predict(meanX, f.intercept, f.slope));
  api.circle(ctx, center.x, center.y, 16, C.bg, C.green, 4);
  api.line(ctx, center.x, center.y, fitted.x, fitted.y, C.green, 4);
  api.circle(ctx, fitted.x, fitted.y, 8, color);
  text(ctx, api, 'Training mean at (3, 160)', 660, 985, 34, C.green, 'center');
  text(ctx, api, lasso ? 'Lasso' : 'Ridge', 1485, 294, 44, color, 'center');

  target(ctx, api, 'penalty-fit', () => {
    text(ctx, api, 'Slope   ' + Number(f.slope.toFixed(2)), 1485, 412, 42, color, 'center');
    text(ctx, api, 'Intercept   ' + Number(f.intercept.toFixed(2)), 1485, 502, 42, color, 'center');
    text(ctx, api, 'Slope penalty   ' + Number(lambda.toFixed(2)), 1485, 632, 33, C.ink, 'center');
    text(
      ctx,
      api,
      'Intercept penalty   ' + Number(interceptPenalty.toFixed(2)),
      1485,
      706,
      33,
      C.ink,
      'center',
    );
  });
  const formula = lasso ? 'MSE + λ |m|' : beat === 1 ? 'MSE + 2m² + γb²' : 'MSE + λm²';
  text(ctx, api, formula, 1485, 829, 36, C.muted, 'center');
  if (lasso && f.slope === 0) {
    text(ctx, api, 'At m = 0:  −80 + 80 = 0', 1485, 983, 33, C.pink, 'center');
  }
}

export default {
  id: 'penalty-contract',
  draw: drawPenaltyContract,
  cues: ['ridge-slope', 'ridge-intercept', 'lasso-slope'],
};
