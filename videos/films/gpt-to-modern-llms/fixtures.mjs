import { clamp } from './arithmetic.mjs';

export const tokens = ['<start>', 'Stale', 'guide', 'Label:'];
export const values = [
  [0, 0],
  [1, 0],
  [0, 1],
  [0.5, 0.5],
];
export const attention = [0, 0.1, 0.7, 0.2];
export const vocabulary = ['Docs', '.', 'Bug', 'Security'];
export const initialWeights = [
  [0.5, 1],
  [1, 0.4],
  [-0.5, 0.2],
  [0.2, -0.5],
];
export const secondContext = [0.8, 0.2];
export const labels = ['Bug', 'Docs', 'Security'];
export const referenceLabel = 'Docs';

export function attentionState(progress) {
  const admitted = Math.min(4, Math.floor(clamp(progress) * 4 + 1e-9));
  const contributions = values.map((value, i) => value.map((x) => x * attention[i]));
  const vector = [0, 1].map((axis) =>
    contributions.slice(0, admitted).reduce((sum, v) => sum + v[axis], 0),
  );
  return { admitted, contributions, vector };
}
export const hidden = attentionState(1).vector;
