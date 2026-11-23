import { createCueTrack } from 'vizmatic';
export const GiB = 2 ** 30;
export const KiB = 2 ** 10;
export const hardware = Object.freeze({
  total: 32 * GiB,
  weights: 12 * GiB,
  runtime: 4 * GiB,
  bandwidth: 500 * GiB,
  pageTokens: 16,
});
export const architecture = Object.freeze({
  layers: 32,
  kvHeads: 8,
  headWidth: 128,
  bytes: 2,
});
export const bytesPerToken =
  2 * architecture.layers * architecture.kvHeads * architecture.headWidth * architecture.bytes;
export const pool = hardware.total - hardware.weights - hardware.runtime;
export const referencePoolBytes = 80e9 - 16e9 - 8 * GiB;
export const sceneIds = [
  'intro',
  'one-token',
  'partition',
  'growth',
  'pages',
  'bandwidth',
  'operating-point',
  'measurement',
];
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
