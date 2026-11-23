export const PRINCIPAL = {
  id: 'analyst',
  tenant: 'A',
  groups: ['operations'],
};
export const POLICY = {
  revision: 42,
  groups: ['operations'],
  deleted: false,
  valid: true,
};
export const CANDIDATES = [
  {
    id: 'R1',
    score: 1,
    tenant: 'B',
    grant: 'security',
  },
  {
    id: 'R2',
    score: 0.99,
    tenant: 'A',
    grant: 'security',
  },
  {
    id: 'R3',
    score: 0.98,
    tenant: 'B',
    grant: 'security',
  },
  {
    id: 'R4',
    score: 0.97,
    tenant: 'A',
    grant: 'security',
  },
  {
    id: 'R5',
    score: 0.96,
    tenant: 'A',
    grant: 'security',
  },
  {
    id: 'R6',
    score: 0.71,
    tenant: 'A',
    grant: 'operations',
    title: 'Incident checklist',
  },
  {
    id: 'R7',
    score: 0.48,
    tenant: 'A',
    grant: 'operations',
    title: 'Operations runbook',
  },
].map((record) => ({
  ...record,
  policyRevision: 42,
}));
export const RECALL_CUES = Object.freeze({
  duration: 15.604,
  exactReady: 2.5,
  boundedStart: 4.2,
  boundedComplete: 8.3,
});
export const SECURE_SOURCES = [
  {
    id: 'checklist',
    tenant: 'A',
    revision: 1,
    policy: 42,
    grant: 'tenant',
    title: 'Incident checklist',
  },
  {
    id: 'FAQ',
    tenant: 'A',
    revision: 3,
    policy: 42,
    grant: 'operations',
    department: 'operations',
    title: 'Operations FAQ',
  },
  {
    id: 'key',
    tenant: 'A',
    revision: 7,
    policy: 42,
    grant: 'security',
    title: 'Signing-key runbook',
  },
  {
    id: 'plan',
    tenant: 'A',
    revision: 2,
    policy: 42,
    grant: 'executive',
    title: 'Acquisition plan',
  },
];
