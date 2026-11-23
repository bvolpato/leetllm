export const sceneIds = [
  'opening',
  'historical-pattern',
  'rulebook',
  'rule-growth',
  'learning',
  'search',
  'training-compute',
  'serving-break-even',
  'policy-gate',
];
export const LEARNING_UNKNOWN_REPORT_AT = 7.2125 / (12.744 + 0.8);
export const SEARCH_FOUR_CANDIDATES_AT = 7.975 / (13.248 + 0.85);
export const SEARCH_UNSAFE_ACTION_AT = 3.7625 / (13.2 + 0.9);
export const baselineCases = [
  {
    text: 'decode timeout in prod',
    expected: 'latency',
  },
  {
    text: 'tokens arrive slowly',
    expected: 'latency',
  },
  {
    text: 'answer cites wrong doc',
    expected: 'quality',
  },
  {
    text: 'citation points to stale source',
    expected: 'quality',
  },
  {
    text: 'password reset please',
    expected: 'access',
  },
  {
    text: "can't authenticate",
    expected: 'access',
  },
];
export const expandedRules = [
  'timeout',
  'tokens',
  'cites',
  'citation',
  'stale source',
  'password',
  'authenticate',
];
export const newPhrases = [
  {
    text: 'TTFT spiked today',
    expected: 'latency',
  },
  {
    text: 'the response used an unsupported claim',
    expected: 'quality',
  },
  {
    text: 'OAuth callback fails again',
    expected: 'access',
  },
];
export const trainingCases = [
  {
    text: 'decode latency timeout',
    label: 'latency',
  },
  {
    text: 'ttft spike tokens',
    label: 'latency',
  },
  {
    text: 'wrong citation unsupported answer',
    label: 'quality',
  },
  {
    text: 'stale source hallucination',
    label: 'quality',
  },
  {
    text: 'password login access',
    label: 'access',
  },
  {
    text: 'oauth callback auth',
    label: 'access',
  },
];
export const heldOut = [
  {
    text: 'latency spike tokens',
    expected: 'latency',
  },
  {
    text: 'unsupported citation answer',
    expected: 'quality',
  },
  {
    text: 'reset password',
    expected: 'access',
  },
  {
    text: 'stale source answer',
    expected: 'quality',
  },
  {
    text: 'bad graph query',
    expected: 'manual_review',
  },
];
export const historyRows = [
  {
    domain: 'Chess',
    earlier: 'Deep Blue · search + crafted eval',
    later: 'AlphaZero · self-play + search',
  },
  {
    domain: 'Vision',
    earlier: 'SIFT · hand-designed features',
    later: 'AlexNet · learned features',
  },
  {
    domain: 'Speech',
    earlier: 'phoneme and vocal-tract rules',
    later: 'HMMs, then deep speech models',
  },
];
export const evidence = new Set(['run R42', 'citation_precision']);
export const candidates = [
  {
    route: 'quality',
    action: 'Retry later',
    evidence: [],
  },
  {
    route: 'promote',
    action: 'Promote anyway',
    evidence: [],
  },
  {
    route: 'quality',
    action: 'Open eval trace',
    evidence: ['run R42'],
  },
  {
    route: 'quality',
    action: 'Block until citation_precision recovers',
    evidence: ['run R42', 'citation_precision'],
  },
];
export const unsafe = {
  route: 'quality',
  action: 'Delete the evaluation report',
  evidence: ['run R42', 'citation_precision'],
};
