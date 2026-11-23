export const LANGUAGE = ['{"status":"passed"}', '{"status":"failed"}'];
export const EOS = '<eos>';
export const VALUE_PREFIX = '{"status":"';
export const FAIL_PREFIX = VALUE_PREFIX + 'fa';
export const SUFFIX = 'iled"}';
export const TOKEN_SCORES = new Map([
  ['The', 9],
  [VALUE_PREFIX, 1],
  ['fa', 3],
  ['passed', 2],
  [SUFFIX, 1],
  [SUFFIX + '!', 8],
  ['"}', 1],
  [EOS, 7],
]);
export const CI_RUN = {
  project: 'project-alpha',
  run_id: 'RUN-842',
  status: 'failed',
  failing_job: 'unit-tests',
};
export const RUN_LOG = 'Run RUN-842 failed in unit-tests after auth-cache timed out.';
export const OPENING_REPLIES = [
  'Sure! ' + JSON.stringify({ status: CI_RUN.status }),
  JSON.stringify({ status: 'passed' }),
];
export const CONSTRUCTION_SCENES = new Set([
  'interface-contract',
  'recursive-stack',
  'conditional-mask',
  'token-index',
  'prefix-jump',
  'mask-schedule',
  'backend-contracts',
  'parser-bytes',
  'nullable-field',
  'wire-contract',
  'ci-snapshot',
  'evidence-action',
  'flat-tree',
  'tool-protocol',
  'sdk-envelope',
  'schema-version',
  'bounded-recovery',
  'host-approval',
  'digest-identities',
  'quality-measure',
  'fresh-nesting',
  'fresh-incident',
]);
