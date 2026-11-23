export const tokenValues = Object.freeze([3, 1, 4, 2, 2, 5, 1, 3]);
export const extendedValues = Object.freeze([...tokenValues, 6, 0]);
export const ids = [
  'intro',
  'residence',
  'mapping',
  'warps',
  'coalescing',
  'banks',
  'barrier',
  'clocks',
  'budget',
  'synthesis',
  'transfer',
];
export const writeTimes = [0.4, 1.6, 0.8, 2];
export const addedScenes = new Set([
  'stack-contract',
  'ticket-step',
  'storage-scope',
  'activation-budget',
  'precision-slots',
  'large-model-budget',
  'precision-controls',
  'allocator-ledger',
  'copy-dependencies',
  'occupancy-resources',
  'profile-choice',
  'full-step-contract',
  'fresh-runtime',
]);
export const freshRuntimeValues = Object.freeze([...tokenValues, 6, 0, 2, 1, 5]);

export const ticketClock = Object.freeze({
  hostStart: 0, hostReturn: 2, eventStart: 1, eventEnd: 41, scalarAt: 42,
});
export const freshClock = Object.freeze({
  hostStart: 4, hostReturn: 6, eventStart: 5, eventEnd: 23, scalarAt: 24,
});
