import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'write',
  'select',
  'compress',
  'isolate',
  'resume',
  'evaluate',
  'synthesis',
];
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          step: 0,
        },
      },
      cues: [0, 1, 2].map((step) => ({
        id: `${id}-${step}`,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export const SELECTION_CUE = 4.4 / 17.786;
export const selectionTrack = createCueTrack({
  initial: {
    id: 'investigation-tools',
    snapshot: {
      phase: 'investigate',
    },
  },
  cues: [
    {
      id: 'proposal-tools',
      beat: 1,
      at: SELECTION_CUE,
      snapshot: {
        phase: 'propose',
      },
    },
    {
      id: 'unknown-phase',
      beat: 2,
      at: 0,
      snapshot: {
        phase: 'unknown',
      },
    },
  ],
});
export const sources = Object.freeze({
  'trace-17': {
    trace: 'R17',
    at: 100,
    status: 403,
    path: '/callback',
  },
  'lock-check': {
    trace: 'R17',
    at: 100,
    locked: false,
  },
  'deploy-record': {
    revision: 7,
  },
});
export const allocations = [
  {
    id: 'Task and evidence',
    units: 2400,
    kind: 'evidence',
  },
  {
    id: 'Active tools and notes',
    units: 760,
    kind: 'active',
  },
  {
    id: 'Reloaded findings',
    units: 186,
    kind: 'findings',
  },
  {
    id: 'Raw trace export',
    units: 8200,
    kind: 'raw',
  },
  {
    id: 'Unused tools',
    units: 770,
    kind: 'unused',
  },
  {
    id: 'Old lock hypothesis',
    units: 120,
    kind: 'hypothesis',
  },
];
export const COMPRESSION_CUES = Object.freeze({
  span: 19.73,
  toolsRemoved: 2.0625,
  hypothesisRemoved: 3.8625,
});
export const tools = [
  'deploy_lookup',
  'trace_lookup',
  'runbook_search',
  'rollback_advisor',
  'cluster_admin',
];
export const TRACE_EXCHANGE = Object.freeze({
  call: {
    id: 'call-trace-17',
    name: 'trace_lookup',
    arguments: {
      trace: 'R17',
    },
  },
  result: {
    call_id: 'call-trace-17',
    source: 'trace-17',
    status: sources['trace-17'].status,
  },
});
export const answers = {
  D0: '403',
  D1: 'revision 7',
  D2: 'lock absent',
  D3: 'inspect callback',
  D4: 'incident lead',
  D5: '/callback',
};
export const questions = [
  ['Callback status?', 'D0'],
  ['Deployment revision?', 'D1'],
  ['Lock observation?', 'D2'],
  ['Next runbook check?', 'D3'],
  ['Rollback authorizer?', 'D4'],
  ['Failing path?', 'D5'],
].map(([question, source]) => ({
  question,
  source,
  expected: answers[source],
  critical: source === 'D4',
}));
export const PACKET_CONTEXT_TARGETS = Object.freeze({
  'intro': [
    'intro-hypothesis',
    'intro-object-trace-17-callback-status-403-2',
    'intro-object-lock-check-r17-locked-false-3',
  ],
  'write': [
    'intro-object-b-0-scene-id-write-findings-checked-against-source-10',
    'intro-object-lock-check-r17-locked-false-3',
    'intro-object-trace-17-callback-status-403-2',
  ],
  'select': ['select-simulation-15', 'select-eligible-tools'],
  'compress': [
    'compress-simulation-18',
    'compress-call-result-pair',
    'compress-object-auth-error-source-checked-source-24',
  ],
  'isolate': ['isolate-simulation-28', 'isolate-object-worker-claim-26'],
  'synthesis': [
    'intro-object-b-0-scene-id-write-findings-checked-against-source-10',
    'recovery-operations',
    'intro-object-trace-17-callback-status-403-2',
  ],
});
export const COMPLETE_CONTEXT_SCENES = Object.freeze([
  'capacity-and-evidence',
  'failure-interventions',
  'verified-note-state',
  'phase-intersection',
  'prefix-order',
  'cache-cost-scope',
  'prune-cutoff',
  'summary-authority',
  'strict-handoff',
  'assigned-ledger',
  'required-packer',
  'packer-limits',
  'thrash-budget',
  'skills-disclosure',
  'skill-routing-and-safety',
  'resume-artifacts',
  'receipt-validation',
  'recovery-and-evaluator',
  'complete-release-gate',
  'earned-context',
]);
export const COMPLETE_TOOL_POLICY = Object.freeze({
  investigate: ['deploy_lookup', 'trace_lookup', 'runbook_search'],
  propose: ['runbook_search', 'rollback_advisor'],
});
export const CONTEXT_REQUIRED = Object.freeze([
  {
    id: 'alert',
    units: 180,
    priority: 10,
    required: true,
  },
  {
    id: 'trace',
    units: 420,
    priority: 10,
    required: true,
  },
  {
    id: 'runbook',
    units: 1800,
    priority: 9,
    required: false,
  },
  {
    id: 'old export',
    units: 8200,
    priority: 1,
    required: false,
  },
]);
export const CONTEXT_FRESH = Object.freeze([
  {
    id: 'task',
    units: 200,
    priority: 10,
    required: true,
  },
  {
    id: 'trace',
    units: 500,
    priority: 10,
    required: true,
  },
  {
    id: 'authorization',
    units: 300,
    priority: 10,
    required: true,
  },
  {
    id: 'old export',
    units: 1800,
    priority: 9,
    required: false,
  },
  {
    id: 'runbook',
    units: 1200,
    priority: 8,
    required: false,
  },
]);
export const CONTEXT_RELEASE_CASES = Object.freeze(
  [
    [1, 1],
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 1],
    [1, 1],
    [1, 1],
    [0, 0],
    [1, 1],
    [1, 1],
  ].map(([raw, curated], i) => ({
    id: 'C' + (i + 1),
    raw: Boolean(raw),
    curated: Boolean(curated),
    critical: i === 1,
    poison: 0,
  })),
);
