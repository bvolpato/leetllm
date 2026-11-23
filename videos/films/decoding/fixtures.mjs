export const BASE = [0.45, 0.25, 0.15, 0.1, 0.05];
export const WORDS = ['ran', 'slept', 'played', 'barked', 'waited'];
export const BRANCHES = [
  {
    word: 'ran',
    p: 0.6,
    next: [
      ['quickly', 0.3],
      ['home', 0.35],
      ['outside', 0.35],
    ],
  },
  {
    word: 'slept',
    p: 0.4,
    next: [
      ['soundly', 0.9],
      ['outside', 0.1],
    ],
  },
];
export const LEAVES = BRANCHES.flatMap((branch) =>
  branch.next.map(([word, p]) => ({
    text: branch.word + ' ' + word,
    score: branch.p * p,
  })),
);
export const STATUS_ROW = Object.freeze([0.45, 0.3, 0.15, 0.02, ...Array(8).fill(0.01)]);
export const STATUS_IDS = Object.freeze([
  'degraded',
  'in',
  'on',
  'broken',
  ...Array.from(
    {
      length: 8,
    },
    (_, i) => 'tail ' + (i + 1),
  ),
]);
