import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'budget',
  'complete-turns',
  'overflow',
  'compaction',
  'placement',
  'exact-counts',
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
export const limit = 32;
export const output = 8;
export const mandatory = 8;
export const exchanges = [
  {
    id: 'E3 newest',
    units: 6,
  },
  {
    id: 'E2 middle',
    units: 8,
  },
  {
    id: 'E1 oldest',
    units: 12,
  },
];
export const approval = Object.freeze({
  approved: true,
  actor: 'incident lead',
  source: 'D1',
});
export const longChapters = new Set([
  'cost-length',
  'cache-shape',
  'mixed-layers',
  'local-visibility',
  'position-dials',
  'basis-consistency',
  'cache-execution',
  'distributed-context',
  'evidence-route',
  'release-slices',
  'your-turn',
]);
export const records = Object.freeze([
  {
    id: 'r1',
    month: 'Mar',
    service: 'A',
    type: 'timeout',
    score: 0.99,
  },
  {
    id: 'r2',
    month: 'Mar',
    service: 'A',
    type: 'timeout',
    score: 0.98,
  },
  {
    id: 'r3',
    month: 'Mar',
    service: 'B',
    type: 'timeout',
    score: 0.8,
  },
  {
    id: 'r4',
    month: 'Mar',
    service: 'B',
    type: 'timeout',
    score: 0.79,
  },
  {
    id: 'r5',
    month: 'Mar',
    service: 'B',
    type: 'timeout',
    score: 0.78,
  },
  {
    id: 'r6',
    month: 'Feb',
    service: 'A',
    type: 'timeout',
    score: 0.97,
  },
  {
    id: 'r7',
    month: 'Mar',
    service: 'A',
    type: 'success',
    score: 0.96,
  },
]);
