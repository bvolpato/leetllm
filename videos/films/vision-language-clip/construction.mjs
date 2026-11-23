import { smoothstep } from 'vizmatic';
export function towerEncodingState(state) {
  const beat = state.beat ?? 0;
  const progress = (id, from, to) => {
    if (beat > 0) return 1;
    const cue = state.cues?.[id];
    if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
    return Math.max(0, Math.min(1, ((state.beatP ?? 0) - from) / (to - from)));
  };
  const path = (amount) => ({
    amount,
    encoder: smoothstep(amount / 0.3),
    vector: smoothstep((amount - 0.45) / 0.4),
  });
  return {
    image: path(progress('towers-beat-1-focus-1', 0.02, 0.3)),
    text: path(progress('towers-text-encoding', 0.32, 0.68)),
  };
}
export const bounded = (value) => Math.max(0, Math.min(1, value));
export function spokenProgress(state, id, beat) {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue ? bounded(cue.progress) : smoothstep(bounded(((state.beatP ?? 0) - 0.18) / 0.6));
}
