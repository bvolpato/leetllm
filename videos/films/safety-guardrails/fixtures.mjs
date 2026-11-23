import { deploymentDigest } from './arithmetic.mjs';
export const POLICY_V7 = Object.freeze({
  revision: 'policy-7',
  injectionThreshold: 0.8,
  deployApprovalRequired: true,
  secretExportAllowed: false,
});
export const APPROVED_DEPLOYMENT = Object.freeze({
  action: 'deploy',
  target: 'production/payment-service',
  revision: 'rev42',
});
export const TRUSTED_DEPLOYMENT_APPROVALS = Object.freeze({
  grant14: Object.freeze({
    id: 'grant14',
    actor: 'actor-99',
    ...APPROVED_DEPLOYMENT,
    actionDigest: deploymentDigest(APPROVED_DEPLOYMENT),
    expiresAt: 900,
    consumed: false,
  }),
});
export const DEPLOYMENT_SESSIONS = Object.freeze({
  match: Object.freeze({
    id: 'actor-99',
    authenticated: true,
  }),
  mismatch: Object.freeze({
    id: 'actor-17',
    authenticated: true,
  }),
});
export const extendedGuardScenes = new Set([
  'input-fixtures',
  'detector-contract',
  'output-fixture',
  'argument-contract',
  'approval-replay',
  'approval-atomic',
  'schema-mask',
  'untrusted-observations',
  'canary-stream',
  'sensitive-formats',
  'claim-agreement',
  'evidence-verdict',
  'retrieval-proof',
  'policy-reload',
  'policy-live-authority',
  'budget-schedule',
  'streaming-contract',
  'async-deadline',
  'model-taxonomy',
  'prevalence-shift',
  'fallback-policy',
  'governance-logs',
  'fresh-boundary',
]);
