import { blockScale, prefixes, roundTrip, sum } from './encoding.mjs';
import { rows, weights } from './fixtures.mjs';
export function scaleExperiment() {
  const tensorScale = Math.max(...rows.flat().map(Math.abs)) / 448,
    weightScale = Math.max(...weights.map(Math.abs)) / 448;
  const scales = rows.map(blockScale),
    wScale = blockScale(weights);
  const tensor = rows.map((row) => row.map((value) => roundTrip(value, tensorScale)));
  const block = rows.map((row, r) => row.map((value) => roundTrip(value, scales[r])));
  const tensorWeights = weights.map((value) => roundTrip(value, weightScale).reconstructed);
  const blockWeights = weights.map((value) => roundTrip(value, wScale).reconstructed);
  const dot = (a, b) => sum(a.map((value, i) => value * b[i]));
  return {
    rows,
    weights,
    tensorScale,
    scales,
    tensor,
    block,
    blockWeights,
    reference: rows.map((row) => dot(row, weights)),
    tensorOutput: tensor.map((row) =>
      dot(
        row.map((x) => x.reconstructed),
        tensorWeights,
      ),
    ),
    blockOutput: block.map((row) =>
      dot(
        row.map((x) => x.reconstructed),
        blockWeights,
      ),
    ),
  };
}
export const experiment = scaleExperiment();
export function projection(selector = false) {
  const w = selector
    ? Array.from(
        {
          length: 32,
        },
        (_, i) => Number(i === 3),
      )
    : weights;
  const encodedW = selector ? w : experiment.blockWeights;
  const originalTerms = rows[1].map((value, i) => value * w[i]);
  const reconstructedTerms = experiment.block[1].map(
    (value, i) => value.reconstructed * encodedW[i],
  );
  return {
    original: prefixes(originalTerms),
    reconstructed: prefixes(reconstructedTerms),
    weights: w,
    encodedWeights: encodedW,
    originalTerms,
    reconstructedTerms,
  };
}
export function blockContraction() {
  const blocks = [
    {
      x: [1, 1],
      w: [1, 1],
      sx: 1,
      sw: 5,
    },
    {
      x: [1, 2],
      w: [1, 1],
      sx: 2,
      sw: 4,
    },
  ];
  const partials = blocks.map((block) => sum(block.x.map((value, i) => value * block.w[i])));
  const products = blocks.map((block) => block.sx * block.sw);
  return {
    blocks,
    partials,
    products,
    contributions: partials.map((value, i) => value * products[i]),
    correct: sum(partials.map((value, i) => value * products[i])),
    wrong: products[0] * sum(partials),
  };
}
export function orientationWorksheet() {
  const matrix = Array.from(
    {
      length: 32,
    },
    () => Array(32).fill(1),
  );
  matrix[0][0] = 700;
  matrix[0][1] = 0.001;
  const rowScales = matrix.map(blockScale),
    columnScales = Array.from(
      {
        length: 32,
      },
      (_, j) => blockScale(matrix.map((row) => row[j])),
    );
  return {
    matrix,
    rowScales,
    columnScales,
    rowTiny: roundTrip(matrix[0][1], rowScales[0]),
    columnTiny: roundTrip(matrix[0][1], columnScales[1]),
  };
}
export function freshGroupWorksheet(separate = false) {
  const groups = [Array(32).fill(0), Array(32).fill(0)];
  const spikeRow = separate ? 1 : 0;
  groups[0][0] = 0.001;
  groups[spikeRow][3] = 700;
  const scales = groups.map(blockScale);
  return {
    values: groups[0],
    groups,
    scales,
    scale: scales[0],
    tiny: roundTrip(groups[0][0], scales[0]),
    spike: roundTrip(groups[spikeRow][3], scales[spikeRow]),
    zeroScale: blockScale(Array(32).fill(0)),
  };
}
