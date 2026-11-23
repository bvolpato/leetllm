import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'strides',
  'autograd',
  'attention',
  'compile',
  'placement',
  'residency',
  'recovery',
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
export // Measured word-event offsets in unchanged narration; beatP spans spoken duration plus hold.
const RESIDENCY_CUES = Object.freeze({
  gather: {
    span: 18.936,
    start: 10.5875,
    end: 13.9625,
  },
  release: {
    span: 20.184,
    start: 3.2375,
    end: 6.375,
  },
  retain: 6.7875,
});
export const originalIds = new Set(ids);
