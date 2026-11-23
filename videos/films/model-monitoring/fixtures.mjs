import { createHash } from 'node:crypto';
export const requests = [
  {
    id: 's-100',
    age: 10,
    backlog: 18,
    heartbeatHours: 2,
    score: 0.18,
  },
  {
    id: 's-101',
    age: 20,
    backlog: 27,
    heartbeatHours: 8,
    score: 0.44,
  },
  {
    id: 's-102',
    age: 25,
    backlog: 35,
    heartbeatHours: 20,
    score: 0.76,
  },
  {
    id: 's-103',
    age: 15,
    backlog: null,
    heartbeatHours: 26,
    score: null,
  },
  {
    id: 's-104',
    age: 180,
    backlog: 22,
    heartbeatHours: 6,
    score: 0.52,
  },
  {
    id: 's-105',
    age: 5,
    backlog: 40,
    heartbeatHours: 30,
    score: 0.91,
  },
];
export const deployed = {
  model: 'job-risk-v3',
  featureContract: 'features-v3',
  threshold: 0.5,
};
export const reference = [0.5, 0.3, 0.15, 0.05];
export const current = [0.3, 0.25, 0.25, 0.2];
export const psiTerms = reference.map(
  (expected, index) => (current[index] - expected) * Math.log(current[index] / expected),
);
export const psi = psiTerms.reduce((sum, value) => sum + value, 0);
export const predictionRows = [
  {
    id: 'p-001',
    score: 0.15,
    label: false,
    dueHours: -5,
    threshold: 0.5,
    arrivalHours: -1,
    priority: false,
  },
  {
    id: 'p-002',
    score: 0.32,
    label: false,
    dueHours: -4,
    threshold: 0.5,
    arrivalHours: -1,
    priority: false,
  },
  {
    id: 'p-003',
    score: 0.68,
    label: true,
    dueHours: -3,
    threshold: 0.5,
    arrivalHours: -1,
    priority: true,
  },
  {
    id: 'p-004',
    score: 0.78,
    label: false,
    dueHours: -2,
    threshold: 0.5,
    arrivalHours: -1,
    priority: false,
  },
  {
    id: 'p-005',
    score: 0.91,
    label: true,
    dueHours: -1,
    threshold: 0.5,
    arrivalHours: 1,
    priority: true,
  },
  {
    id: 'p-006',
    score: 0.84,
    label: null,
    dueHours: 1,
    threshold: 0.5,
    arrivalHours: null,
    priority: true,
  },
];
export const dueHours = predictionRows.map((row) => row.dueHours);
export const dueDomain = [Math.min(...dueHours), Math.max(...dueHours)];
export const mature = predictionRows.filter((row) => row.dueHours <= 0);
export const scoredMature = mature.map((row) => ({
  ...row,
  decision: row.score >= row.threshold,
}));
export const tp = scoredMature.filter((row) => row.decision && row.label).length;
export const fp = scoredMature.filter((row) => row.decision && !row.label).length;
export const fn = scoredMature.filter((row) => !row.decision && row.label).length;
export const parity = {
  training: 20 / 50,
  serving: 20 / 100,
};
export const driftArrivals = [
  [0.08, 0.42],
  [0.51, 0.85],
  [0.02, 0.22],
  [0.25, 0.49],
];
export const paritySweep = [50, 100, 200].map((trainingCapacity) => ({
  trainingCapacity,
  servingCapacity: 100,
  training: 20 / trainingCapacity,
  serving: 20 / 100,
}));
export const delayedCostCohort = {
  missedDeadlines: 2,
  falseAlerts: 10,
  rows: 500,
  missCost: 10,
  reviewCost: 2,
};
export const delayedErrorCostPer1000 =
  (1000 *
    (delayedCostCohort.missedDeadlines * delayedCostCohort.missCost +
      delayedCostCohort.falseAlerts * delayedCostCohort.reviewCost)) /
  delayedCostCohort.rows;
export const delayedErrorCostLimit = 50;
export const canary = {
  errorRate: 0.002,
  errorLimit: 0.005,
  p95Ms: 44,
  p95LimitMs: 50,
  peakQueue: 0.72,
  queueLimit: 0.8,
};
export const canaryPass =
  canary.errorRate <= canary.errorLimit &&
  canary.p95Ms <= canary.p95LimitMs &&
  canary.peakQueue <= canary.queueLimit;
export const finalReleaseAction =
  canaryPass && delayedErrorCostPer1000 <= delayedErrorCostLimit ? 'promote' : 'rollback';
export const jobBucket = (id) =>
  Number(
    BigInt(
      '0x' +
        createHash('sha256')
          .update('job-risk-canary-v1:' + id, 'utf8')
          .digest('hex')
          .slice(0, 16),
    ) % 100n,
  );
export const assignmentBuckets = Array.from(
  {
    length: 1000,
  },
  (_, i) => jobBucket(`job-${String(i).padStart(4, '0')}`),
);
