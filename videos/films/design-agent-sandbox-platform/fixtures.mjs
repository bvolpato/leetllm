export const ids = [
  'intro',
  'boundary',
  'cow',
  'freshness',
  'filesystem',
  'network',
  'capacity',
  'retirement',
];
export const cloneChecks = ['timekeeping', 'uniqueness', 'network', 'control'];
export const suppliedCloneReceipts = cloneChecks.map((check, i) => ({
  id: 'CLONE-PROBE-' + (i + 1),
  clone: 'clone-A',
  check,
  status: 'Pass',
}));
