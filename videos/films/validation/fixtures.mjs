export const foldScores = [0.67, 0.75, 0.58, 0.83, 0.71];
export const labels = [0, 1, 0, 1, 0, 1, 0, 1];
export const users = labels.map((label, i) => ({
  id: i,
  label,
}));
export const validation = [
  {
    p: 0.82,
    y: 1,
  },
  {
    p: 0.62,
    y: 1,
  },
  {
    p: 0.58,
    y: 1,
  },
  {
    p: 0.42,
    y: 0,
  },
  {
    p: 0.31,
    y: 0,
  },
  {
    p: 0.12,
    y: 0,
  },
];
export const test = [
  {
    p: 0.77,
    y: 1,
  },
  {
    p: 0.49,
    y: 1,
  },
  {
    p: 0.39,
    y: 0,
  },
  {
    p: 0.52,
    y: 0,
  },
  {
    p: 0.66,
    y: 1,
  },
  {
    p: 0.14,
    y: 0,
  },
];
export const trainingFeatures = [2, 4, 6];
export const allFeatures = [...trainingFeatures, 20];
export const shiftStart = 6.6 / 17.67;
export const shiftEnd = 8.675 / 17.67;
export const LEAK_ROWS = Object.freeze(
  [
    [1.4, 0, 1],
    [-0.2, 1, 0],
    [0.8, 0, 1],
    [0.1, 1, 0],
    [1.1, 0, 1],
    [-0.5, 1, 0],
    [0.3, 0, 0],
    [0.6, 1, 1],
  ].map(([ambiguity, policy, y], i) =>
    Object.freeze({
      id: 'r' + i,
      ambiguity,
      policy,
      y,
    }),
  ),
);
export const SELECTOR = Object.freeze({
  T: [1, 1, 0, 0, 1, 1, 0, 0],
  L: [1, 0, 0, 0, 1, 0, 1, 0],
  y: [1, 1, 0, 0, 1, 0, 1, 0],
});
export const openingRecord = [
  { name: 'Ambiguity score', observed: '2026-07-01T08:59:00Z' },
  { name: 'Prior exceptions (90 days)', observed: '2026-07-01T08:59:00Z' },
  { name: 'Manager approval', observed: '2026-07-01T10:22:00Z' },
  { name: 'Audit revocation', observed: '2026-07-15T12:00:00Z' },
];
export const snapshots = ['2026-07-01T09:00:00Z', '2026-07-01T10:22:00Z', '2026-07-15T12:00:00Z'];
export const retentionDays = { C: 7, D: 30 };
export const defaultDays = 30;
