import { fittedWeights } from '../fixtures.mjs';
import { mix, progress, smooth } from '../construction.mjs';
import { M, T, mark, plane, thresholdLine, trainPoints } from '../defaults.mjs';
export function drawBoundary(ctx, scene, state, api) {
  const amount = progress(state, 'lower-threshold', 1),
    threshold = mix(0.5, 0.2, smooth(amount)),
    q = plane(api);
  mark(api, 'review-region', () => {
    thresholdLine(ctx, api, q, fittedWeights, threshold, true);
    T(ctx, api, 'REVIEW SIDE', 1090, 750, 30, api.C.yellow);
  });
  trainPoints(ctx, api, q, fittedWeights, threshold, true);
  mark(api, 'review-decision-boundary', () => thresholdLine(ctx, api, q, fittedWeights, threshold));
  T(ctx, api, 'Same fitted weights', 760, 275, 34, api.C.muted);
  T(ctx, api, 'threshold', 1530, 440, 36, api.C.muted);
  T(ctx, api, threshold.toFixed(2), 1530, 535, 58, api.C.yellow);
  M(ctx, api, 'z\\geq\\log\\frac{t}{1-t}', 1530, 715, 40, api.C.cyan);
  T(
    ctx,
    api,
    'Filled color = observed label · yellow ring = review action',
    960,
    965,
    32,
    api.C.muted,
  );
}
export default {
  id: 'boundary',
  draw: drawBoundary,
  cues: ['boundary-region', 'lower-threshold'],
};
