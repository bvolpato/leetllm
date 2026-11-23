import { normalizeVector } from 'vizmatic';
export const patches = [
  [0, 1, 4, 5],
  [2, 3, 6, 7],
  [8, 9, 12, 13],
  [10, 11, 14, 15],
];
export const E = [
  [0.25, -0.5],
  [0.25, 0.5],
  [0.25, -0.5],
  [0.25, 0.5],
];
export const tokens = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const ps = [
  [2, 0.1],
  [0.2, 1.5],
];
export const pos = [
  [0, 0.6],
  [0.5, 0],
];
export const imageVecs = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
export const textVecs = [
  [1, 0.2, 0],
  [0.1, 1, 0.2],
  [0, 0.3, 1],
].map(normalizeVector);
