import {
  attentionScores,
  bias,
  featureMean,
  headOneTokenOne,
  headZeroTokenOne,
  reshapeBatch0,
  rightSquare,
  sequence0,
  shape,
  shifted,
  tensor,
  tokenMean,
  transposeBatch0,
  wrongSquare,
} from './fixtures.mjs';
import {
  attentionPairConstruction,
  attentionSlicePrediction,
  headFrame,
  indexedWriteFrame,
  indexFrame,
  indexSelection,
  precisionFrame,
  reductionConstruction,
  reductionFrame,
  teachingSnapshot,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateBaselineModel() {
  assert.deepEqual(shape, [2, 3, 4]);
  assert.deepEqual(sequence0[1], [4, 5, 6, 7]);
  assert.deepEqual(
    bias.map((v, i) => v + sequence0[1][i]),
    [104, 205, 306, 407],
  );
  assert.deepEqual(tokenMean, [
    [4, 5, 6, 7],
    [16, 17, 18, 19],
  ]);
  assert.deepEqual(featureMean, [
    [1.5, 5.5, 9.5],
    [13.5, 17.5, 21.5],
  ]);
  assert.deepEqual(headZeroTokenOne, [4, 5]);
  assert.deepEqual(headOneTokenOne, [6, 7]);
  assert.deepEqual(reshapeBatch0[1], [3, 4, 5]);
  assert.deepEqual(transposeBatch0[3], [3, 7, 11]);
  assert.deepEqual(attentionScores[0], [
    [14, 38, 62],
    [38, 126, 214],
    [62, 214, 366],
  ]);
  assert.deepEqual(attentionPairConstruction(1, 0.5).partialSums, [5, 41, 77]);
  assert.deepEqual(
    attentionPairConstruction(1, 1).keys.map((key) => key.score),
    [38, 126, 214],
  );
  assert.equal(attentionPairConstruction(2, 0.38).completedMatrixCells, 3);
  assert.equal(attentionPairConstruction(2, 0.92).completedMatrixCells, 9);
  assert.deepEqual(attentionSlicePrediction(), {
    expression: 'scores[0, 1:2, :]',
    queryToken: 'migrate',
    keyToken: 'south',
    score: 214,
    row: [38, 126, 214],
    shape: [1, 3],
  });
  assert.equal(shifted[4], 104);
  assert.equal(tensor.length, 2 * 3 * 4);
  for (const [i, onset] of [2, 2.3125, 2.825, 3.725, 4.2125, 4.6].entries()) {
    assert.equal(teachingSnapshot('intro', 0, (onset - 1e-6) / 15.934).wordCount, i);
    assert.equal(teachingSnapshot('intro', 0, onset / 15.934).wordCount, i + 1);
  }
  assert.equal(teachingSnapshot('intro', 0, 8.075 / 15.934).featureCount, 4);
  assert.deepEqual(teachingSnapshot('intro', 1, 0), {
    wordCount: 6,
    featureCount: 4,
  });
  assert.equal(teachingSnapshot('shape', 0, 6.3 / 16.246).axisCount, 3);
  assert.deepEqual(teachingSnapshot('index', 1, 0).selected, [16, 17, 18, 19]);
  for (const progress of [0, 0.5, 1])
    assert.equal(teachingSnapshot('broadcast', 0, progress).completed, 0);
  assert.equal(teachingSnapshot('broadcast', 1, 0).completed, 0);
  assert.equal(teachingSnapshot('broadcast', 1, 0).active, 4);
  assert.equal(teachingSnapshot('broadcast', 1, 0.5).completed, 8);
  assert.equal(teachingSnapshot('broadcast', 1, 1).completed, 12);
  assert.deepEqual(teachingSnapshot('broadcast', 2, 0).result[1], [104, 205, 306, 407]);
  assert.deepEqual(teachingSnapshot('reduce', 0, 0).values[0], [4, 5, 6, 7]);
  assert.deepEqual(teachingSnapshot('reduce', 1, 0).values[0], [1.5, 5.5, 9.5]);
  assert.equal(teachingSnapshot('reduce', 1, 0).axis, 2);
  assert.equal(teachingSnapshot('reduce', 2, 0).keepdims, true);
  assert(!indexSelection(0, 0).batchChosen);
  assert.equal(indexSelection(0, 1).completed, 4);
  assert.equal(indexSelection(1, 0).completed, 4);
  assert.equal(reductionConstruction(0, 0).resultCount, 0);
  assert.equal(reductionConstruction(0, 1).sum[0], 12);
  assert.equal(reductionConstruction(1, 1).sum[0], 6);
  assert.deepEqual(reductionConstruction(2, 0).values, tokenMean);
  return true;
}
export function validateModel() {
  validateBaselineModel();
  assert.deepEqual(
    indexFrame({
      beat: 1,
      beatP: 1,
    }).sliceShape,
    [1, 4],
  );
  assert.deepEqual(wrongSquare[0], [10, 21, 32]);
  assert.deepEqual(rightSquare[0], [10, 11, 12]);
  const precision = precisionFrame();
  assert.equal(precision.narrowFirst, 16777216);
  assert.equal(precision.wideFirst, 16777217);
  assert.deepEqual([precision.narrowSum, precision.wideSum], [0, 1]);
  assert.deepEqual([precision.narrowMean, precision.wideMean], [0, 0.3333333333333333]);
  assert.deepEqual(attentionScores[1][0], [734, 950, 1166]);
  assert.deepEqual(
    reductionFrame({
      beat: 2,
      beatP: 1,
    }).centered[0],
    [
      [-4, -4, -4, -4],
      [0, 0, 0, 0],
      [4, 4, 4, 4],
    ],
  );
  assert.deepEqual(
    headFrame({
      beat: 2,
      beatP: 1,
    }).correctPair,
    [4, 5],
  );
  assert.deepEqual(
    headFrame({
      beat: 2,
      beatP: 1,
    }).directPair,
    [2, 3],
  );
  const heads = headFrame({ beat: 4, beatP: 1 });
  assert.deepEqual(heads.correct[1][1][0], [14, 15]);
  assert.deepEqual(heads.direct[1][1][0], [18, 19]);
  const zeros = Array.from({ length: 2 }, () => sequence0.map((row) => row.map(() => 0)));
  const zeroHeads = headFrame({ beat: 6, beatP: 1 }, zeros);
  assert.deepEqual(zeroHeads.correct[1][1][0], zeros[1][0].slice(2));
  assert.deepEqual(zeroHeads.direct[1][1][0], zeros[1][0].slice(2));
  for (const [beat, firstSource, firstPicked] of [
    [2, 0, 0],
    [3, 0, -1],
    [4, 0, 0],
    [5, -1, 0],
  ]) {
    const { source, picked } = indexedWriteFrame({ beat, beatP: 1 });
    assert.deepEqual(source, [firstSource, 1, 2, 3]);
    assert.deepEqual(picked, [firstPicked, 1, 2, 3]);
  }
  return true;
}
