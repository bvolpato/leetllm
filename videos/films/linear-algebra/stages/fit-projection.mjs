import { dotProduct, normalizeVector } from 'vizmatic';
import { U, severity } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { leastSquaresFrame } from '../model.mjs';
import { ring, target, text } from '../defaults.mjs';

export function drawFitProjection(ctx, scene, state, api) {
  const { C } = api;
  const c = leastSquaresFrame(state);
  const normal = normalizeVector([1, 1, -1]);
  const project = (v) => {
    const a = dotProduct(v, U[0]);
    const b = dotProduct(v, U[1]);
    return {
      x: 260 + 167 * (a + 0.4 * b),
      y: 750 - 167 * (0.3 * a + 0.7 * b + 0.95 * dotProduct(v, normal)),
    };
  };
  const inPlane = (a, b) => U[0].map((v, i) => a * v + b * U[1][i]);
  const origin = project([0, 0, 0]);
  const observed = project(severity);
  const predicted = project(c.prediction);
  const jointShown = event(state, 1, 'joint-prediction', 0, 0.1) === 1;

  target(ctx, api, 'fit-span', () => {
    for (let a = 0; a <= 3.5; a += 0.5)
      api.path(ctx, [project(inPlane(a, -1.2)), project(inPlane(a, 1.2))], {
        color: '#7fa8ff66',
        width: 2,
      });
    for (let b = -1; b <= 1; b += 0.5)
      api.path(ctx, [project(inPlane(0, b)), project(inPlane(3.5, b))], {
        color: '#7fa8ff66',
        width: 2,
      });
    c.fit.columns.forEach((v, i) => {
      if (c.spanProgress > 0) {
        const tip = project(v.map((k) => k * c.weights[i] * c.spanProgress));
        api.arrow(ctx, origin.x, origin.y, tip.x, tip.y, i ? C.pink : C.blue, 5);
      }
    });
    text(ctx, api, 'Reachable severity predictions', 495, 318, 35, C.ink, 'center');
  });
  ring(ctx, api, observed, C.yellow, 13);
  text(ctx, api, 'observed', observed.x - 4, observed.y - 29, 30, C.yellow, 'center');
  target(ctx, api, 'fit-projection', () => {
    if (jointShown) api.arrow(ctx, origin.x, origin.y, predicted.x, predicted.y, C.green, 6);
    text(
      ctx,
      api,
      'Weights   ' + c.weights.map((v) => v.toFixed(2)).join('   /   '),
      480,
      880,
      34,
      C.green,
      'center',
    );
  });

  const left = 1190;
  const unit = 160;
  text(ctx, api, 'Severity by ticket', 1440, 318, 35, C.ink, 'center');
  text(ctx, api, 'Observed', 1340, 384, 28, C.yellow, 'center');
  text(ctx, api, 'Predicted', 1560, 384, 28, C.green, 'center');
  [0, 1, 2, 3].forEach((v) =>
    text(ctx, api, String(v), left + v * unit, 456, 26, C.muted, 'center'),
  );
  target(ctx, api, 'fit-residual', () => {
    if (jointShown) api.line(ctx, predicted.x, predicted.y, observed.x, observed.y, C.pink, 4);
    c.prediction.forEach((v, i) => {
      const y = 525 + 114 * i;
      const truth = left + unit * severity[i];
      const fit = left + unit * v;
      text(ctx, api, ['slow', 'rollback', 'both'][i], left - 55, y + 10, 29, C.muted, 'right');
      api.line(ctx, left - 5, y, left + 3.25 * unit, y, C.muted, 2);
      const drawRow = () => target(ctx, api, 'row-residual-' + i, () => {
        if (i < 2 || jointShown) api.line(ctx, fit, y, truth, y, C.pink, 7);
        ring(ctx, api, { x: truth, y }, C.yellow, 16);
        if (i < 2 || jointShown) api.circle(ctx, fit, y, 9, C.green);
        if (state.beat === 2) {
          const thirds = Math.round(3 * c.residual[i]);
          const gap = (thirds < 0 ? '−' : '+') + Math.abs(thirds) + '/3';
          text(ctx, api, gap, (truth + fit) / 2, y - 25, 32, C.pink, 'center');
        }
      });
      if (i === 2) target(ctx, api, 'joint-prediction', drawRow);
      else drawRow();
    });
  });
  const settled = c.progress === 1;
  const footer =
    state.beat >= 2
      ? 'Signed gap = observed severity − predicted severity'
      : settled
        ? 'Fitted weights   2/3  and  5/3     •     Sum of squared errors   1/3'
        : c.progress > 0
          ? 'Slide the green tip along the plane toward the yellow ring.'
          : jointShown
            ? 'Joint prediction   1 + 2 = 3     •     Observed severity   2'
            : 'Joint prediction   1 + 2 = ?';
  text(ctx, api, footer, 960, 982, 32, state.beat >= 2 ? C.pink : C.ink, 'center');
}

export default {
  id: 'fit-projection',
  draw: drawFitProjection,
  cues: ['fit-span', 'joint-prediction', 'fit-projection', 'fit-residual', 'slow-residuals', 'rollback-residuals'],
};
