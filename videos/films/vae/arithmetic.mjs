export const collapseProgress = (beat, p) => {
  if (beat < 1) return 0;
  if (beat > 1) return 1;
  const t = Math.max(0, Math.min(1, (p - 5.84 / 21.866) / ((9.36 - 5.84) / 21.866)));
  return t * t * (3 - 2 * t);
};
export const collapseCaption = (beat, u) =>
  beat < 1 || u < 0.02
    ? 'different codes, different output'
    : u >= 0.995
      ? 'same output for both codes'
      : 'decoder sensitivity to the code falls';
export const kl = (m, l) => 0.5 * m.reduce((a, v, i) => a + v * v + Math.expm1(l[i]) - l[i], 0);
export const unit = (value) => Math.max(0, Math.min(1, value));
export const spokenProgress = (cues, id, fallback = 0) => {
  const cue = cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : unit(cue.progress)
    : fallback;
};
export const clamped = (v) => Math.max(0, Math.min(1, v));
export const cueAmount = (state, id, fallback = 0) => {
  const q = state.cues?.[id];
  return q ? (q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : clamped(q.progress)) : fallback;
};
export const built = (state, id) => cueAmount(state, id, state.beatP ?? 0) === 1;

// Unmeasured storyboards use a fraction of the beat. Delivered frames use the spoken phrase.
export function beatCue(state, beat, id, start = 0, end = 1) {
  if (state.beat < beat) return 0;
  if (state.beat > beat) return 1;
  return cueAmount(state, id, clamped(((state.beatP ?? 0) - start) / (end - start)));
}

export function gaussianPixelLoss(input, prediction, observationVariance) {
  const errors = input.map((value, i) => (value - prediction[i]) ** 2);
  const sum = errors.reduce((total, value) => total + value, 0);
  const error = sum / (2 * observationVariance);
  const constant = input.length / 2 * Math.log(2 * Math.PI * observationVariance);
  return { errors, sum, mean: sum / input.length, error, constant, nll: error + constant };
}
