import { dotProduct } from 'vizmatic';
export const sum = (values) => values.reduce((total, value) => total + value, 0);
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const mix = (a, z, p) => a.map((value, i) => value + (z[i] - value) * p);
export const complete = (p) => p >= 1 - 1e-9;
export const apply = (matrix, input) => matrix.map((row) => dotProduct(row, input));
export const solvePair = (matrix, target) => {
  const [[a, b], [c, d]] = matrix,
    determinant = a * d - b * c;
  return [
    (d * target[0] - b * target[1]) / determinant,
    (a * target[1] - c * target[0]) / determinant,
  ];
};
