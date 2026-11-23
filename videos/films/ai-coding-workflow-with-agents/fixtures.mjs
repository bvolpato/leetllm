export const EVENT = 'billing event 78291';
export const OTHER = 'billing event 99002';
export const RACE_WINDOWS = [
  [
    [4.175, 5.2625],
    [5.2625, 6.95],
    [11.5125, 13.2125],
    [13.2125, 14.075],
  ],
  [
    [0.1, 1.575],
    [2.45, 4.6125],
    [5.0375, 5.8125],
    [6.7125, 7.825],
  ],
];
export const owned = new Set(['billing/webhook.ts', 'billing/webhook.test.ts']);
export const REQUIRED_WORKFLOW_CHECKS = Object.freeze([
  'concurrent replay',
  'new event',
  'stored count',
]);
