export const sceneIds = [
  'intro',
  'contract',
  'gold-contract',
  'checker',
  'rag-stage',
  'rag-metrics',
  'knowledge-contract',
  'math-frontier',
  'code-contract',
  'benchmark-audit',
  'preference-ratings',
  'slices',
  'candidates',
  'sample-estimator',
  'judge-controls',
  'exposure',
  'exposure-screen',
  'uncertainty',
  'wilson-construction',
  'paired-diagnosis',
  'gates',
  'finite-report',
  'reproducible-package',
  'synthesis',
  'fresh-report',
];
export const CASES = Object.freeze(
  Array.from(
    {
      length: 100,
    },
    (_, i) => ({
      id: `Q${i + 1}`,
      category: i < 90 ? 'ordinary' : 'renewal',
      A: i < 90 ? i < 88 : i < 92,
      B: i < 90 ? i < 81 : i < 99,
    }),
  ),
);
export const probes = [
  {
    id: 'literal',
    answer: 'Borrowed books are due on Friday.',
    reviewed: true,
    reason: 'Deadline preserved',
  },
  {
    id: 'changed-deadline',
    answer: 'Books are due after Friday.',
    reviewed: false,
    reason: 'Deadline moved later',
  },
  {
    id: 'abbreviation',
    answer: 'Return the books by Fri.',
    reviewed: true,
    reason: 'Deadline preserved',
  },
];
export const PROGRAMS = Object.freeze(
  Array.from(
    {
      length: 8,
    },
    (_, i) => ({
      id: i + 1,
      pass: i === 1 || i === 5,
    }),
  ),
);
export const PAIRS = Object.freeze(
  PROGRAMS.flatMap((a, i) =>
    PROGRAMS.slice(i + 1).map((b) => ({
      a: a.id,
      b: b.id,
      pass: a.pass || b.pass,
    })),
  ),
);
export const exposureCases = [
  {
    id: 'A',
    date: 'Feb 10',
    used: true,
  },
  {
    id: 'B',
    date: 'Apr 08',
    used: false,
  },
  {
    id: 'C',
    date: 'Apr 21',
    used: true,
  },
  {
    id: 'D',
    date: 'May 03',
    used: false,
  },
];
export const RELEASES = Object.freeze([
  {
    id: 'Fast',
    quality: 0.91,
    ms: 420,
    cost: 0.002,
    schema: 1,
  },
  {
    id: 'Balanced',
    quality: 0.99,
    ms: 680,
    cost: 0.008,
    schema: 1,
  },
  {
    id: 'Specialist',
    quality: 1,
    ms: 1800,
    cost: 0.031,
    schema: 1,
  },
]);
export const auditExpandedScenes = new Set([
  'contract',
  'checker',
  'candidates',
  'gold-contract',
  'rag-stage',
  'rag-metrics',
  'knowledge-contract',
  'math-frontier',
  'code-contract',
  'benchmark-audit',
  'preference-ratings',
  'sample-estimator',
  'judge-controls',
  'exposure-screen',
  'wilson-construction',
  'paired-diagnosis',
  'finite-report',
  'reproducible-package',
  'fresh-report',
]);
// Regions select actual painted objects. Focus bounds still come from checked marks.
export // Regions select actual painted objects. Focus bounds still come from checked marks.
const auditFocusRegions = {
  contract: {
    passages: [1080, 650, 800, 200],
    consequence: [250, 890, 1450, 80],
  },
  'gold-contract': {
    approval: [170, 460, 740, 130],
    unique: [250, 700, 500, 130],
    gold: [1000, 450, 780, 160],
    unsupported: [1000, 450, 780, 240],
    repair: [170, 730, 1590, 180],
  },
  checker: {
    on: [300, 400, 1300, 180],
    after: [780, 400, 360, 180],
    abbrev: [1200, 400, 420, 180],
  },
  'rag-stage': {
    drop: [1000, 470, 800, 170],
    complete: [150, 330, 760, 450],
    engineer: [1000, 330, 800, 200],
    citation: [1000, 530, 800, 430],
  },
  'rag-metrics': {
    rank1: [180, 680, 510, 150],
    rank3: [1300, 680, 510, 150],
    average: [350, 860, 1220, 100],
    recall: [1250, 550, 600, 110],
    faithful: [1200, 730, 650, 180],
    relevance: [1100, 720, 700, 180],
  },
  'knowledge-contract': {
    four: [180, 370, 1650, 200],
    quarter: [180, 580, 1650, 200],
    ten: [180, 320, 1650, 240],
    gpqa: [150, 600, 1600, 350],
    human: [170, 350, 800, 350],
    custom: [150, 800, 1650, 150],
  },
  'math-frontier': {
    parser: [1000, 450, 800, 300],
    proof: [160, 730, 1600, 200],
    hle: [150, 330, 1650, 250],
    versions: [200, 630, 1550, 350],
    arc: [650, 660, 300, 300],
  },
  'code-contract': {
    function: [150, 330, 800, 600],
    repo: [1000, 330, 800, 600],
    selected: [900, 320, 850, 430],
    omitted: [900, 720, 850, 220],
    attempts: [180, 350, 1600, 520],
  },
  'benchmark-audit': {
    subset: [250, 470, 1350, 350],
    denominator: [200, 900, 1500, 90],
    retract: [1000, 330, 800, 220],
    pro: [200, 610, 1500, 360],
    verifier: [1000, 360, 800, 450],
  },
  'preference-ratings': {
    logistic: [150, 330, 1100, 550],
    exponent: [1250, 520, 580, 230],
    equal: [1250, 520, 580, 150],
    advantage: [1250, 520, 580, 150],
    variants: [1250, 710, 580, 240],
  },
  slices: {
    renewals: [300, 350, 1250, 400],
    cutoff: [250, 320, 1430, 430],
  },
  candidates: {
    pairs: [140, 520, 1580, 400],
    success: [150, 915, 1600, 80],
    select: [350, 880, 1200, 110],
  },
  'sample-estimator': {
    plugin: [1000, 710, 800, 190],
    subset: [980, 350, 830, 440],
    hundred: [1000, 780, 800, 190],
    separate: [150, 810, 1650, 100],
    pooled: [150, 900, 1650, 90],
  },
  'judge-controls': {
    rubric: [150, 750, 1600, 180],
    tie: [420, 770, 1080, 150],
    swap: [180, 460, 1600, 330],
    unresolved: [150, 900, 1650, 90],
    grounded: [420, 700, 1080, 180],
    truth: [150, 880, 1650, 110],
  },
  'exposure-screen': {
    train: [1080, 320, 650, 170],
    dev: [1080, 520, 650, 190],
    regression: [150, 780, 1650, 190],
    ngram: [180, 350, 1600, 150],
    paraphrase: [1000, 550, 800, 300],
    canary: [180, 780, 1600, 180],
    dated: [180, 370, 1600, 300],
    cutoff: [1100, 780, 700, 180],
  },
  'wilson-construction': {
    wald: [150, 870, 1600, 110],
    candidate: [200, 350, 1500, 510],
    quadratic: [150, 350, 1600, 530],
    roots: [200, 530, 1500, 350],
    formula: [150, 890, 1600, 90],
    bound3: [180, 380, 1550, 150],
    bound50: [180, 560, 1550, 150],
    bound1000: [180, 740, 1550, 150],
  },
  'paired-diagnosis': {
    cells: [200, 350, 1550, 550],
    discordant: [200, 350, 1550, 550],
    coins: [200, 350, 1550, 550],
    exact: [200, 570, 1550, 160],
    nine: [180, 750, 550, 240],
    three: [730, 750, 550, 240],
    five: [1280, 750, 550, 240],
    broken: [180, 350, 750, 240],
  },
  gates: {
    cost: [1200, 330, 600, 640],
  },
  'finite-report': {
    typed: [580, 350, 420, 500],
    domain: [150, 350, 1650, 500],
    nan: [150, 350, 1650, 400],
    reject: [350, 780, 1250, 190],
    scope: [500, 700, 900, 200],
  },
  'reproducible-package': {
    outputs: [170, 700, 810, 190],
    missing: [1150, 740, 650, 220],
    repeat: [150, 320, 1600, 420],
    changed: [1000, 710, 800, 170],
    repair: [150, 860, 1650, 130],
  },
  'fresh-report': {
    premise: [180, 330, 1650, 380],
    critical: [300, 700, 1300, 240],
    coin: [150, 330, 1650, 380],
    pvalue: [180, 710, 750, 200],
    bound: [1000, 710, 750, 260],
    hold: [600, 700, 750, 170],
    broken: [150, 850, 1650, 140],
    regression: [150, 850, 1650, 180],
  },
};
