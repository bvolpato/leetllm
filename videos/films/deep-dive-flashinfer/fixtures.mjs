export const ids = ['intro', 'pointers', 'pages', 'causal', 'merge', 'planning', 'synthesis'];
export const requests = [
  {
    id: 'R0',
    q: 3,
    pages: [7, 2],
    tail: 2,
  },
  {
    id: 'R1',
    q: 1,
    pages: [11],
    tail: 2,
  },
  {
    id: 'R2',
    q: 4,
    pages: [3, 14, 6],
    tail: 1,
  },
];
export const EXTRA_IDS = new Set([
  'project-lineage',
  'layout-payload',
  'page-permutation',
  'causal-rule',
  'merge-recurrence',
  'merge-units',
  'merge-domain',
  'merge-partition',
  'wrapper-call',
  'offset-migration',
  'graph-contract',
  'split-schedule',
  'backend-support',
  'startup-logging',
  'integration-lease',
  'correctness-matrix',
  'profile-boundary',
  'paper-evidence',
  'source-route',
  'feature-limits',
  'fresh-tail',
]);
