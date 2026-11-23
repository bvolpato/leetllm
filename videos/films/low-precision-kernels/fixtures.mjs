import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'number-grid',
  'stale-scale',
  'local-scales',
  'projection',
  'block-scales',
  'accumulation',
  'traffic',
  'contract',
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
export const small = [0.001, 0.03, 0.117, 0.5, 1, -0.25, 0.0625, -0.015625];
export const large = [4, 16, 64, 500, -2, -8, -32, -250];
export const weightPattern = [0.5, -0.25, 0.125, -0.0625, 0.03125, -0.5, 0.25, -0.125];
export const rows = [
  Array.from(
    {
      length: 32,
    },
    (_, i) => small[i % 8],
  ),
  Array.from(
    {
      length: 32,
    },
    (_, i) => large[i % 8],
  ),
];
export const weights = Array.from(
  {
    length: 32,
  },
  (_, i) => weightPattern[i % 8],
);
export const extendedIds = [
  'format-budget',
  'subnormal-grid',
  'overflow-mode',
  'rounding-probability',
  'scale-conventions',
  'scale-timeline',
  'online-quantization',
  'cpu-contract',
  'scale-bytes',
  'subeight-formats',
  'orientation',
  'abi-dispatch',
  'reference-ladder',
  'fresh-group',
];
