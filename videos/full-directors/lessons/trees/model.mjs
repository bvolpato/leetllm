import assert from 'node:assert/strict';
import {
  rows,
  validationRows,
  tree,
  forest,
  samples,
  targets,
  boost,
  stump,
} from '../../../films/trees/fixtures.mjs';
import { split, best, mean, predict } from '../../../films/trees/arithmetic.mjs';
import {
  fittedStump,
  policyCosts,
  stumpBill,
  validationAfterBoosting,
  sigmoid,
} from '../../../films/trees/model.mjs';
export {
  rows,
  validationRows,
  tree,
  forest,
  samples,
  targets,
  boost,
  stump,
  predict,
  best,
  mean,
  fittedStump,
  policyCosts,
  stumpBill,
  validationAfterBoosting,
  sigmoid,
};
export const requests = rows.map(([v, support, label], i) => ({
  id: 'R' + (i + 1),
  v,
  support,
  label,
}));
export const gini = (p) => 2 * p * (1 - p);
export const entropy = (p) => [p, 1 - p].reduce((h, x) => h - (x ? x * Math.log2(x) : 0), 0);
export const squareError = (vs, preds) => mean(vs.map((v, i) => (v - preds[i]) ** 2));
export function gaps(feature) {
  const sorted = [...new Set(rows.map((r) => r[feature]))].sort((a, b) => a - b);
  return sorted.slice(1).map((v, i) => split(rows, feature, (v + sorted[i]) / 2));
}
export const options = [
  [
    [0, 4],
    [12, 20],
  ],
  [
    [9, 12],
    [3, 12],
  ],
];
export function gain(partition, f) {
  return f(0.5) - partition.reduce((sum, [r, n]) => sum + (n / 24) * f(r / n), 0);
}
export function panes(node, remaining = Infinity, end = Infinity) {
  if (!remaining || node.feature === undefined)
    return [{ end, review: node.rate >= 0.5, n: node.n, rate: node.rate }];
  return [...panes(node.left, remaining - 1, node.cut), ...panes(node.right, remaining - 1, end)];
}
export function votes(oob) {
  return forest.map((member, i) => ({
    member,
    i,
    sample: samples[i],
    score: predict(member, rows[2]),
    eligible: !oob || !samples[i].includes(2),
  }));
}
export const pairOrder = [
  [0, 2],
  [2, 0],
  ...rows.flatMap((a, i) =>
    rows.flatMap((b, j) =>
      a[2] !== b[2] && !(i === 0 && j === 2) && !(i === 2 && j === 0) ? [[i, j]] : [],
    ),
  ),
];
export const ordered = requests.toSorted((a, b) => a.v - b.v);
export function permutedRows(swaps) {
  return validationRows.map(([a, s, y], i) => [
    Math.min(i, 7 - i) < swaps ? validationRows[7 - i][0] : a,
    s,
    y,
  ]);
}
export function bill(entries) {
  const extra = entries.filter((e) => e.review && !e.row[2]).length,
    miss = entries.filter((e) => !e.review && e.row[2]).length;
  const queue = entries.filter((e) => e.review).length,
    hits = queue - extra;
  return {
    extra,
    miss,
    queue,
    total: entries.reduce((a, e) => a + e.cost, 0),
    f1: (2 * hits) / (2 * hits + extra + miss),
  };
}
export function newtonRound(round) {
  let logits = [0, 0];
  const groups = [stump.left, stump.right];
  for (let i = 0; i < round; i++) {
    logits = groups.map((group, j) => {
      const p = sigmoid(logits[j]);
      return (
        logits[j] +
        (0.1 * group.reduce((sum, r) => sum + r[2] - p, 0)) / (group.length * p * (1 - p))
      );
    });
  }
  return groups.map((group, i) => {
    const p = sigmoid(logits[i]),
      rs = group.map((r) => r[2] - p),
      cs = group.map(() => p * (1 - p));
    const sum = rs.reduce((a, b) => a + b),
      curvature = cs.reduce((a, b) => a + b);
    return { group, logit: logits[i], p, rs, cs, sum, curvature, step: sum / curvature };
  });
}
export const importance = [
  { name: 'Continuous noise', mdi: 0.92, drop: 0.003, sd: 0.007 },
  { name: 'Binary predictor', mdi: 0.08, drop: 0.097, sd: 0.007 },
];
export const backgroundScore = (mask) =>
  mean(
    rows.map((r) =>
      predict(
        fittedStump,
        r.map((v, i) => (mask[i] ? rows[2][i] : v)),
      ),
    ),
  );
export const missingRoute = (v) => (v === null || v > 1 ? 'Add review' : 'Usual checks');
export const fits = [0.2, 0.5, 0.8],
  truth = 0.4,
  noise = 0.1;
export const biasSq = (mean(fits) - truth) ** 2,
  variance = squareError(
    fits,
    fits.map(() => mean(fits)),
  );
