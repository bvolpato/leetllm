export const ids = [
  'opening',
  'fingerprint',
  'paired',
  'tradeoff',
  'lineage',
  'comparability',
  'platforms',
  'feedback',
  'handoff',
];
export const CASES = [
  {
    id: 'incident',
    caseId: 'req_205',
    slice: 'unsupported_approval',
    source: 'incident',
    evidence: 'no approval support',
    expected: 'ABSTAIN',
  },
  {
    id: 'known good',
    caseId: 'reg_002',
    slice: 'confirmed_freeze_status',
    source: 'known_good',
    evidence: 'release record',
    expected: 'SERVE',
  },
  {
    id: 'rollback',
    caseId: 'hold_001',
    slice: 'rollback_guidance',
    source: 'holdout',
    evidence: 'rollback runbook',
    expected: 'SERVE',
  },
  {
    id: 'missing',
    caseId: 'hold_002',
    slice: 'missing_approval_record',
    source: 'holdout',
    evidence: 'no approval support',
    expected: 'ABSTAIN',
  },
];
export const candidateIds = ['regressed', 'first repair', 'revision'];
export const sentenceCounts = {
  'run-storage': [4, 5],
  'saturation': [5, 5],
  'registry-object': [5, 5],
  'review-boundary': [5, 6],
  'compiled-contract': [4, 3],
  'fresh-contract': [6, 5, 4],
};
export const canonicalFresh = Array.from(
  {
    length: 6,
  },
  (_, i) => ({
    id: String.fromCharCode(65 + i),
    expected: i % 2 ? 'ABSTAIN' : 'SERVE',
    predicted: i % 2 ? 'ABSTAIN' : 'SERVE',
  }),
);
