export const VOCAB = ['function', 'returns', 'the', 'result', 'None', 'value'];
export const WORDS = VOCAB.slice(0, 3);
export const EMBED = [
  [1, 0, 0.4, 0],
  [0.2, 1, 0.5, 0],
  [0, 0.3, 0.8, 1],
  [0.1, 0.5, 1, 0.9],
  [0, 0.1, 0, 0.1],
  [0.2, 0, 0.4, 0.5],
];
export const WQ = [
  [0.5, 0.2],
  [0.3, 0],
  [0, 0.5],
  [0.2, 0.1],
];
export const WK = [
  [0.3, 0],
  [0, 0.5],
  [0.4, 0.2],
  [0, 0.3],
];
export const WOUT = [
  [1, 0, 0, 0],
  [0.2, 0, 0, 0],
  [0, 0, 0, 0.2],
  [0, 0, 0.5, 1],
  [0, -1, 0, 0],
  [0, 0, 1.5, 0],
];
export const EXTENDED_SCENES = new Set([
  'position-designs',
  'matching-scale',
  'parallel-heads',
  'ffn-variants',
  'norm-contracts',
  'causal-training',
  'api-alignment',
  'executable-contracts',
  'vocabulary-contract',
  'architecture-visibility',
  'real-scale',
  'failure-contract',
  'fresh-decoder',
]);
export const HEAD_WORKSHEET = [
  [1, 0, 0.5, 1, 1, -0.5],
  [0, 1, 1, 0, 0.5, 0.5],
  [-1, 0.5, 0, 1, -0.5, 1],
];

// Last residual rows from next-token-head.py and trace-a-small-causal-block.py in the article.
export const ARTICLE_STATES = [
  [0.0371650755405426, 0.26688194274902344, 0.993622899055481, 0.8696096539497375],
  [-1.9693802241450222, -0.6000456829079678, 3.7600748568783438, 3.0181500936074386],
];
