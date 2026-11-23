export const validationFixture = Object.freeze({
  baseline: {
    correct: 14,
    total: 20,
  },
  compiled: {
    correct: 19,
    total: 20,
  },
});
export const testFixture = Object.freeze({
  baseline: {
    correct: 16,
    total: 20,
  },
  compiled: {
    correct: 13,
    total: 20,
  },
});
export const metricCases = Object.freeze([
  {
    title: 'Approved rollback',
    gold: {
      route: 'SERVE',
      recordId: 'approval-4412',
    },
    prediction: {
      route: 'SERVE',
      recordId: 'approval-4412',
    },
  },
  {
    title: 'Unapproved deployment',
    gold: {
      route: 'ABSTAIN',
      recordId: '',
    },
    prediction: {
      route: 'SERVE',
      recordId: 'approval-4412',
    },
  },
  {
    title: 'No current approval',
    gold: {
      route: 'ABSTAIN',
      recordId: '',
    },
    prediction: {
      route: 'ABSTAIN',
      recordId: '',
    },
  },
]);
export const searchCase = Object.freeze({
  id: 'search-201',
  question: 'Deploy payment-service?',
  evidence: 'approval-4412 permits rollback of payment-tests.',
  ...metricCases[1],
});
export const searchCandidates = Object.freeze([
  Object.freeze({
    id: 'baseline',
    instruction: 'Find an approval and give its ID.',
    example: 'rollback → SERVE · deploy → SERVE',
    ...validationFixture.baseline,
  }),
  Object.freeze({
    id: 'compiled-a',
    instruction: 'Check action and target. Abstain if unsupported.',
    example: 'rollback → SERVE · deploy → ABSTAIN',
    ...validationFixture.compiled,
  }),
]);
export const splitRows = Object.freeze([
  { id: 'req-001', family: 'approval-4412', requestedSplit: 'train' },
  { id: 'req-002', family: 'approval-4412', requestedSplit: 'train' },
  { id: 'req-101', family: 'approval-5501', requestedSplit: 'development' },
  { id: 'req-201', family: 'approval-6601', requestedSplit: 'test' },
  { id: 'rollback-102', family: 'approval-4412', requestedSplit: 'test' },
]);
