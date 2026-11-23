export const sceneIds = [
  'opening',
  'policy-baseline',
  'prompt-assembly',
  'prompt-revision',
  'complete-response',
  'input-boundary',
  'regression-evaluation',
  'guarded-recommendation',
];
export const facts = {
  elapsed: 12,
  deadline: 30,
  sourceId: 'IR-7',
  pageSent: false,
  severity: 'P1',
  ruleAvailable: true,
};
export const good = {
  action: 'page_on_call',
  deadline_minutes: 30,
  overdue: false,
  source_line_ids: ['IR-7'],
};
export const nextTeamRule = { deadline: 45, sourceId: 'IR-9' };
export const cases = [
  'nominal P1',
  'missing policy',
  'exact boundary',
  'overdue',
  'prior page',
  'adversarial note',
];
export const oldPass = [true, true, true, true, false, false];
export const newPass = [true, true, true, false, true, false];
// The exported construction helpers also support the original measured timeline.
export const spans = {
  clock: 13.164,
  assembly: 14.316,
  revision: 14.388,
  response: 13.764,
  checks: 14.848,
  wrong: 15.376,
  regression: 14.172,
};
