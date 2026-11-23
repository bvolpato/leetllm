import { NONLINEAR_START } from './fixtures.mjs';
import { gradientClamp, gradientPhase, hiddenStep } from './arithmetic.mjs';
export const gradientCue = (cues, id, fallback) => {
  const c = cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : gradientClamp(c.progress)
    : fallback;
};
export const gradientDone = (cues, id, fallback) => {
  const c = cues?.[id];
  return c ? c.phase === 'after' : fallback;
};
export function nonlinearPredictionState(beat, progress, cues) {
  const showForward =
      gradientDone(cues, 'fresh-hidden-forward', beat > 0 || progress >= 0.64),
    showGradient =
      (beat > 0 && gradientDone(cues, 'fresh-hidden-gradient', progress > 0.8)) || beat > 1;
  const update =
      beat < 2 ? 0 : beat > 2 ? 1 : gradientCue(cues, 'fresh-hidden-update', gradientPhase(progress, 0.03, 0.4)),
    showAfter = beat > 2 || (beat === 2 && gradientDone(cues, 'fresh-hidden-result', progress > 0.8)),
    step = hiddenStep(0.05, 1, 2);
  return {
    ...step,
    showForward,
    showGradient,
    showAfter,
    update,
    weights: NONLINEAR_START.map((v, i) => v + (step.after.weights[i] - v) * update),
  };
}
