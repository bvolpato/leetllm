import { createCueTrack } from 'vizmatic';
export const track = (initial, cues) =>
  createCueTrack({
    initial: {
      id: 'initial',
      snapshot: initial,
    },
    cues: cues.map(([beat, at, snapshot], i) => ({
      id: `cue-${i}`,
      beat,
      at,
      snapshot,
    })),
  });
