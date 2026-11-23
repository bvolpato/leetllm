export const sceneIds = [
  'opening',
  'assemble-app',
  'input-contract',
  'policy-check',
  'trace-lifecycle',
  'browser-outcome',
  'failure-boundaries',
  'evaluation',
];
export const accountFacts = {
  acct_10234: {
    credential_age_days: 45,
    key_stale: true,
  },
  acct_10235: {
    credential_age_days: 12,
    key_stale: true,
  },
  acct_10236: {
    credential_age_days: 45,
    key_stale: false,
  },
  acct_10237: {
    credential_age_days: 30,
    key_stale: true,
  },
};
export const spans = {
  policyKnown: 13.212,
  policyMissing: 13.908,
  provider: 13.98,
  terminal: 14.68,
  browser: 16.532,
  reload: 16.912,
};
export const request = {
  account_id: 'acct_10234',
  credential_report: 'Service-account key is stale.',
};
