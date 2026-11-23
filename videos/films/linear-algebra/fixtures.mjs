import { dotProduct, normalizeVector } from 'vizmatic';
export const A = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const B = [
  [1, 1],
  [0, 0],
  [1, 1],
];
export const labels = ['slow pages', 'undo release', 'both'];
export const common = normalizeVector([1, 1]);
export const contrast = normalizeVector([-1, 1]);
export const dispatchWeights = [1, 2];
export const V = [common, contrast];
export const strengths = [Math.sqrt(3), 1];
export const U = V.map((direction, i) => A.map((row) => dotProduct(row, direction) / strengths[i]));
export const mean = [2 / 3, 2 / 3];
export const severity = [1, 2, 2];
export const conditioningMatrix = [
  [1, 0],
  [0, 0.01],
];
