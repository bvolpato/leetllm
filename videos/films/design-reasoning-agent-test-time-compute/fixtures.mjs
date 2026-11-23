import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'first',
    snapshot: 0,
  },
  cues: [
    {
      id: 'second',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
    {
      id: 'third',
      beat: 2,
      at: 0,
      snapshot: 2,
    },
  ],
});
export const observation = {
  deploy: 'checkout-42',
  revision: 7,
  observedAt: 100,
  canary: 10,
  smoke: true,
  latency: 240,
};
export const candidates = [
  {
    id: 'A',
    path: ['api', 'legacy_adapter', 'database'],
    score: 0.96,
  },
  {
    id: 'B',
    path: ['api', 'feature_flag', 'database'],
    score: 0.82,
  },
];
export const branches = {
  start: ['Pin parser v2', 'Pin parser nightly', 'Keep parser v1'],
  'Pin parser v2': ['Add compatibility shim', 'Call removed API'],
  'Keep parser v1': ['Patch sanitizer', 'Defer security fix'],
};
export const scores = {
  'Pin parser v2': 0.74,
  'Pin parser nightly': 0.12,
  'Keep parser v1': 0.81,
  'Add compatibility shim': 0.7,
  'Call removed API': 0.18,
  'Patch sanitizer': 0.96,
  'Defer security fix': 0.39,
};
export const invalid = {
  'Pin parser nightly': 'runtime floor',
  'Call removed API': 'removed API',
  'Defer security fix': 'unfixed advisory',
};
export const complete = new Set(['Add compatibility shim', 'Patch sanitizer']);
export const steps = [
  {
    label: 'Parse manifest',
    score: 0.92,
    exact: true,
  },
  {
    label: 'Pin parser v2',
    score: 0.74,
    exact: true,
  },
  {
    label: 'Call removed API',
    score: 0.15,
    exact: false,
  },
  {
    label: 'Recommend deployment',
    score: 0.85,
    exact: true,
  },
];
export const SENTENCES = {
  'intro': [5, 3],
  'api-controls': [3, 4],
  'xml-contract': [4, 4, 5],
  'evidence': [4, 4],
  'candidates': [4, 4],
  'coverage-operation': [4, 4],
  'voting-baseline': [4, 4],
  'tree': [4, 4],
  'tree-contract': [4, 5],
  'puct-allocation': [4, 4, 5],
  'process': [4, 4],
  'verifier-evidence': [4, 4, 4],
  'answer-bias': [4, 4],
  'trained-policy': [4, 3],
  'router-evaluation': [3, 4, 4],
  'budget': [4, 4, 4],
  'reservation-reconcile': [4, 5, 4],
  'incomplete-advisory': [4, 4],
  'memory': [3, 4],
  'kv-byte-model': [4, 6],
  'prefix-lease': [5, 4, 3],
  'eviction-architecture': [4, 4],
  'stopping': [4, 4],
  'safe-progress': [3, 4],
  'evaluation-release': [4, 3, 3],
  'synthesis': [4, 3],
  'fresh-deadline': [8, 6],
};
export const ORIGINAL_SCENES = new Set([
  'intro',
  'evidence',
  'candidates',
  'tree',
  'process',
  'budget',
  'memory',
  'stopping',
  'synthesis',
]);
