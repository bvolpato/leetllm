import assert from 'node:assert/strict';
export const shape = [2, 3, 4];
export const tensor = Array.from(
  {
    length: 24,
  },
  (_, i) => i,
);
export const bias = [100, 200, 300, 400];
export const sequence0 = Array.from(
  {
    length: 3,
  },
  (_, t) => tensor.slice(t * 4, t * 4 + 4),
);
export const sequence1 = Array.from(
  {
    length: 3,
  },
  (_, t) => tensor.slice(12 + t * 4, 12 + t * 4 + 4),
);
export const tokenMean = [0, 1].map((batch) =>
  Array.from(
    {
      length: 4,
    },
    (_, d) =>
      Array.from(
        {
          length: 3,
        },
        (_, t) => tensor[batch * 12 + t * 4 + d],
      ).reduce((a, v) => a + v, 0) / 3,
  ),
);
export const featureMean = [0, 1].map((batch) =>
  Array.from(
    {
      length: 3,
    },
    (_, t) => {
      const row = tensor.slice(batch * 12 + t * 4, batch * 12 + t * 4 + 4);
      return row.reduce((a, v) => a + v, 0) / 4;
    },
  ),
);
export const shifted = tensor.map((v, i) => v + bias[i % 4]);
export const attentionScores = [0, 1].map((batch) => {
  const rows = batch === 0 ? sequence0 : sequence1;
  return rows.map((q) => rows.map((k) => q.reduce((sum, v, i) => sum + v * k[i], 0)));
});
export const firstSnippetWords = ['Birds', 'migrate', 'south'];
export const attentionMatrixOrder = [
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 0],
  [0, 1],
  [0, 2],
  [2, 0],
  [2, 1],
  [2, 2],
];
export const headZeroTokenOne = sequence0[1].slice(0, 2);
export const headOneTokenOne = sequence0[1].slice(2, 4);
export const transposeBatch0 = Array.from(
  {
    length: 4,
  },
  (_, d) => sequence0.map((row) => row[d]),
);
export const reshapeBatch0 = Array.from(
  {
    length: 4,
  },
  (_, row) => tensor.slice(row * 3, row * 3 + 3),
);
export const sentenceWords = [
  ['Birds', 'migrate', 'south'],
  ['Children', 'enjoy', 'stories'],
];
export const numberedEntries = tensor.map((value, index) => ({
  value,
  batch: Math.floor(index / 12),
  token: Math.floor((index % 12) / 4),
  feature: index % 4,
  id: index,
}));
export const broadcastOrder = [
  4, 5, 6, 7, 16, 17, 18, 19, 0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23,
];
export const tokenOffsets = [10, 20, 30];
export const tokenShifted = [sequence0, sequence1].map((rows) =>
  rows.map((row, t) => row.map((value) => value + tokenOffsets[t])),
);
export const squareInput = sequence0.map((row) => row.slice(0, 3));
export const wrongSquare = squareInput.map((row) => row.map((value, d) => value + tokenOffsets[d]));
export const rightSquare = squareInput.map((row, t) => row.map((value) => value + tokenOffsets[t]));
export function featureBiasContract(dimensions, offsets, dtype = 'float32') {
  const rank = dimensions.length === 3;
  const fits = rank && offsets.length === dimensions[2] && offsets.every(v => typeof v === 'number');
  return {
    rank,
    bias: fits,
    dtype: dtype === 'float32',
    accepted: fits && dtype === 'float32',
  };
}
export function buildVerifiedImageFixture() {
  const imageChannelMeans = [0.52, 0.48, 0.44];
  const centeredWhitePixel = imageChannelMeans.map((value) => +(1 - value).toFixed(2));
  assert.deepEqual(centeredWhitePixel, [0.48, 0.52, 0.56]);
  assert.equal(featureBiasContract(shape, [10, 20, 30]).accepted, false);
  assert.equal(featureBiasContract(shape, [[10], [20], [30], [40]]).accepted, false);
  assert.equal(featureBiasContract(shape, bias).accepted, true);
  return {
    imageChannelMeans,
    centeredWhitePixel,
  };
}
export const { imageChannelMeans, centeredWhitePixel } = buildVerifiedImageFixture();
