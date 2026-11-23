import { createCueTrack } from 'vizmatic';
export const ids = ['intro', 'dot', 'scales', 'movement', 'packing', 'indexer', 'overlap'];
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
export const counts = [64, 192, 32, 128];
export const freshRows = [96, 257, 0];
export const layerRuns = [
  { name: 'Baseline', prep: 20, kernel: 100 },
  { name: 'Candidate', prep: 60, kernel: 70 },
];
export const finalRuns = [
  { name: '128-row blocks', elapsed: 120, returned: [5, 9] },
  { name: '256-row blocks', elapsed: 105, returned: [9, 5] },
];
export const freshReference = { tokens: ['t4', 't6'], values: [5, 9] };
export const routedReturns = [
  { token: 't7', experts: [0, 2], values: [4, 8], weights: [0.25, 0.75] },
  { token: 't9', experts: [0, 2], values: [2, 6], weights: [0.75, 0.25] },
];
export const serial = [
  {
    id: 'A dispatch',
    start: 0,
    end: 1,
    lane: 0,
  },
  {
    id: 'A compute',
    start: 1,
    end: 3,
    lane: 1,
  },
  {
    id: 'A combine',
    start: 3,
    end: 4,
    lane: 0,
  },
  {
    id: 'B dispatch',
    start: 4,
    end: 5,
    lane: 0,
  },
  {
    id: 'B compute',
    start: 5,
    end: 7,
    lane: 1,
  },
  {
    id: 'B combine',
    start: 7,
    end: 8,
    lane: 0,
  },
];
export const parallel = [
  {
    id: 'A dispatch',
    start: 0,
    end: 1,
    lane: 0,
  },
  {
    id: 'A compute',
    start: 1,
    end: 3,
    lane: 1,
  },
  {
    id: 'A combine',
    start: 3,
    end: 4,
    lane: 0,
  },
  {
    id: 'B dispatch',
    start: 1,
    end: 2,
    lane: 0,
  },
  {
    id: 'B compute',
    start: 3,
    end: 5,
    lane: 1,
  },
  {
    id: 'B combine',
    start: 5,
    end: 6,
    lane: 0,
  },
];
export const DEEP_GEMM_SENTENCES = {
  'intro': [6, 6, 3],
  'project-boundary': [5, 7, 5],
  'dot': [4, 3, 4],
  'gemm-contract': [5, 4, 4],
  'reuse-budget': [6, 5, 4],
  'scales': [4, 4, 4],
  'precision-contracts': [5, 5, 5],
  'movement': [5, 3, 3],
  'stage-lifetime': [6, 5, 5],
  'jit-contract': [5, 4, 4],
  'deepjit-migration': [5, 5, 4],
  'packing': [3, 3, 4],
  'routed-denominators': [5, 4, 5],
  'grouped-modes': [5, 5, 4],
  'indexer': [4, 4, 4],
  'indexer-contract': [6, 5, 5],
  'sparse-position-map': [5, 5, 4],
  'overlap': [3, 3, 3, 3],
  'moe-graph': [6, 5, 2, 4],
  'ring-ownership': [5, 5, 5],
  'locality-epilogue': [5, 5, 5],
  'benchmark-receipt': [5, 3, 5],
  'profile-the-layer': [5, 4, 4, 3],
  'determinism': [5, 5, 4],
  'bringup-triage': [4, 5, 4],
  'fresh-contract': [3, 5, 4, 4, 4],
};
export const sentenceCues = (id) => DEEP_GEMM_SENTENCES[id].flatMap((count, beat) =>
  Array.from({ length: count }, (_, i) => `dg-${id}-${beat}-${i}`),
);
