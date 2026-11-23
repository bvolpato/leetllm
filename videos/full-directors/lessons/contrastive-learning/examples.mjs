import assert from 'node:assert/strict';
import {
  ANGLES,
  START,
  TAU,
  NESTED_Q,
  NESTED_D,
  MINING_FIXTURE,
} from '../../../films/contrastive-learning/fixtures.mjs';
import {
  vector,
  evaluate,
  steps,
  finiteUnit,
  comparisonRow,
  maskedMean,
  tokenMaxSim,
  nestedLoss,
  shortlistMetrics,
  miningCandidates,
} from '../../../films/contrastive-learning/arithmetic.mjs';
import { sum, dot } from './studio.mjs';
export {
  ANGLES,
  START,
  TAU,
  NESTED_Q,
  NESTED_D,
  MINING_FIXTURE,
  vector,
  evaluate,
  steps,
  finiteUnit,
  comparisonRow,
  maskedMean,
  tokenMaxSim,
  nestedLoss,
  shortlistMetrics,
  miningCandidates,
};
export const scores = evaluate().scores,
  path = steps(30),
  archive = ['Puppy', 'Sleeper', 'Sky'],
  subjects = ['puppy', 'sleeper', 'sky'];
const scoreDerivatives = comparisonRow(scores, TAU).gradients;
export const firstTurnTerms = ANGLES.map((captionAngle, i) => {
  const lossPerScore = scoreDerivatives[i];
  const scorePerRadian = -Math.sin(START - captionAngle);
  return { lossPerScore, scorePerRadian, lossPerRadian: lossPerScore * scorePerRadian };
});
export const firstTurnSlope = sum(firstTurnTerms.map((term) => term.lossPerRadian));
export const angleStepSize = 0.03;
export const caption = ['A puppy runs', 'A dog sleeps', 'The sky is blue'];
export const words = { compiler: [0.9, 0.1, 0], calls: [0.8, 0.2, 0.1], linker: [0.7, 0.1, 0.2] };
export const states = [
    [
      [1, 0],
      [0, 1],
      [99, 99],
    ],
    [
      [0, 2],
      [0, 0],
      [99, 99],
    ],
  ],
  masks = [
    [1, 1, 0],
    [1, 0, 0],
  ];
export const means = states.map((row, i) => maskedMean(row, masks[i]));
export function poolLoss(input) {
  return (
    sum(input.map((row, i) => comparisonRow(finiteUnit(maskedMean(row, masks[i])), 0.2, i).loss)) /
    2
  );
}
export function tokenGrad(j) {
  return [0, 1].map((d) => {
    const delta = (h) => {
      const x = structuredClone(states);
      x[0][j][d] += h;
      return poolLoss(x);
    };
    return (delta(0.00001) - delta(-0.00001)) / 0.00002;
  });
}
export const triplet = (p, n, m) => Math.max(0, p - n + m);
export function pairAt(t) {
  const row = comparisonRow([0.9, 0.2], t);
  return { prob: row.probs[0], g: row.probs[1] / t };
}
export const duplicateScores = [0.8, 0.8, 0.1];
export const alias = (mirror, masked) =>
  comparisonRow(mirror ? [0.65, 0.65, 0.05] : duplicateScores, mirror ? 0.15 : 0.2, 0, [
    true,
    !masked,
    true,
  ]);
export const multi = [0.999, 0.0005, 0.0005],
  posMass = multi[0] + multi[1],
  massLoss = -Math.log(posMass),
  meanLog = -(Math.log(multi[0]) + Math.log(multi[1])) / 2;
