import { A2, A4, B2, B4, BASE_OUTPUT, CLAMP_CASES, X } from './fixtures.mjs';
import { weightedVectorState } from 'vizmatic';
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const p = clamp01((value - 0.1) / 0.72);
  return p * p * (3 - 2 * p);
};
export const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
export const CANDIDATES = Object.freeze([
  clamp,
  (x, lo, hi) => Math.max(Math.min(x, lo), hi),
  (x, lo, hi) => Math.min(Math.max(x, lo), hi),
  (x) => x,
]);
export function gradeClamp(fn) {
  return Number(CLAMP_CASES.every(([x, lo, hi, expected]) => fn(x, lo, hi) === expected));
}
export const REWARDS = Object.freeze(CANDIDATES.map(gradeClamp));
export const rewardMean = REWARDS.reduce((sum, value) => sum + value, 0) / REWARDS.length;
export const ADVANTAGES = Object.freeze(REWARDS.map((value) => value - rewardMean));
export function sharedCreditUpdate(progress, advantages = ADVANTAGES) {
  const features = [1, -1, 1, -1],
    meanFeature = features.reduce((a, b) => a + b, 0) / features.length;
  const gradient =
      advantages.reduce((total, a, i) => total + a * (features[i] - meanFeature), 0) /
      advantages.length,
    theta = 0.25 * gradient * progress,
    logits = features.map((f) => theta * f || 0),
    mass = logits.reduce((a, z) => a + Math.exp(z), 0);
  return {
    gradient,
    theta,
    features,
    logits,
    probabilities: logits.map((z) => Math.exp(z) / mass),
  };
}
export const mv = (matrix, vector) =>
  matrix.map((row) => row.reduce((sum, value, i) => sum + value * vector[i], 0));
export function loraWorksheet(rank, progress = 1) {
  if (rank !== 2 && rank !== 4) throw Error('Supplied worksheet supports rank two or four');
  const A = rank === 2 ? A2 : A4,
    B = rank === 2 ? B2 : B4,
    narrow = mv(A, X),
    expanded = mv(B, narrow);
  const terms = narrow.map((weight, column) => ({
    id: `direction-${column}`,
    weight: weight * 0.5,
    values: B.map((row) => row[column]),
  }));
  const accumulation = weightedVectorState({
    initial: BASE_OUTPUT,
    terms,
    progress,
  });
  return {
    rank,
    A,
    B,
    input: X,
    base: BASE_OUTPUT,
    narrow,
    expanded,
    accumulation,
    output: accumulation.total,
    parameters: rank * 10,
  };
}
