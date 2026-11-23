import { sum } from './arithmetic.mjs';
export const ids = [
  'intro',
  'agreement',
  'ring',
  'gather',
  'cost',
  'streams',
  'receipt',
  'synthesis',
];
export const inputs = [
  [1, 2, 3, 4],
  [10, 20, 30, 40],
  [100, 200, 300, 400],
  [1000, 2000, 3000, 4000],
];
export const reduced = inputs[0].map((_, i) => sum(inputs.map((row) => row[i])));
export const chapterIds = new Set([
  'ownership-contract',
  'rank-bootstrap',
  'alltoall-layout',
  'traffic-bound',
  'double-tree',
  'group-enqueue',
  'launch-event',
  'buffer-lifetime',
  'topology-matrix',
  'network-path',
  'source-tour',
  'system-shapes',
  'benchmark-contract',
  'inplace-offset',
  'diagnostic-evidence',
  'platform-scope',
  'project-evidence',
  'fresh-first-event',
]);