export const fresh = [3.35, 5, 1];
export function decision(price) {
  const bills = [stumpBill(0.2, price), stumpBill(0.5, price)];
  const winner = bills[0].total < bills[1].total ? bills[0] : bills[1];
  const entry = policyCosts(fittedStump, winner.threshold, [fresh], price)[0];
  return { bills, winner, entry };
}
export function compareModels() {
  const other = (scorer, t) =>
    bill(
      validationRows.map((row) => {
        const review = scorer(row) >= t;
        return { review, row, cost: review ? (row[2] ? 0 : 18) : row[2] ? 120 : 0 };
      }),
    ).total;
  return [
    ['Stump', 0.5, stumpBill(0.5, 120).total],
    ['Stump', 0.2, stumpBill(0.2, 120).total],
    ['Deep tree', 0.5, bill(policyCosts(tree)).total],
    ['Forest', 0.2, other((r) => mean(forest.map((t) => predict(t, r))), 0.2)],
    ['Boost · 4 rounds', 0.5, validationAfterBoosting(4).cost],
    ['Logistic', 0.2, 2 * 18],
  ];
}
export function check() {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' vs ' + b);
  assert.deepEqual(
    ordered.map((r) => r.id),
    ['R1', 'R2', 'R3', 'R7', 'R8', 'R4', 'R5', 'R6'],
  );
  assert.deepEqual(
    ordered.filter((r) => r.v > 1.75 && r.v <= stump.cut && !r.label).map((r) => r.id),
    ['R7', 'R8'],
  );
  assert.equal(pairOrder.length, 32);
  assert.equal(new Set(pairOrder.map((p) => p.join(','))).size, 32);
  assert.ok(pairOrder.every(([a, b]) => rows[a][2] !== rows[b][2]));
  near(gini(0.5), 0.5);
  near(entropy(0.5), 1);
  near(2.8 ** 2, 7.84);
  assert.ok(2.8 > 2.5 && 2.8 ** 2 < 8.5);
  assert.deepEqual(
    options.map((p) => gain(p, gini).toFixed(4)),
    ['0.1000', '0.1250'],
  );
  assert.deepEqual(
    options.map((p) => gain(p, entropy).toFixed(4)),
    ['0.1909', '0.1887'],
  );
  near(squareError(targets, [30, 30, 30]) - squareError(targets, [15, 15, 60]), 450);
  near(best(rows, [1]).gain, 1 / 6);
  near(stump.gain, 0.3);
  near(stump.cut, 3.35);
  assert.equal(gaps(0).length, 7);
  assert.deepEqual(
    panes(tree).map((p) => [p.n, p.rate]),
    [
      [2, 0],
      [1, 1],
      [2, 0],
      [3, 1],
    ],
  );
  assert.deepEqual(
    policyCosts(tree)
      .filter((e) => e.cost)
      .map((e) => [e.id, e.score, e.cost]),
    [
      ['V2', 1, 18],
      ['V8', 0, 120],
    ],
  );
  assert.deepEqual(
    votes(false).map((v) => v.score),
    [0, 1, 0],
  );
  assert.deepEqual(
    votes(true)
      .filter((v) => v.eligible)
      .map((v) => v.i),
    [0, 2],
  );
  assert.deepEqual(boost[1], [28.5, 28.5, 33]);
  assert.equal(squareError(targets, boost[4]).toFixed(2), '210.38');
  assert.deepEqual(
    newtonRound(0).map((s) => s.step),
    [-1.2, 2],
  );
  near(newtonRound(1)[0].logit, -0.12);
  assert.equal(validationAfterBoosting(4).loss.toFixed(3), '0.584');
  for (let swaps = 0; swaps <= 4; swaps++) {
    const data = permutedRows(swaps);
    assert.deepEqual(
      data.map((r) => r.slice(1)),
      validationRows.map((r) => r.slice(1)),
    );
    assert.deepEqual(data.map((r) => r[0]).sort(), validationRows.map((r) => r[0]).sort());
  }
  const flip = policyCosts(fittedStump, 0.5, permutedRows(4));
  assert.deepEqual(
    flip.map((e) => e.cost),
    [0, 18, 120, 18, 120, 0, 120, 120],
  );
  assert.equal(bill(flip).total, 516);
  assert.deepEqual(
    compareModels().map((r) => r[2]),
    [240, 72, 138, 54, 240, 36],
  );
  near(bill(policyCosts(fittedStump, 0.5)).f1, 2 / 3);
  near(bill(policyCosts(fittedStump, 0.2)).f1, 2 / 3);
  near(importance[0].mdi + importance[1].mdi, 1);
  assert.ok(importance[0].drop < importance[1].drop);
  near(backgroundScore([true, false]), 0.2);
  near(backgroundScore([false, true]), 0.5);
  assert.deepEqual([null, 0, 2].map(missingRoute), ['Add review', 'Usual checks', 'Add review']);
  near(biasSq + variance + noise, 0.17);
  for (const [price, costs, cut, action, charge] of [
    [40, [72, 80], 0.2, true, 0],
    [30, [72, 60], 0.5, false, 30],
  ]) {
    const { bills, winner, entry } = decision(price);
    assert.deepEqual(
      bills.map((b) => b.total),
      costs,
    );
    assert.deepEqual(
      bills.map((b) => b.queued),
      [8, 2],
    );
    assert.deepEqual(
      [winner.threshold, entry.score, entry.review, entry.cost],
      [cut, 0.2, action, charge],
    );
  }
  return true;
}
