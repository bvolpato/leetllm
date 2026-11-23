import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'workflow',
  'ownership',
  'results',
  'slices',
  'audit',
  'oversight',
  'package',
];
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export const workflows = [
  {
    name: 'Public summary',
    flags: [false, false, false, false],
  },
  {
    name: 'Credit assessment',
    flags: [true, false, false, false],
  },
  {
    name: 'Promotion assistant',
    flags: [false, false, true, true],
  },
  {
    name: 'Incomplete intake',
    flags: [null, null, null, null],
  },
];
export const ownershipBeatSpan = 18.768;
export const ownershipEvidenceAt = 3.0625 / ownershipBeatSpan;
export const ownershipEstimateAt = 4.975 / ownershipBeatSpan;
export const originalEvents = [
  {
    event: 'Proposal',
    value: 'C17 / production /10%',
  },
  {
    event: 'Policy gate',
    value: 'Held for approval',
  },
  {
    event: 'Effect',
    value: 'No promotion',
  },
];
export const proposal = {
  candidate: 'C17',
  environment: 'mock-prod',
  artifact: 'M1',
  target: 25,
  policy: 'G7',
  evidence: 'E7',
  untrusted: true,
};
export const evidenceNames = [
  'Workflow memo',
  'Risk register',
  'System card',
  'Dataset record',
  'Audit replay',
  'Attack report',
  'Access-path report',
  'Oversight runbook',
];
export const manifest = {
  model: 'M1',
  prompt: 'P3',
  policy: 'G7',
  tools: ['propose'],
  evaluation: 'E7',
  environment: 'mock-prod',
};
export const governancePermissions = [
  [
    'residual-estimate',
    'ownership',
    1,
    'A reviewer estimates lower residual likelihood while retaining the same impact',
  ],
  ['due-today', 'ownership', 3, 'A review due today is due, so it holds review'],
  ['retest-pass', 'results', 1, 'Both checks pass on this retest'],
  ['missing-coverage', 'results', 1, 'drops the two eligible requests'],
  ['complete-bound', 'results', 3, 'about sixty-three point two percent'],
  ['path-threshold', 'slices', 1, 'Half were blocked, twice our ceiling'],
  ['path-repair', 'slices', 3, 'This time the four blocked requests get through'],
  ['denied-review', 'oversight', 1, 'security denies the request'],
  ['executor-eligible', 'oversight', 2, 'The executor may now revalidate it'],
  [
    'appeal-uphold',
    'appeal-replay',
    1,
    'If the security review really was absent, uphold that hold and explain what evidence is needed',
  ],
  [
    'appeal-correct',
    'appeal-replay',
    1,
    'If a valid, authorized receipt already covered that exact proposal but the gate failed to read it, record a factual correction and assign the gate defect',
  ],
  ['package-eligible', 'package', 1, 'This package is eligible for release approval'],
  [
    'package-changed',
    'package',
    2,
    'The manifest digest changes, and the old reviews stop matching',
  ],
  ['fresh-cannot', 'earned-transfer', 1, 'They cannot'],
  [
    'fresh-binding-and-exception',
    'earned-transfer',
    1,
    'The exact proposal binding changes, and fifteen is above ten, so our local rule also requires exception review',
  ],
];
export const governanceConstructionCues = [
  ['credit-route', 'workflow', 1, 'The credit example reaches specialized risk review'],
  ['effect-route', 'workflow', 1, 'The promotion assistant reaches interaction and effect review'],
  ['baseline-route', 'workflow', 1, 'Public summarization reaches the baseline route'],
  ['unknown-route', 'workflow', 2, 'An incomplete intake reaches facts review'],
  ['eu-output', 'legal-scope', 0, 'where system output is used in the Union'],
  [
    'application-role',
    'legal-scope',
    1,
    'An application developer can be the provider of an AI system even when another organization supplies its general-purpose model',
  ],
  [
    'staff-route',
    'legal-scope',
    2,
    'A staff scheduling proposal with a checked worker-management flag goes to specialized risk review',
  ],
  ['staff-unknown', 'legal-scope', 2, 'An unanswered flag stays facts review'],
  [
    'prohibition-conditions',
    'prohibited-practices',
    0,
    'specified manipulative or vulnerability-exploiting techniques that meet significant-harm conditions',
  ],
  [
    'score-alone',
    'prohibited-practices',
    0,
    'A score by itself does not establish those conditions',
  ],
  [
    'objective-facts',
    'prohibited-practices',
    1,
    'support for a human assessment already based on objective, verifiable facts directly linked to criminal activity',
  ],
  [
    'medical-exception',
    'prohibited-practices',
    1,
    'Workplace and education emotion inference has a medical or safety exception',
  ],
  [
    'biometric-objective',
    'prohibited-practices',
    2,
    'targeted victim or missing-person searches, specified serious threats and certain serious-offence suspects',
  ],
  [
    'biometric-scope',
    'prohibited-practices',
    2,
    'Record the objective, permitted scope and applicable authorization before determining whether the use fits an exception',
  ],
  ['dated-prohibition', 'prohibited-practices', 3, 'from December second, twenty twenty-six'],
  [
    'generation-conditions',
    'prohibited-practices',
    3,
    'intended generation from reasonably foreseeable, reproducible generation without adequate safeguards',
  ],
  ['use-purpose', 'prohibited-practices', 3, "The use restriction concerns the deployer's purpose"],
  [
    'product-inputs',
    'high-risk-branches',
    0,
    'both an Annex one product or its safety component, and the relevant third-party conformity assessment for health and safety',
  ],
  [
    'convenience',
    'high-risk-branches',
    0,
    'Solely non-safety assistance, efficiency or convenience does not make a safety component',
  ],
  ['safety-failure', 'high-risk-branches', 0, 'Failure that endangers health and safety can'],
  [
    'unrelated-assessment',
    'high-risk-branches',
    0,
    'A conformity check solely for unrelated risks does not satisfy the second condition',
  ],
  [
    'credit-fraud',
    'high-risk-branches',
    1,
    'Its creditworthiness entry expressly excludes financial-fraud detection',
  ],
  [
    'credit-comparison',
    'high-risk-branches',
    1,
    "distinguish an applicant's creditworthiness decision from a transaction-fraud detector",
  ],
  [
    'narrow-exception',
    'high-risk-branches',
    2,
    'These are a narrow procedural task, improving a completed human activity, detecting decision patterns or deviations without replacing or influencing the completed assessment without proper human review, or a preparatory task',
  ],
  [
    'profiling-override',
    'high-risk-branches',
    2,
    'Annex three profiling of natural persons remains high risk despite that exception test',
  ],
  [
    'sector-route',
    'high-risk-branches',
    3,
    'Article two gives Annex one Section B products a special integration regime through sector legislation',
  ],
  [
    'open-exception',
    'gpai-layer',
    0,
    'Qualifying open-source models have a limited exception from the first two duties',
  ],
  [
    'systemic-override',
    'gpai-layer',
    0,
    'That exception does not apply to models with systemic risk',
  ],
  [
    'compute-presumption',
    'gpai-layer',
    1,
    'More than ten to the twenty-fifth training FLOPs creates a presumption of high-impact capabilities, with an exceptional rebuttal procedure',
  ],
  [
    'commission-route',
    'gpai-layer',
    1,
    'the Commission can designate a model based on equivalent capabilities or impact under the specified criteria',
  ],
  [
    'energy-documentation',
    'gpai-layer',
    2,
    'Known or estimated training energy consumption belongs in Annex eleven documentation under Article fifty-three',
  ],
  [
    'measurement-risk',
    'evaluation-integrity',
    0,
    'A second row covers contaminated evaluation evidence',
  ],
  [
    'gold-exposure',
    'evaluation-integrity',
    0,
    'correct answers exposed through agent-readable harness paths',
  ],
  [
    'holdout-isolation',
    'evaluation-integrity',
    1,
    "Keep private cases out of training and their answers out of the assistant's reach",
  ],
  ['seen-regression', 'evaluation-integrity', 1, 'Move H one into the regression suite'],
  [
    'new-private',
    'evaluation-integrity',
    1,
    'Use a fresh private case to see whether the fix works on another request',
  ],
  [
    'dataset-binding',
    'evaluation-integrity',
    2,
    'A dataset version or labeling change must remain linked to the matching report and accepted deployment evidence',
  ],
  [
    'redacted-reference',
    'replay-privacy',
    0,
    'Keep controlled source references or redacted excerpts when needed',
  ],
  [
    'private-fields',
    'replay-privacy',
    0,
    'Raw credentials, full private prompts and hidden model reasoning do not become default audit-log fields',
  ],
  ['actor-linkable', 'replay-privacy', 1, 'They match'],
  ['pseudonym-value', 'replay-privacy', 1, 'ninety-six bits from a keyed HMAC of the user ID'],
  ['key-scope', 'replay-privacy', 1, 'Change the key and the label changes'],
  [
    'anchor-authority',
    'replay-privacy',
    2,
    "A protected anchor must be outside the log writer's authority, with sequence or scope and time",
  ],
  [
    'mutable-anchor',
    'replay-privacy',
    2,
    'If an administrator can replace both chain and anchor, matching them supplies no independent evidence of unchanged history',
  ],
  [
    'dataset-retention',
    'replay-privacy',
    3,
    "The dataset fixture's ninety-day rule is not a default for every audit log",
  ],
  [
    'deployer-retention',
    'replay-privacy',
    3,
    'an appropriate period of at least six months unless applicable law provides otherwise',
  ],
  [
    'appeal-record',
    'appeal-replay',
    0,
    'A reviewer who took no part in the original decision opens the original proposal, evaluation package, policy and configuration versions, approval receipts and effect record',
  ],
  [
    'appeal-current',
    'appeal-replay',
    2,
    'authoritative, fresh, unrevoked and bound to the current candidate, environment, target, policy and evidence',
  ],
  [
    'appeal-executor',
    'appeal-replay',
    2,
    'Revalidate at the executor boundary so the proposal cannot change between check and effect',
  ],
  [
    'appeal-uncertain',
    'appeal-replay',
    2,
    'a lost response leaves an uncertain outcome that needs reconciliation before retry',
  ],
  [
    'oversight-authority',
    'appeal-replay',
    3,
    'time, evidence, expertise and authority to disagree, override within their remit or halt safely',
  ],
  [
    'appeal-legal-scope',
    'appeal-replay',
    4,
    'a deployer decision based on an Annex three high-risk system, excluding point two, must produce legal or similarly significant effects considered adverse to health, safety or fundamental rights',
  ],
  ['first-suite', 'results', 3, 'The first suite gives one third and one half'],
  [
    'independent-trials',
    'results',
    3,
    'With zero observed failures in three independent fixed-distribution trials',
  ],
  [
    'bound-construction',
    'results',
    3,
    'the exact one-sided ninety-five-percent upper bound is one minus point zero five to the power one third, about sixty-three point two percent',
  ],
];
