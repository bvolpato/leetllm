import { canaryCue, fit, outcomeRows } from './arithmetic.mjs';
import { createHash } from 'node:crypto';
export const train = [0, 1, 2, 8, 9, 10].map((x, i) => ({
  x,
  y: i < 3 ? 0 : 1,
}));
export const pendingWindow = {
  id: 'early',
  day: 0,
  ms: 150,
  error: 0,
  labelsReady: false,
  qualityRows: null,
};
export const passingWindow = {
  id: 'mature',
  day: 7,
  ms: 160,
  error: 0,
  labelsReady: true,
  qualityRows: outcomeRows(23),
};
export const CANARY_EVIDENCE_CUES = {
  labels: [174.1, 175.6, 177.1, 178.9].map(canaryCue),
  costs: [180.7, 181.6, 182.5, 183.35].map(canaryCue),
  controller: canaryCue(196.695),
};
export const regressingHistory = [
  {
    ...passingWindow,
    id: 'earlier-regression',
    qualityRows: outcomeRows(28.5),
  },
  {
    ...passingWindow,
    id: 'later-improvement',
    day: 8,
  },
];
export const failedTraining = [0, 1, 2, 16, 17, 18].map((x, i) => ({
  x,
  y: i < 3 ? 0 : 1,
}));
export const bundle = fit(train);
export const failedBundle = fit(failedTraining);
export const OFFLINE_CASES = Object.freeze(
  [9, 8, 1, 0].map((x, i) =>
    Object.freeze({
      id: 'eval-' + (i + 1),
      x,
      gold: i < 2,
      critical: i < 2,
    }),
  ),
);
export const OFFLINE_POLICY = Object.freeze({
  recallFloor: 0.9,
  costRegressionLimit: 0,
});
export const packageDigest = createHash('sha256')
  .update(
    JSON.stringify({
      schema: 'delay-v1',
      training: 'train-v1',
      bundle,
    }),
  )
  .digest('hex');
export const priorBundle = Object.freeze({
  ...bundle,
  slope: 0,
  intercept: 0,
});
export const RETAINED_RELEASES = Object.freeze(
  Object.fromEntries(
    [
      ['v0', priorBundle, 'retained-baseline'],
      ['v1', bundle, 'train-v1'],
    ].map(([release, model, training]) => {
      const bytes = JSON.stringify({
        schema: 'delay-v1',
        training,
        bundle: model,
      });
      return [
        release,
        Object.freeze({
          bytes,
          sha256: createHash('sha256').update(bytes).digest('hex'),
        }),
      ];
    }),
  ),
);
export const HAND_FAIL = Object.freeze(
  OFFLINE_CASES.map((r, i) =>
    Object.freeze({
      ...r,
      pred: i === 0,
      cost: 24,
      baseline: 25,
    }),
  ),
);
export const promotionPolicy = Object.freeze({
  id: 'P1',
  latency: 250,
  recall: 0.9,
  cost: 0,
});
