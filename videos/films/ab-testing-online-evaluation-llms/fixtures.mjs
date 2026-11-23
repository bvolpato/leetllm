export const ids = [
  'intro',
  'screen',
  'assignment',
  'power',
  'uncertainty',
  'ratio',
  'looks',
  'ship',
];
export const outcomes = [
  {
    id: 'C1',
    assigned: 'C',
    served: 'C',
    y: 1,
  },
  {
    id: 'C2',
    assigned: 'C',
    served: 'C',
    y: 1,
  },
  {
    id: 'C3',
    assigned: 'C',
    served: 'C',
    y: 0,
  },
  {
    id: 'T1',
    assigned: 'T',
    served: 'T',
    y: 1,
  },
  {
    id: 'T2',
    assigned: 'T',
    served: 'C',
    y: 0,
  },
  {
    id: 'T3',
    assigned: 'T',
    served: 'timeout',
    y: 0,
  },
];
export const assignmentBeatSeconds = [24.938, 23.882];
export const observedAt = [0.5, 1.2, 1.9, 2.6, 6.0125, 7.2875];
export const observedUserRows = Object.freeze(
  [
    ['C', 1943, 1181],
    ['T', 2057, 1325],
  ].flatMap(([arm, n, successes]) =>
    Array.from(
      {
        length: n,
      },
      (_, i) =>
        Object.freeze({
          id: arm + String(i + 1).padStart(4, '0'),
          arm,
          y: Number(i < successes),
        }),
    ),
  ),
);
export const ONLINE_AB_NEW_IDS = new Set([
  'point-estimate',
  'measurement-contract',
  'treatment-identity',
  'rubric-evidence',
  'token-clock',
  'feedback-join',
  'power-construction',
  'units-and-spillover',
  'router-ramp',
  'shadow-resource',
  'team-draft',
  'metric-family',
  'valid-looking',
  'srm-residual',
  'interval-construction',
  'window-controller',
  'safety-geometry',
  'zero-incidents',
  'posterior-routing',
  'mix-reweight',
  'judge-data',
  'calibration-audit',
  'inline-asynchronous',
  'release-contract',
  'fresh-release',
]);
export const ONLINE_RUBRIC = Object.freeze(
  [
    {
      id: 'Q1',
      a: [3, 4, 1],
      b: [4, 4, 5],
    },
    {
      id: 'Q2',
      a: [4, 3, 1],
      b: [4, 4, 4],
    },
    {
      id: 'Q3',
      a: [3, 2, 1],
      b: [4, 4, 5],
    },
    {
      id: 'Q4',
      a: [4, 4, 1],
      b: [5, 5, 5],
    },
    {
      id: 'Q5',
      a: [3, 3, 1],
      b: [4, 4, 4],
    },
  ].map((row) =>
    Object.freeze({
      ...row,
      a: Object.freeze(row.a),
      b: Object.freeze(row.b),
    }),
  ),
);
