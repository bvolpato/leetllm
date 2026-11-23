export const OPENING = Object.freeze([
  ['opened', 0.45],
  ['looked', 0.35],
  ['slept', 0.2],
]);
export const NEXT = Object.freeze({
  opened: [
    ['the', 0.5],
    ['a', 0.3],
    ['EOS', 0.2],
  ],
  looked: [
    ['outside', 0.55],
    ['up', 0.3],
    ['EOS', 0.15],
  ],
  slept: [
    ['EOS', 0.95],
    ['in', 0.05],
  ],
  'opened the': [
    ['door', 0.8],
    ['window', 0.15],
    ['EOS', 0.05],
  ],
  'opened a': [
    ['book', 0.7],
    ['letter', 0.2],
    ['EOS', 0.1],
  ],
  'looked up': [
    ['at', 0.6],
    ['toward', 0.25],
    ['EOS', 0.15],
  ],
  'looked up at': [
    ['the', 0.9],
    ['EOS', 0.1],
  ],
  'looked up at the': [
    ['sky', 0.7],
    ['stars', 0.2],
    ['EOS', 0.1],
  ],
  'looked up toward': [
    ['home', 0.7],
    ['town', 0.2],
    ['EOS', 0.1],
  ],
  'looked outside': [
    ['again', 0.7],
    ['EOS', 0.3],
  ],
  'slept in': [
    ['bed', 0.9],
    ['EOS', 0.1],
  ],
  'opened the door': [
    ['EOS', 0.85],
    ['again', 0.15],
  ],
  'opened the window': [
    ['EOS', 0.8],
    ['slowly', 0.2],
  ],
  'opened a book': [
    ['EOS', 0.9],
    ['for', 0.1],
  ],
  'opened a letter': [
    ['EOS', 0.9],
    ['today', 0.1],
  ],
  'looked up sky': [
    ['EOS', 0.9],
    ['again', 0.1],
  ],
  'looked up stars': [
    ['EOS', 0.9],
    ['again', 0.1],
  ],
  'looked outside again': [
    ['EOS', 0.9],
    ['quietly', 0.1],
  ],
  'slept in bed': [
    ['EOS', 0.9],
    ['soundly', 0.1],
  ],
});
export const POLICY_TOKENS = Object.freeze(['create', 'revoke', 'rename', 'quota']);
export const POLICY_LOGITS = Object.freeze([3, 2.5, 1, -1]);
export const OUTCOME_CANDIDATES = Object.freeze([
  {
    id: 'A',
    text: 'create → deploy → revoke',
    log: -2.6,
    score: 0.96,
  },
  {
    id: 'B',
    text: 'revoke → create → deploy',
    log: -1.1,
    score: 0.72,
  },
  {
    id: 'C',
    text: 'create → revoke → deploy',
    log: -1.8,
    score: 0.54,
  },
]);
