export const P = Object.freeze([0.5, 0.3, 0.2]);
export const Q = Object.freeze([0.2, 0.5, 0.3]);
export const TWO_GAP_Q = Object.freeze([0.3, 0.2, 0.5]);
export const WORDS = Object.freeze(['bird', 'dog', 'cat']);
export const CHAIN = Object.freeze([
  {
    words: ['sang', 'flew', 'rested'],
    p: [0.6, 0.3, 0.1],
    q: [0.4, 0.4, 0.2],
    candidate: 0,
    uniform: 0.2,
  },
  {
    words: ['softly', 'nearby', 'today'],
    p: [0.3, 0.5, 0.2],
    q: [0.6, 0.2, 0.2],
    candidate: 0,
    uniform: 0.8,
  },
  {
    words: ['today', 'yesterday', 'again'],
    p: [0.4, 0.3, 0.3],
    q: [0.5, 0.3, 0.2],
    candidate: 0,
    uniform: 0.1,
  },
]);
export const CHAIN_CUES = Object.freeze({
  accept: 0.32,
  reject: 0.54,
  discard: 0.63,
  correction: 0.84,
});
export const SAMPLING_COUNTS = Object.freeze([
  2389, 14622, 7156, 18041, 6070, 5854, 1729, 1155, 2984,
]);