export const up = (target, prob, t = 0.2) => (target - prob) / t;
export const maxTable = (swapped) => [
  [0.12, 0.93, 0.08],
  swapped ? [0.19, 0.91, 0.07] : [0.19, 0.07, 0.91],
];
export const vectors = [
  [0.6, 0.8],
  [0.6, 0.8],
  [0.6, -0.8],
];
const rawQueryPairs = NESTED_Q.map((q) => q.slice(0, 2));
const rawPassagePairs = NESTED_D.map((p) => p.slice(0, 2));
const unitPassages = rawPassagePairs.map(finiteUnit);
const prefixCosines = rawQueryPairs.map(finiteUnit).map((q) => unitPassages.map((p) => dot(q, p)));
const prefixTemperature = 0.2;
export const widthTwo = {
  queries: rawQueryPairs,
  passages: rawPassagePairs,
  cosines: prefixCosines,
  temperature: prefixTemperature,
  losses: prefixCosines.map((row, i) => comparisonRow(row, prefixTemperature, i).loss),
};
export const mtebTasks = [
  ['Retrieval', 15], ['Classify', 12], ['Cluster', 11], ['STS', 10],
  ['Rerank', 4], ['Pair cls.', 3], ['Bitext', 2], ['Summary', 1],
];
export const englishTable = mtebTasks.filter(([name]) => name !== 'Bitext');
export const teacherTarget = 3.2;
export function batchMatrix(n, gathered) {
  const groups = ['ABC', 'ABC', 'ABC', 'DE', 'DE'].slice(0, n);
  return groups.map((q) => groups.map((p) => gathered || p === q));
}
export const fixedCosts = { deadline: 180, query: 16, lookup: 21, overhead: 7, pair: 12 };
export const indexDocs = [
  ['KMS rotation', 0.84, 0.21],
  ['API rotation', 0.81, 0.96],
  ['Replace token', 0.78, 0.91],
  ['GPU notes', 0.1, 0.05],
];
export const rerank = (k) =>
  indexDocs
    .slice(0, k)
    .sort((a, b) => b[2] - a[2])
    .slice(0, 2);
export const budgets = (deadline, fixed, pair) => Math.floor((deadline - fixed) / pair);
export const tireRelevant = ['Jack points', 'Lift diagram'];
export const tireOrder = (short) =>
  short
    ? ['Jack points', 'Tire sizes', 'Lift diagram']
    : ['Tire sizes', 'Jack points', 'Lift diagram'];
