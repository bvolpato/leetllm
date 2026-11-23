import { confidence, softmax } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export const z = [2, 1, 0];
export const p = softmax(z);
export const updated = z.map((v, i) => v - 0.5 * (p[i] - (i === 1 ? 1 : 0)));
export const vectors = [
  [0, 1],
  [2, 0],
  [0.5, 0.5],
];
export const pointer = vectors.map((v) => v[0] / Math.sqrt(2));
export const records = [
  {
    p: 0.96,
    correct: true,
  },
  {
    p: 0.92,
    correct: true,
  },
  {
    p: 0.9,
    correct: false,
  },
  {
    p: 0.86,
    correct: true,
  },
  {
    p: 0.78,
    correct: true,
  },
  {
    p: 0.74,
    correct: false,
  },
  {
    p: 0.65,
    correct: true,
  },
  {
    p: 0.55,
    correct: false,
  },
];
export // The measured second risk beat says "The confidence gate" at 3.3875s.
const confidenceCue = 3.3875 / (19.344 + 0.8);
export const RELEASE_POLICY = Object.freeze({
  field: 'confidence',
  cutoff: 0.8,
  legalChoices: Object.freeze(['A', 'B', 'C']),
});
export const RELEASE_CASES = Object.freeze(
  [
    {
      id: 'R-low',
      choice: 'B',
      p: records[6].p,
    },
    {
      id: 'R-high',
      choice: 'B',
      p: records[2].p,
    },
  ].map(Object.freeze),
);
export function buildVerifiedConcentration() {
  const concentration = confidence;
  assert(Math.abs(1 / 3 + 0.8 * (1 - 1 / 3) - 0.8666666666666667) < 1e-12);
  assert(Math.abs(concentration(0.8, 3) - 0.7) < 1e-12);
  assert(Math.abs(concentration(0.7, 4) - 0.6) < 1e-12);
  return {
    concentration,
  };
}
export const { concentration } = buildVerifiedConcentration();

export const FOUR_CHOICE_POLICY = Object.freeze({
  field: 'confidence',
  cutoff: 0.65,
  legalChoices: Object.freeze(['A', 'B', 'C', 'D']),
});
export const ASSERTION_TICKETS = Object.freeze([
  Object.freeze({ id: 'RUN-843', choice: 'A', p: 0.7 }),
  Object.freeze({ id: 'RUN-844', choice: 'A', p: 0.76 }),
]);
