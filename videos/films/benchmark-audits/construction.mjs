import { clip } from './arithmetic.mjs';
import { sceneIds } from './fixtures.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          step: 0,
        },
      },
      cues: [0, 1, 2].map((step) => ({
        id: `${id}-${step}`,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export const auditCue = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clip(cue.progress ?? 0)
    : state.cues
      ? 0
      : fallback;
};
export const auditStarted = (state, id, fallback = false) => {
  const cue = state.cues?.[id];
  return cue ? cue.phase !== 'before' : state.cues ? false : fallback;
};
