import { scaledCosine } from './arithmetic.mjs';
export const ids = [
  'intro',
  'geometry',
  'threshold',
  'gates',
  'admission',
  'economics',
  'evidence',
  'synthesis',
];
export const scope = Object.freeze({
  tenant: 'public',
  access: 'policy-reader',
  release: 'R7',
  locale: 'en',
  schema: 'text-v1',
});
export const answer = Object.freeze({
  text: 'Revoked keys remain visible in the audit log for 30 days.',
  field: 'audit-retention',
  scope,
  expires: 200,
  source: 'policy-R7',
});
export const probes = Object.freeze([
  {
    id: 'Q1',
    score: 0.9992,
    field: 'audit-retention',
  },
  {
    id: 'Q2',
    score: 0.998,
    field: 'audit-retention',
  },
  {
    id: 'Q3',
    score: 0.996,
    field: 'audit-retention',
  },
  {
    id: 'Q4',
    score: 0.995,
    field: 'audit-retention',
  },
  {
    id: 'Q5',
    score: 0.9944,
    field: 'restore-key',
  },
]);
export const ESTABLISHED_SCENES = new Set(ids);
export const ARTICLE_RECORD = Object.freeze({
  answer_id: 'ans_api_key_retention_30d',
  source_query: 'How long are revoked API keys retained?',
  response: 'Revoked API keys remain visible in audit logs for 30 days.',
  scope: {
    release_id: 'policy-answerer@sha256:df2d4fe7b0c5',
    corpus_version: 'api-key-policy-2026-04',
    tenant_id: 'docs-public',
    access_scope: 'public-policy',
    locale: 'en-US',
    response_schema: 'cited-answer-v2',
  },
  response_class: 'public-policy',
  admission_evidence_id: 'eval-public-policy-api-keys-v4',
  expires_at: 4600,
});
export const SHADOW_ROWS = Object.freeze([
  {
    id: 'P1',
    score: scaledCosine([1, 0], [0.99, 0.04]),
    eligible: true,
    correct: true,
  },
  {
    id: 'P2',
    score: 0.998,
    eligible: true,
    correct: true,
  },
  {
    id: 'P3',
    score: 0.996,
    eligible: true,
    correct: true,
  },
  {
    id: 'P4',
    score: 0.995,
    eligible: true,
    correct: true,
  },
  {
    id: 'P5',
    score: scaledCosine([1, 0], [0.94, 0.1]),
    eligible: true,
    correct: false,
  },
  {
    id: 'P6',
    score: 0,
    eligible: false,
    correct: false,
  },
  {
    id: 'P7',
    score: 0.997,
    eligible: false,
    correct: false,
  },
]);
