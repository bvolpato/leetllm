import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  attentionScores,
  bias,
  centeredWhitePixel,
  featureBiasContract,
  featureMean,
  imageChannelMeans,
  reshapeBatch0,
  rightSquare,
  sentenceWords,
  sequence0,
  sequence1,
  shape,
  shifted,
  squareInput,
  tensor,
  tokenMean,
  tokenOffsets,
  tokenShifted,
  transposeBatch0,
  wrongSquare,
} from '../../../films/tensor-shapes/fixtures.mjs';
import { precisionFrame } from '../../../films/tensor-shapes/model.mjs';

export {
  attentionScores,
  bias,
  centeredWhitePixel,
  featureBiasContract,
  featureMean,
  imageChannelMeans,
  reshapeBatch0,
  rightSquare,
  sentenceWords,
  shape,
  shifted,
  squareInput,
  tensor,
  tokenMean,
  tokenOffsets,
  tokenShifted,
  transposeBatch0,
  wrongSquare,
};
export const batch = [sequence0, sequence1];
export const precision = precisionFrame();
export const bytesPerFeature = Float32Array.BYTES_PER_ELEMENT;
export const tokenStride = shape[2] * bytesPerFeature;
export const transposeReadOffsets = transposeBatch0.flatMap((row, feature) =>
  row.map((_, token) => token * shape[2] + feature),
);
export const centered = batch.map((rows, b) =>
  rows.map((row) => row.map((v, d) => v - tokenMean[b][d])),
);
export const middleRows = batch.map((rows) => rows[1]);
export const enjoyVector = batch[1][1];
export const enjoyTable = batch[1].slice(1, 2);
export const zeroBatch = batch.map((rows) => rows.map((row) => row.map(() => 0)));
export const modelWidth = 768;
export const modelHeadCount = 12;
export function headWidth(width, count) {
  if (!Number.isInteger(count) || count < 1 || width % count)
    throw new RangeError('Unequal head widths');
  return width / count;
}
export function headLayout(input, direct) {
  const heads = 2;
  return input.map((rows) => {
    const width = headWidth(rows[0].length, heads);
    const flat = rows.flat();
    return Array.from({ length: heads }, (_, h) =>
      rows.map((row, t) => {
        const source = direct ? flat : row;
        const start = width * (direct ? h * rows.length + t : h);
        return source.slice(start, start + width);
      }),
    );
  });
}
export function proof(input, b, h, t) {
  const start = h * headWidth(input[b][t].length, 2);
  const wanted = input[b][t].slice(start, start + input[b][t].length / 2);
  const actual = [true, false].map((direct) => headLayout(input, direct)[b][h][t]);
  return { wanted, actual, passes: actual.map((pair) => pair.every((v, i) => v === wanted[i])) };
}
export function writeExample({ sliceWrite, copyWrite, sourceWrite }) {
  const source = Float32Array.from(tensor);
  const middle = [4, 16].map((start) => source.subarray(start, start + 4));
  if (sliceWrite) middle[0][0] = 99;
  const picked = source.slice();
  if (copyWrite) picked[0] = -1;
  if (sourceWrite) source[0] = -1;
  return { source, middle, picked };
}
export function dotTerms(key) {
  return batch[0][1].map((q, d) => q * batch[0][key][d]);
}
export function canBroadcast(left, right) {
  return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => {
    const a = left.at(-i - 1) ?? 1,
      b = right.at(-i - 1) ?? 1;
    return a === b || a === 1 || b === 1;
  }).every(Boolean);
}
export function check() {
  const ref = JSON.parse(
    readFileSync(
      new URL('../../../test/fixtures/tensor-shapes-numpy-reference.json', import.meta.url),
    ),
  );
  const eq = assert.deepEqual;
  eq(batch, ref.values);
  eq(shape, ref.shape);
  eq(enjoyVector, ref.indexVector);
  eq(enjoyTable, ref.indexSlice);
  eq(middleRows, ref.allMiddleTokens);
  eq(shifted, ref.shifted.flat(2));
  eq(tokenShifted, ref.tokenShifted);
  eq(wrongSquare, ref.wrongSquareBroadcast);
  eq(rightSquare, ref.rightSquareBroadcast);
  eq(
    [
      canBroadcast(shape, [3]),
      canBroadcast(shape, [3, 1]),
      canBroadcast(shape, [2, 4]),
      canBroadcast(shape, [2, 1, 4]),
    ],
    [false, true, false, true],
  );
  eq(featureBiasContract(shape, bias).accepted, true);
  eq(featureBiasContract(shape, tokenOffsets).accepted, false);
  eq(featureBiasContract([3, 4], bias).accepted, false);
  eq(featureBiasContract(shape, bias, 'int16').dtype, false);
  eq(centeredWhitePixel, [0.48, 0.52, 0.56]);
  eq(tokenMean, ref.tokenMeans);
  eq(featureMean, ref.featureMeans);
  eq(centered, ref.centered);
  eq(precision.inputs, ref.precision.inputs);
  eq([precision.narrowFirst, precision.wideFirst], [2 ** 24, 2 ** 24 + 1]);
  eq(
    [precision.narrowMean, precision.wideMean],
    [ref.precision.float32Mean, ref.precision.float64Mean],
  );
  eq(reshapeBatch0, ref.reshape[0]);
  eq(transposeBatch0, ref.transpose[0]);
  eq(tokenStride, ref.strides.transpose[2]);
  eq(transposeBatch0.flat(), ref.flattenedTranspose[0]);
  eq(
    transposeReadOffsets.map((offset) => tensor[offset]),
    ref.flattenedTranspose[0],
  );
  eq(
    transposeReadOffsets.slice(1, 4).map((offset, i) => offset - transposeReadOffsets[i]),
    [4, 4, -7],
  );
  const beforeWrite = writeExample({ sliceWrite: true });
  eq([beforeWrite.source[0], beforeWrite.picked[0]], [0, 0]);
  const write = writeExample({ sliceWrite: true, copyWrite: true });
  eq(Array.from(write.source), ref.sourceAfterCopyEdit.flat(2));
  eq(Array.from(write.picked), ref.retrievedCopyAfterEdit.flat(2));
  assert.equal(write.middle[0].buffer, write.source.buffer);
  assert.notEqual(write.picked.buffer, write.source.buffer);
  const direct = writeExample({ sliceWrite: true, sourceWrite: true });
  eq([direct.source[0], direct.picked[0]], [-1, 0]);
  eq(attentionScores, ref.scores);
  eq(
    [0, 1, 2].map((k) => dotTerms(k).reduce((a, b) => a + b)),
    ref.scores[0][1],
  );
  eq(attentionScores[0].slice(1, 2), [[38, 126, 214]]);
  eq(headLayout(batch, false), ref.heads);
  eq(headLayout(batch, true), ref.directHeads);
  eq(proof(batch, 0, 0, 1).actual, [
    [2, 3],
    [4, 5],
  ]);
  eq(proof(batch, 1, 1, 0).actual, [
    [18, 19],
    [14, 15],
  ]);
  eq(proof(batch, 1, 1, 0).passes, [false, true]);
  eq(proof(zeroBatch, 1, 1, 0).passes, [true, true]);
  eq(headWidth(modelWidth, modelHeadCount), 64);
  assert.throws(() => headWidth(5, 2), RangeError);
}
