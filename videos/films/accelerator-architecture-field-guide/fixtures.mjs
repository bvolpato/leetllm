import { createCueTrack } from 'vizmatic';
export const ids = ['intro', 'reuse', 'offload', 'lanes', 'tile-order', 'topology', 'gates'];
export const tracks = Object.fromEntries(
  ids.map((id) => [
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
