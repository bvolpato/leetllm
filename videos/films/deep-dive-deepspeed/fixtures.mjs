import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'ownership',
  'reduce',
  'accumulation',
  'gather',
  'offload',
  'checkpoint',
  'synthesis',
];
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
