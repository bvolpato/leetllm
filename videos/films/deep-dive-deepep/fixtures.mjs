export const ids = [
  'intro',
  'dispatch',
  'layout',
  'combine',
  'rounding',
  'topology',
  'precision',
  'events',
  'resources',
];
export const hidden = {
  a: [1, 0],
  b: [0, 1],
  c: [1, 1],
  d: [2, -1],
};
export const source = {
  a: 0,
  b: 0,
  c: 1,
  d: 1,
};
export const routes = {
  a: [
    [0, 0.7],
    [3, 0.3],
  ],
  b: [
    [2, 0.4],
    [1, 0.6],
  ],
  c: [
    [1, 0.55],
    [3, 0.45],
  ],
  d: [
    [0, 0.25],
    [2, 0.75],
  ],
};
export const finalToken = {
  input: [2, -1],
  cached: [0, 3],
  current: [1, 2],
  gates: [0.2, 0.8],
};
export const chapterIds = new Set([
  'version-boundary',
  'layout-boundaries',
  'handle-lifetime',
  'backward-operators',
  'deterministic-order',
  'visibility-fence',
  'backend-ownership',
  'logical-receipts',
  'historical-benchmark',
  'scale-contract',
  'buffer-capacity',
  'deferred-contract',
  'redundant-experts',
  'balanced-assumptions',
  'resource-budget',
  'jit-cold-start',
  'runtime-identity',
  'legacy-experimental',
  'engram-doorbell',
  'post-training-receipt',
  'ownership-license',
  'source-diagnosis',
  'earned-return',
]);
