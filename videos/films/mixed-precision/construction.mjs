import { cueProgressFromState } from './model.mjs';
import { fp16 } from './arithmetic.mjs';

export function operation(state, id) {
  return cueProgressFromState(state, id, state.beatP ?? 0);
}

export function completed(state, id) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : !state.cues && (state.beatP ?? 0) >= 1;
}

export function partProgress(progress, index, count) {
  return Math.max(0, Math.min(1, progress * count - index));
}

export function partialSumConstruction(state, inputs = [40000, 40000, -40000]) {
  const step = completed(state, 'partial-final')
    ? 3
    : completed(state, 'partial-second')
      ? 2
      : completed(state, 'partial-first')
        ? 1
        : 0;
  return {
    step,
    inputs,
    fp16: inputs.slice(0, step).reduce((sum, value) => fp16(sum + value), 0),
    fp32: inputs.slice(0, step).reduce((sum, value) => Math.fround(sum + value), 0),
    incoming:
      step < 3 ? operation(state, ['partial-first', 'partial-second', 'partial-final'][step]) : 0,
  };
}

export function spikeScaleFixture(input = 512, previousMaximum = 8, maximum = 448) {
  return [input, previousMaximum].map((amax) => {
    const step = amax / maximum;
    const encoded = Math.min(input / step, maximum);
    return { amax, step, encoded, restored: encoded * step };
  });
}

export function saturationFixture(input = 500, maximum = 448) {
  const stored = Math.min(input, maximum);
  return { input, maximum, stored, error: Math.abs(input - stored) };
}
