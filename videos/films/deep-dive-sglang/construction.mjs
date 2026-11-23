import { ids } from './fixtures.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export const cueProgress = (cues, id, fallback) => {
  const cue = cues?.[id];
  return !cue ? fallback : cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress;
};
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export const sgProgress = (state, name, fallback = state.beatP ?? 0) =>
  cueProgress(state.cues, 'sg-' + name, fallback);
export const cueComplete = (cues, id, fallback = false) =>
  cues?.[id] ? cues[id].phase === 'after' : fallback;
export const sgComplete = (state, name, fallback = false) =>
  cueComplete(state.cues, 'sg-' + name, fallback);
export const sgBegun = (state, name, fallback = false) =>
  cueBegun(state.cues, 'sg-' + name, fallback);

// The fallback places the same actions on a silent storyboard's beat clock.
export function motion(state, id, beat, start, end) {
  const local = state.beat + state.beatP - beat;
  return cueProgress(state.cues, id, Math.max(0, Math.min(1, (local - start) / (end - start))));
}

export function settled(state, id, beat, end) {
  return cueComplete(state.cues, id, state.beat + state.beatP >= beat + end);
}
