import { sigmoid } from '../arithmetic.mjs';
import { fitSteps } from '../fixtures.mjs';
import { phase, progress } from '../construction.mjs';
import { trainingLoss } from '../model.mjs';
import { T, mark, plane, thresholdLine, trainPoints } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawLearning(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    fit = progress(state, 'lr-learning-trajectory', 0),
    i =
      currentBeat > 0
        ? 3000
        : fit < 0.18
          ? 1
          : Math.max(1, Math.round(Math.expm1(phase(fit, 0.18, 1) * Math.log(3001)))),
    w = fitSteps[i],
    q = plane(api);
  trainPoints(ctx, api, q, w);
  mark(api, 'review-decision-boundary', () => thresholdLine(ctx, api, q, w));
  T(ctx, api, 'Training labels stay fixed', 760, 275, 33, api.C.muted);
  mark(api, 'training-loss', () => {
    T(ctx, api, 'step ' + i.toLocaleString('en-US'), 1530, 380, 35, api.C.muted);
    T(ctx, api, 'log loss', 1530, 470, 33, api.C.cyan);
    T(ctx, api, trainingLoss(w).toFixed(3), 1530, 550, 59, api.C.cyan);
  });
  T(ctx, api, 'ambiguity ' + (w[1] >= 0 ? '+' : '') + w[1].toFixed(3), 1530, 695, 31, api.C.pink);
  T(ctx, api, 'support ' + (w[2] >= 0 ? '+' : '') + w[2].toFixed(3), 1530, 765, 31, api.C.green);
  if (currentBeat > 0) {
    const at = q.point(2, 3);
    mark(api, 'training-exception', () => {
      api.circle(ctx, at.x, at.y, 24, '#00000000', api.C.yellow, 4);
      T(ctx, api, 'R3', at.x, at.y - 35, 30, api.C.pink);
    });
    T(
      ctx,
      api,
      'Required review · fitted score ' + sigmoid(dotProduct(w, [1, 2, 3])).toFixed(3),
      960,
      965,
      35,
      api.C.pink,
    );
  } else
    mark(api, 'training-exception', () =>
      api.circle(ctx, ...Object.values(q.point(2, 3)), 11, api.C.pink),
    );
}
export default {
  id: 'learning',
  draw: drawLearning,
  cues: ['fit-boundary', 'lr-learning-trajectory', 'training-exception'],
};
