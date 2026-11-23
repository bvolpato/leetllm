export const pages = Object.freeze([
  {
    id: 'manual-v12/p1',
    title: 'Overview',
    text: 'Use current service endpoints.',
  },
  {
    id: 'manual-v12/p2',
    title: 'Authentication',
    text: 'Rotate production tokens on schedule.',
  },
  {
    id: 'manual-v12/p3',
    title: 'Version history',
    text: 'The search endpoint changed in v4.',
  },
  {
    id: 'manual-v12/p4',
    title: 'Migration',
    text: 'Move callers to the current endpoint.',
  },
  {
    id: 'manual-v12/p5',
    title: 'Exception condition',
    text: 'Legacy token use requires audit logging.',
    field: 'condition',
    value: 'audit logging required',
  },
  {
    id: 'manual-v12/p6',
    title: 'Exception expiry',
    text: 'This exception expires 2026-09-30.',
    field: 'expiry',
    value: '2026-09-30',
  },
  {
    id: 'manual-v12/p7',
    title: 'Examples',
    text: 'Confirm the record ID before reporting.',
  },
  {
    id: 'manual-v12/p8',
    title: 'Appendix',
    text: 'Keep version and page provenance.',
  },
]);
export const leafCues = Array.from(
  {
    length: 8,
  },
  (_, i) => [
    0,
    Number((0.05 + i * 0.09).toFixed(6)),
    {
      count: i + 1,
    },
  ],
);
export const mergeCues = Array.from(
  {
    length: 7,
  },
  (_, i) => [
    1,
    Number((0.05 + i * 0.11).toFixed(6)),
    {
      count: 9 + i,
    },
  ],
);
export const budgetEvents = [
  {
    type: 'reserve',
    id: 'Root',
    calls: 1,
    cost: 2,
  },
  {
    type: 'dispatch',
    id: 'Root',
  },
  {
    type: 'settle',
    id: 'Root',
    cost: 1.5,
  },
  {
    type: 'reserve',
    id: 'Child A',
    calls: 1,
    cost: 3,
  },
  {
    type: 'dispatch',
    id: 'Child A',
  },
  {
    type: 'timeout',
    id: 'Child A',
  },
  {
    type: 'reserve',
    id: 'Child B',
    calls: 1,
    cost: 3,
  },
  {
    type: 'dispatch',
    id: 'Child B',
  },
  {
    type: 'settle',
    id: 'Child B',
    cost: 2,
  },
  {
    type: 'reserve',
    id: 'Child C',
    calls: 2,
    cost: 4,
  },
];
export const budgetCuePositions = [
  [0, 0.12],
  [0, 0.39],
  [0, 0.66],
  [1, 0],
  [1, 0.04],
  [1, 0.13],
  [1, 0.24],
  [1, 0.29],
  [1, 0.38],
  [1, 0.49],
];
export const registry = {
  'export-note/p2': {
    scope: 'billing-export',
    expiry: '2026-10-15',
    applicable: true,
  },
  'manual-v12/p6': {
    scope: 'legacy-token',
    expiry: '2026-09-30',
    applicable: true,
  },
  'bulletin-v13/p2': {
    scope: 'legacy-token',
    expiry: '2026-10-15',
    applicable: true,
  },
  'manual-v11/p6': {
    scope: 'legacy-token',
    expiry: '2026-08-31',
    applicable: false,
  },
};
export const routes = Object.freeze([
  {
    id: 'Direct',
    recall: 0.73,
    cost: 0.08,
    latency: 4.1,
  },
  {
    id: 'REPL only',
    recall: 0.92,
    cost: 0.19,
    latency: 8.7,
  },
  {
    id: 'Recursive',
    recall: 0.95,
    cost: 0.58,
    latency: 24,
  },
]);
export const freshRoutes = [
  { id: 'Direct', recall: 0.91, cost: 0.25, latency: 11 },
  { id: 'REPL only', recall: 0.93, cost: 0.27, latency: 10 },
  { id: 'Recursive', recall: 0.96, cost: 0.45, latency: 9 },
];
export const restoreSource = { condition: 'Approval logging', expiry: '2026-11-15' };
export const restoreSummary = { ...restoreSource, expiry: '2026-11-01' };
