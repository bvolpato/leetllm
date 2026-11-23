import { stableSoftmax } from 'vizmatic';
export const probabilities = [0.5, 0.1, 0.8];
export const nll = probabilities.map((v) => -Math.log(v));
export const total = nll.reduce((a, v) => a + v, 0);
export const ppl = Math.exp(total / 3);
export const subwordPieces = Object.freeze(['Rain', ' falls', ' n', 'ow']);
export const text = subwordPieces.join('');
export const scoredRuns = Object.freeze([
  { name: 'Subword model', pieces: subwordPieces, nats: 8.4 },
  { name: 'Character model', pieces: [...text], nats: 9 },
]);
export const freshPieces = Object.freeze(['The', ' cat', ' sat', ' down']);
export const windows = [
  [0, 5, 1, 5],
  [3, 8, 5, 8],
  [5, 10, 8, 10],
];
export const words = [
  'The',
  'little',
  'cat',
  'slept',
  'by',
  'the',
  'warm',
  'fire',
  'all',
  'evening',
];
export const logits = [1000, 998, 997];
export const stable = stableSoftmax(logits);
export const BITS_CUES = Object.freeze({
  // Measured caption cue: "Dividing by the natural log of two" runs 87.626–91.863s.
  start: 87.62566666666667 - 78.45066666666666,
  end: 91.86316666666667 - 78.45066666666666,
});
export const ANSWER_CONTRACT = Object.freeze({
  status: 'blocked',
  source: 'incident_policy_483',
  automatic: false,
});
export const ANSWERS = Object.freeze([
  {
    id: 'A',
    ppl: 8.9,
    status: 'blocked',
    source: 'unrelated_runbook',
    automatic: true,
  },
  {
    id: 'B',
    ppl: 9.8,
    status: 'blocked',
    source: 'incident_policy_483',
    automatic: false,
  },
]);
export const FRESH_CONTRACT = Object.freeze({
  status: 'queued',
  source: 'job_612',
  automatic: false,
});
export const FRESH_ANSWERS = Object.freeze([
  {
    id: 'Cedar',
    ppl: 7.6,
    status: 'queued',
    source: 'job_611',
    automatic: true,
  },
  {
    id: 'Pine',
    ppl: 8.1,
    status: 'queued',
    source: 'job_612',
    automatic: false,
  },
]);
export const FRESH_PROBABILITIES = Object.freeze([0.4, 0.25, 0.2, 0.5]);
