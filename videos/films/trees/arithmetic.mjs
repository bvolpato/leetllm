export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const gini = (a) => {
  const p = mean(a);
  return 2 * p * (1 - p);
};
export function split(rows, feature, cut) {
  const left = rows.filter((r) => r[feature] <= cut),
    right = rows.filter((r) => r[feature] > cut);
  if (!left.length || !right.length) return null;
  return {
    feature,
    cut,
    left,
    right,
    gain:
      gini(rows.map((r) => r[2])) -
      (left.length * gini(left.map((r) => r[2])) + right.length * gini(right.map((r) => r[2]))) /
        rows.length,
  };
}
export function best(rows, features = [0, 1]) {
  let winner;
  for (const feature of features) {
    const unique = [...new Set(rows.map((r) => r[feature]))].sort((a, b) => a - b);
    for (let i = 1; i < unique.length; i++) {
      const result = split(rows, feature, (unique[i - 1] + unique[i]) / 2);
      if (!winner || result.gain > winner.gain + 1e-12) winner = result;
    }
  }
  return winner;
}
export function grow(rows, depth) {
  const node = {
    rate: mean(rows.map((r) => r[2])),
    n: rows.length,
  };
  if (depth === 0 || node.rate === 0 || node.rate === 1) return node;
  const cut = best(rows);
  if (!cut || cut.gain <= 0) return node;
  return {
    ...node,
    ...cut,
    left: grow(cut.left, depth - 1),
    right: grow(cut.right, depth - 1),
  };
}
export const predict = (tree, row) =>
  tree.feature === undefined
    ? tree.rate
    : predict(row[tree.feature] <= tree.cut ? tree.left : tree.right, row);
export function constrainedTree(data, minimumLeaf = 2) {
  const node = {
    rate: mean(data.map((r) => r[2])),
    n: data.length,
  };
  let winner;
  for (const feature of [0, 1]) {
    const values = [...new Set(data.map((r) => r[feature]))].sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      const candidate = split(data, feature, (values[i - 1] + values[i]) / 2);
      if (candidate.left.length < minimumLeaf || candidate.right.length < minimumLeaf) continue;
      if (!winner || candidate.gain > winner.gain + 1e-12) winner = candidate;
    }
  }
  if (!winner || winner.gain <= 0) return node;
  return {
    ...node,
    ...winner,
    left: constrainedTree(winner.left, minimumLeaf),
    right: constrainedTree(winner.right, minimumLeaf),
  };
}
export const totalCost = (entries) => entries.reduce((sum, row) => sum + row.cost, 0);
