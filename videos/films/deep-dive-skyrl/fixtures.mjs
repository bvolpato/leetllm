import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'masks',
  'group',
  'schedules',
  'capacity',
  'filter',
  'replicas',
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
export const tokens = [11, 12, 90, 21, 22];
export const mask = [1, 1, 0, 1, 1];
export const rewards = [0, -0.2, 0, 0, 1];
export const labels = ['try', 'query', 'DB error', 'repair', 'query'];
export const trace = [
  {
    step: 1,
    id: 'A',
    scheduled: 1,
    accepted: 2,
    running: 1,
  },
  {
    step: 2,
    id: 'B',
    scheduled: 1,
    accepted: 3,
    running: 1,
  },
  {
    step: 3,
    id: 'C',
    scheduled: 2,
    accepted: 3,
    running: 1,
  },
  {
    step: 4,
    id: 'L',
    scheduled: 1,
    accepted: 4,
    running: 0,
  },
];
export const skyNewScenes = new Set([
  'version-contract',
  'project-lineage',
  'seams-record',
  'generator-runtime',
  'token-boundary',
  'reward-endpoints',
  'trainer-pass',
  'policy-ratio',
  'reward-normalization',
  'schedule-comparison',
  'admission-math',
  'probability-provenance',
  'zero-variance-policy',
  'epoch-exhaustion',
  'config-contract',
  'routing-session',
  'transfer-stages',
  'cache-recompute',
  'tinker-futures',
  'loss-conversion',
  'research-snapshot',
  'source-diagnosis',
  'operator-gates',
  'checkpoint-state',
  'earned-handoff',
]);
