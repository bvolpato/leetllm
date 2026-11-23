export const POLICY_ID = 'deploy-freeze-approval-rule';
export const POLICY_TEXT =
  'Rule DEPLOY-17. Payment-service production deploys during a release freeze require incident commander approval and a linked rollback plan before rollout.';
export const policyClaims = Object.freeze([
  {
    id: 'freeze-scope',
    text: 'The request is governed by the release-freeze deploy rule.',
    point: 'freeze-scope',
  },
  {
    id: 'approval',
    text: 'Incident commander approval is required before rollout.',
    point: 'approval',
  },
  {
    id: 'rollback-plan',
    text: 'A linked rollback plan is required before rollout.',
    point: 'rollback-plan',
  },
]);
export const BYPASS_TEXT = 'The deploy can start without a linked rollback plan.';
export const SLICE_OUTCOMES = [
  {
    id: 'F1',
    slice: 'freeze',
    correct: true,
  },
  {
    id: 'F2',
    slice: 'freeze',
    correct: false,
  },
  {
    id: 'H1',
    slice: 'hotfix',
    correct: true,
  },
  {
    id: 'H2',
    slice: 'hotfix',
    correct: true,
  },
  {
    id: 'M1',
    slice: 'migration',
    correct: false,
  },
];
export const CLAIMS = [
  {
    id: 'closed',
    text: 'The library is closed on Sunday.',
    source: 'A',
    point: 'closed',
  },
  {
    id: 'box',
    text: 'The return box is available.',
    source: 'A',
    point: 'box',
  },
  {
    id: 'next',
    text: 'A receipt arrives the next day.',
    source: 'B',
    point: 'receipt',
  },
  {
    id: 'instant',
    text: 'A receipt arrives immediately.',
    source: null,
    point: 'receipt',
  },
  {
    id: 'delivery',
    text: 'Delivery service is available.',
    source: null,
    point: 'delivery',
  },
];
