import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'tiles',
  'online',
  'mask',
  'packed',
  'backward',
  'contracts',
  'synthesis',
];
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
export const scores = [1, 2, 3, 0];
export const packedValues = [2, 4, 8, 100, 200];
export const values = [
  [10, 0],
  [0, 10],
  [5, 5],
  [9, 1],
];