export const rel = [['rotation', 'replacement'], ['expiry'], ['revocation']];
export function ranks(stage) {
  return [
    [
      ['KMS', 'rotation'],
      ['rotation', 'KMS'],
      ['rotation', 'replacement'],
    ][stage],
    ['expiry', 'rotation'],
    ['KMS', 'expiry'],
  ];
}
export function checks() {
  const near = (a, b, t = 1e-6) => assert(Math.abs(a - b) < t, a + ' vs ' + b);
  const lexical = caption.map(
    (s) =>
      s
        .toLowerCase()
        .split(' ')
        .filter((w) => ['dog', 'running'].includes(w)).length,
  );
  assert.deepEqual(lexical, [0, 1, 0]);
  assert.deepEqual(means, [
    [0.5, 0.5],
    [0, 2],
  ]);
  near(poolLoss(states), 0.349931, 0.000001);
  assert.deepEqual(tokenGrad(2), [0, 0]);
  near(tokenGrad(0)[0], -0.883883, 0.000001);
  assert.throws(() => finiteUnit([0, 0]));
  near(finiteUnit([1e-300, 1e-300])[0], Math.SQRT1_2);
  assert.throws(() => maskedMean([[1, 2]], [0]));
  for (const allowed of [
    [true, true, true],
    [true, false, true],
    [true, true, false],
  ]) {
    const row = comparisonRow(scores, 0.2, 0, allowed);
    assert(row.sum >= 1);
    near(sum(row.probs), 1);
    near(sum(row.gradients), 0);
  }
  const base = comparisonRow(scores, 0.2, 0, [true, false, true]);
  const admitted = comparisonRow(scores, 0.2);
  assert.deepEqual(admitted.masses.map((v) => v.toFixed(4)), ['1.0000', '0.7390', '0.0032']);
  assert.deepEqual([base, admitted].map((row) => row.sum.toFixed(4)), ['1.0032', '1.7422']);
  assert.deepEqual([base, admitted].map((row) => (100 * row.probs[0]).toFixed(1)), ['99.7', '57.4']);
  near(comparisonRow([1e308, 1e308], 1).loss, Math.log(2));
  assert.throws(() => comparisonRow([1e308, 1e308], 0.01));
  assert.throws(() => comparisonRow([0.5, 0.6], 0));
  near(triplet(0.2, 0.5, 0.1), 0);
  near(triplet(0.5, 0.3, 0.1), 0.3);
  near(pairAt(0.01).g, 3.9754497e-29, 1e-33);
  near(
    evaluate(START).gradient,
    (evaluate(START + 0.00001).loss - evaluate(START - 0.00001).loss) / 0.00002,
  );
  near(firstTurnSlope, evaluate(START).gradient);
  near(START - angleStepSize * firstTurnSlope, path[1]);
  assert.deepEqual(firstTurnTerms.map((term) => term.lossPerRadian.toFixed(3)), [
    '1.203', '1.366', '0.009',
  ]);
  assert.deepEqual(
    [firstTurnSlope, START, path[1]].map((v) => v.toFixed(4)),
    ['2.5777', '0.7000', '0.6227'],
  );
  assert.deepEqual(
    [0, 1, 30].map((i) => Math.round(evaluate(path[i]).probs[0] * 100)),
    [57, 68, 96],
  );
  near(alias(false, false).gradients[1], 2.4628, 0.001);
  assert.equal(alias(false, true).gradients[1], 0);
  for (const [n, gathered, offDiagonal] of [[1, false, 0], [3, false, 6], [5, false, 8], [5, true, 20]]) {
    assert.equal(batchMatrix(n, gathered).flat().filter(Boolean).length - n, offDiagonal);
  }
  near(massLoss, 0.000500125);
  near(meanLog, 3.800951);
  near(up(0.5, multi[1]), 2.4975);
  near(up(multi[1] / posMass, multi[1]), 0.000001250625);
  assert.deepEqual(
    miningCandidates('How do I rotate an API key?').map((x) => x.id),
    ['service account', 'KMS intent'],
  );
  near((teacherTarget - 2) ** 2, 1.44);
  for (const swapped of [false, true]) {
    const a = tokenMaxSim(maxTable(swapped));
    assert.deepEqual(a.winners, swapped ? [1, 1] : [1, 2]);
    near(a.sum, 1.84);
  }
  near(dot(vectors[0], vectors[2]), -0.28);
  assert.deepEqual(
    vectors.map((v) => finiteUnit(v.slice(0, 1))),
    [[1], [1], [1]],
  );
  assert.deepEqual(
    [2, 4, 6].map((w) => nestedLoss(w).toFixed(4)),
    ['0.0088', '0.0147', '0.0225'],
  );
  assert.deepEqual(prefixCosines.map((row) => row.map((v) => v.toFixed(3))), [
    ['0.999', '0.053'], ['0.053', '0.999'],
  ]);
  widthTwo.losses.forEach((loss, i) => {
    const row = prefixCosines[i];
    near(loss, Math.log1p(Math.exp((row[1 - i] - row[i]) / widthTwo.temperature)));
    near(loss, nestedLoss(2));
  });
  assert.equal(sum(mtebTasks.map(([, n]) => n)), 58);
  assert.equal(sum(englishTable.map(([, n]) => n)), 56);
  assert.equal(englishTable.length, 7);
  assert.deepEqual(
    rerank(3).map((d) => d[0]),
    ['API rotation', 'Replace token'],
  );
  assert.equal(rerank(1)[0][0], 'KMS rotation');
  const { deadline, query, lookup, overhead, pair } = fixedCosts;
  const fixedMs = query + lookup + overhead;
  const count = budgets(deadline, fixedMs, pair);
  assert.deepEqual([count, fixedMs + count * pair, fixedMs + (count + 1) * pair], [11, 176, 188]);
  near(sum(ranks(0).map((a, i) => shortlistMetrics(a, rel[i], 2).rr)) / 3, 0.5);
  assert(up(0, evaluate().probs[1]) < 0 && up(0.5, evaluate().probs[1]) > 0);
  near(alias(true, false).gradients[1], 3.303084);
  assert.equal(alias(true, true).gradients[1], 0);
  near(alias(true, true).loss, 0.01815, 0.00001);
  for (const short of [false, true]) {
    const m = shortlistMetrics(tireOrder(short), tireRelevant, 2);
    assert.equal(m.rr, short ? 1 : 0.5);
    assert.equal(m.recall, 0.5);
    assert(m.recall < 0.75);
  }
  return true;
}
