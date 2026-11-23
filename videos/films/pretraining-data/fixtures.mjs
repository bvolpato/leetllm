export const corpus = Object.freeze([
  {
    id: 'A',
    source: 'Prose',
    tokens: 240,
    score: 0.9,
    text: 'The cat sat on the mat.',
  },
  {
    id: 'B',
    source: 'Prose',
    tokens: 240,
    score: 0.9,
    text: 'The cat sat on the mat.',
  },
  {
    id: 'C',
    source: 'Code',
    tokens: 120,
    score: 0.7,
    text: 'return a + b',
  },
  {
    id: 'D',
    source: 'Prose',
    tokens: 200,
    score: 0.1,
    text: 'menu menu menu menu',
  },
  {
    id: 'E',
    source: 'Prose',
    tokens: 200,
    score: 0.8,
    text: 'Birds sing in the garden.',
  },
]);
export const NEAR_DUPLICATE_TEXT = Object.freeze([
  'the cat sat on the mat',
  'the cat sat on a mat',
]);
export const PACKED_WORDS = Object.freeze(['The', 'cat', 'sat', 'Birds', 'sing', 'EOS']);
export const TOY_TOKEN_IDS = Object.freeze([21, 44, 81, 65, 92, 2]);
export const PROXY_RESULTS = Object.freeze({
  baseline: [true, true, false, false, true, true, true, true, true, false],
  strict: [false, false, false, false, true, true, true, true, true, false],
});
export const extractionFixture = Object.freeze([
  {
    role: 'navigation',
    text: 'Home   About   Subscribe',
  },
  {
    role: 'body',
    text: 'The cat sat on the mat.',
  },
  {
    role: 'body',
    text: 'Birds sing in the garden.',
  },
  {
    role: 'body',
    text: 'def add(a, b):',
    code: true,
  },
  {
    role: 'body',
    text: '    return a + b',
    code: true,
  },
  {
    role: 'footer',
    text: 'Privacy   Links   Contact',
  },
]);
export const DOCUMENT_DRAWS = Object.freeze(
  Array.from(
    {
      length: 10,
    },
    (_, i) =>
      Object.freeze({
        id: 'D' + (i + 1),
        uniform: (i + 0.5) / 10,
      }),
  ),
);
export const BPE_RULES = Object.freeze([
  ['t', 'e'],
  ['t', 'a'],
  ['r', 'o'],
  ['a', 'f'],
  ['af', 'te'],
  ['afte', 'r'],
  ['after', '</w>'],
  ['ro', 'ta'],
]);
export const coreScenes = new Set([
  'intro',
  'inventory-plan',
  'archives',
  'prose-gates',
  'score-contracts',
  'corpus-evidence',
  'minhash-work',
  'lsh-chain',
  'exposure-schedule',
  'decontamination',
  'privacy',
  'tokenizer-choice',
  'bpe-work',
  'packing-work',
  'label-layout',
  'restart-consistency',
  'anneal-synthetic',
  'fresh-corpus',
  'mixture',
  'boundaries',
  'lineage',
  'transfer',
]);

export const releaseBatch = Object.freeze([
  { id: 'Code', source: 'Code', tokens: 120, score: 0.72 },
  { id: 'Docs', source: 'Docs', tokens: 180, score: 0.94 },
  { id: 'Web', source: 'Web', tokens: 300, score: 0.88 },
]);

export const releaseEvaluation = Object.freeze({
  tasks: ['Docs', 'Code'],
  casesPerTask: 20,
  codeFloor: 16,
  baseline: [16, 17],
  candidate: [19, 15],
});
