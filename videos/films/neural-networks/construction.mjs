import { clamp, ease, gradientStep } from './arithmetic.mjs';
import { PARAMETERS } from './fixtures.mjs';
import { freshGradient, requestForward } from './model.mjs';
export function cueProgress(state, id, beat) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : ease(((state.beatP ?? 0) - 0.15) / 0.65);
}
export function lampState(state) {
  const second = cueProgress(state, 'second-hinge', 1);
  const combine = cueProgress(state, 'lamp-subtract', 2);
  return {
    second,
    combine,
    total: 2 * cueProgress(state, 'lamp-sweep', 0),
    outputVisible: combine > 0,
    halfway: cueProgress(state, 'halfway-answer', 4),
  };
}
export function triangleConstruction(x, progress) {
  const twoHinges = Math.max(0, x) - 2 * Math.max(0, x - 1),
    addedHinge = clamp(progress) * Math.max(0, x - 2);
  return {
    twoHinges,
    addedHinge,
    sum: twoHinges + addedHinge,
  };
}
export function freshGradientFrame(state) {
  const beat = state.beat ?? 0,
    products = beat > 1 || (beat === 1 && cueProgress(state, 'fresh-gradient-products', 1) === 1);
  const step = beat < 2 ? 0 : cueProgress(state, 'fresh-gradient-step', 2);
  const reveal = beat > 2 || (beat === 2 && cueProgress(state, 'fresh-gradient-result', 2) === 1);
  const gradient = freshGradient(),
    parameters = gradientStep(PARAMETERS, gradient, 0.1 * step);
  return {
    products,
    step,
    reveal,
    gradient,
    parameters,
    result: requestForward([-1, 2], parameters),
  };
}
export function neuralFrame(state) {
  const beat = state.beat ?? 0;
  return {
    beat,
    progress: (id, b) => cueProgress(state, id, b),
    completed: (id, b) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : cueProgress(state, id, b) === 1,
    shown(id, b) {
      if (beat < b) return false;
      if (beat > b) return true;
      const cue = state.cues?.[id];
      return cue ? cue.phase !== 'before' : (state.beatP ?? 0) > 0.15;
    },
  };
}
