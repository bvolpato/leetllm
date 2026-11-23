import { best, constrainedTree, grow, mean } from './arithmetic.mjs';
export const rows = [
  [1, 1, 0],
  [1.5, 2, 0],
  [2, 3, 1],
  [3.5, 6, 1],
  [4, 7, 1],
  [4.5, 5, 1],
  [2.8, 4, 0],
  [3.2, 8, 0],
];
export const laterCases = [
  [2.1, 4, 0],
  [2.8, 6, 1],
];
export const validationRows = [
  [1.2, 2, 0],
  [2.1, 4, 0],
  [2.4, 3, 1],
  [3, 5, 0],
  [3.6, 4, 1],
  [3.2, 7, 0],
  [4.2, 5, 1],
  [2.8, 6, 1],
];
export const minLeafTree = constrainedTree(rows);
export const stump = best(rows);
export const tree = grow(rows, 4);
export const samples = [
  [6, 6, 0, 4, 7, 6, 4, 7],
  [3, 2, 4, 2, 1, 4, 2, 4],
  [1, 5, 7, 1, 5, 6, 5, 3],
];
export const features = [0, 1, 0];
export const forest = samples.map((sample, i) => {
  const fit = best(
    sample.map((j) => rows[j]),
    [features[i]],
  );
  return {
    ...fit,
    left: {
      rate: mean(fit.left.map((r) => r[2])),
    },
    right: {
      rate: mean(fit.right.map((r) => r[2])),
    },
  };
});
export function buildBoostRounds() {
  const targets = [10, 20, 60],
    regx = [1, 2, 5],
    boost = [[30, 30, 30]];
  for (let i = 0; i < 12; i++) {
    const prev = boost.at(-1),
      r = targets.map((v, j) => v - prev[j]),
      left = mean(r.slice(0, 2)),
      right = r[2];
    boost.push(prev.map((v, j) => v + 0.1 * (j < 2 ? left : right)));
  }
  return {
    targets,
    regx,
    boost,
  };
}
export const { targets, regx, boost } = buildBoostRounds();
