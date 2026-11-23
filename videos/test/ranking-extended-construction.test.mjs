import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRAINING_PAIRS,
  meanPairGradient,
  fitPairwise,
  diversifiedPair,
  buildCurrentSlate,
  evaluatedRanking,
  pairGradientPrefix,
  weightedClickExpectation,
} from '../animations/capstone-product-ranking-recommendation.mjs';

const close = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('all directed request pairs contribute to the actual mean and frozen fit', () => {
  assert.deepEqual(
    TRAINING_PAIRS.map((row) => row.request),
    [
      'TRAIN-1',
      'TRAIN-1',
      'TRAIN-1',
      'TRAIN-2',
      'TRAIN-2',
      'TRAIN-2',
      'TRAIN-3',
      'TRAIN-3',
      'TRAIN-3',
    ],
  );
  const gradient = meanPairGradient([0, 0]);
  close(gradient[0], 1 / 60);
  close(gradient[1], -29 / 180);
  const first = fitPairwise(0.1, 1);
  close(first.weights[0], -0.005);
  close(first.weights[1], 29 / 600);
  const fit = fitPairwise(0.1);
  close(fit.weights[0], -0.10928947078945259);
  close(fit.weights[1], 1.228977109022056);
  assert.deepEqual(fit.history[0], [0, 0]);
  assert.notDeepEqual(fitPairwise(0).weights, fit.weights);
});

test('the same opposing redundancy term changes the second MMR owner', () => {
  const before = diversifiedPair(0),
    middle = diversifiedPair(0.5),
    after = diversifiedPair(1);
  assert(before[0].value > before[1].value);
  assert(middle[0].value > middle[1].value);
  assert(after[0].value < after[1].value);
  close(after[0].value, 0.144);
  close(after[1].value, 0.23);
  for (const rows of [before, middle, after])
    for (const row of rows) close(row.value, row.positive - row.subtracted);
  assert.deepEqual(
    after.map((row) => row.id),
    before.map((row) => row.id),
  );
});

test('stock loss keeps the old score but rebuilds from current eligible fallback', () => {
  const rows = [
    { id: 'J1', score: 0.16, stock: true, allowed: true, seller: 'S1' },
    { id: 'J2', score: 1.01, stock: true, allowed: true, seller: 'S2' },
    { id: 'J3', score: 0.66, stock: true, allowed: true, seller: 'S3' },
  ];
  assert.deepEqual(
    buildCurrentSlate(rows).map((row) => row.id),
    ['J2', 'J3', 'J1'],
  );
  const changed = rows.map((row) => ({ ...row, stock: row.id !== 'J3' }));
  changed.push({ id: 'J5', score: 0.31, stock: true, allowed: true, seller: 'S5' });
  assert.deepEqual(
    buildCurrentSlate(changed).map((row) => row.id),
    ['J2', 'J5', 'J1'],
  );
  assert.equal(changed.find((row) => row.id === 'J3').score, 0.66);
  assert.equal(rows.find((row) => row.id === 'J3').stock, true);
  const sameSeller = changed.map((row) => ({ ...row, seller: 'one' }));
  assert.equal(buildCurrentSlate(sameSeller).length, 2);
});

test('later request metrics come from their actual scored identities', () => {
  const request = {
    id: 'TEST-7',
    products: [
      ['G1', 0.95, 0.35, 1],
      ['G2', 0.87, 0.85, 3],
      ['G3', 0.82, 0.65, 2],
    ],
  };
  const baseline = evaluatedRanking(request, [1, 0]),
    fitted = evaluatedRanking(request, fitPairwise(0.1).weights);
  assert.deepEqual(
    baseline.rows.map((row) => row.id),
    ['G1', 'G2', 'G3'],
  );
  assert.deepEqual(
    fitted.rows.map((row) => row.id),
    ['G2', 'G3', 'G1'],
  );
  close(baseline.ndcg, 0.7363636171343382);
  close(fitted.ndcg, 1);
  assert(evaluatedRanking(request, [0, -1]).ndcg < fitted.ndcg);
});

test('partial pair sums preserve the current signed row and complete the actual numerator', () => {
  assert.deepEqual(pairGradientPrefix(0).sum, [0, 0]);
  const firstHalf = pairGradientPrefix(1 / 18);
  assert.equal(firstHalf.completed, 0);
  assert.equal(firstHalf.current.better, 'A2');
  close(firstHalf.sum[0], 0.025);
  close(firstHalf.sum[1], -0.15);
  const first = pairGradientPrefix(1 / 9),
    secondHalf = pairGradientPrefix(1 / 6);
  close(first.sum[0], 0.05);
  assert(secondHalf.sum[0] < first.sum[0]);
  assert(secondHalf.sum[1] < first.sum[1]);
  const final = pairGradientPrefix(1);
  assert.equal(final.completed, 9);
  assert.equal(final.current, null);
  meanPairGradient([0, 0]).forEach((value, i) => close(final.sum[i], 9 * value));
  assert.deepEqual(pairGradientPrefix(1 / 6), secondHalf);
});

test('inverse weighting grows the same raw mass and clipping removes its actual excess', () => {
  const raw = weightedClickExpectation(0.2, 0.5, 0),
    weighted = weightedClickExpectation(0.2, 0.5, 1);
  close(raw.weight, 1);
  close(raw.weighted, 0.1);
  close(weighted.weight, 5);
  close(weighted.weighted, 0.5);
  const midway = weightedClickExpectation(0.2, 0.5, 0.5, 2),
    clipped = weightedClickExpectation(0.2, 0.5, 1, 2);
  close(midway.weight, 3.5);
  close(midway.weighted, 0.35);
  close(clipped.weight, 2);
  close(clipped.weighted, 0.2);
  for (const progress of [0, 0.25, 0.5, 1])
    close(weightedClickExpectation(0.8, 0.5, progress, 2).weighted, 0.5);
});
