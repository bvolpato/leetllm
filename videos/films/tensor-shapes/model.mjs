import {
  attentionMatrixOrder,
  attentionScores,
  bias,
  broadcastOrder,
  featureMean,
  firstSnippetWords,
  reshapeBatch0,
  sequence0,
  sequence1,
  shape,
  shifted,
  tensor,
  tokenMean,
  transposeBatch0,
} from './fixtures.mjs';
import { bounded, complete, count, event } from './construction.mjs';
export function attentionPairConstruction(beat, progress) {
  const queryIndex = 1,
    query = [...sequence0[queryIndex]],
    p = Math.max(0, Math.min(1, progress));
  const keys = sequence0.map((vector, keyIndex) => {
    const products = vector.map((keyValue, featureIndex) => ({
      featureIndex,
      queryValue: query[featureIndex],
      keyValue,
      product: query[featureIndex] * keyValue,
    }));
    return {
      keyIndex,
      token: firstSnippetWords[keyIndex],
      vector: [...vector],
      products,
      score: products.reduce((sum, item) => sum + item.product, 0),
    };
  });
  const completedFeatures = beat < 1 ? 0 : beat === 1 ? Math.min(4, Math.floor((p / 0.88) * 4)) : 4;
  const completedMatrixCells =
    beat < 2
      ? 0
      : p <= 0.38
        ? Math.floor((p / 0.38) * 3)
        : Math.min(9, 3 + Math.floor(((p - 0.38) / 0.54) * 6));
  const matrixCells = attentionMatrixOrder.slice(0, completedMatrixCells).map(([row, column]) => ({
    row,
    column,
    value: attentionScores[0][row][column],
  }));
  return {
    queryIndex,
    queryToken: firstSnippetWords[queryIndex],
    query,
    keys,
    completedFeatures,
    partialSums: keys.map((key) =>
      key.products.slice(0, completedFeatures).reduce((sum, item) => sum + item.product, 0),
    ),
    completedMatrixCells,
    matrixCells,
    matrix: attentionScores[0],
  };
}
export function attentionSlicePrediction() {
  const row = [...attentionScores[0][1]];
  return {
    expression: 'scores[0, 1:2, :]',
    queryToken: firstSnippetWords[1],
    keyToken: firstSnippetWords[2],
    score: row[2],
    row,
    shape: [1, row.length],
  };
}
export function layoutConstruction(beat, progress) {
  const order = beat === 1 ? transposeBatch0.flat() : tensor.slice(0, 12);
  const position = Math.max(0, Math.min(1, (progress - 0.04) / 0.76)) * 12;
  const completed = beat === 2 ? 12 : Math.min(12, Math.floor(position));
  return {
    order,
    completed,
    active: completed < 12 ? order[completed] : null,
    fraction: position - completed,
  };
}
export function indexSelection(beat, progress) {
  const seconds = bounded(progress) * [12.646, 14.448, 13.302][beat],
    batchChosen = beat > 0 || seconds >= 2.875,
    tokenChosen = beat > 0 || seconds >= 4.9,
    colon = beat > 0 || seconds >= 7.0625;
  const position = beat > 0 ? 4 : colon ? bounded((seconds - 7.475) / 2.6) * 4 : 0,
    completed = Math.min(4, Math.floor(position));
  return {
    seconds,
    batchChosen,
    tokenChosen,
    colon,
    position,
    completed,
    active: completed < 4 ? completed : null,
    fraction: position - completed,
    selected: sequence1[1],
  };
}
export function reductionConstruction(beat, progress) {
  const seconds = bounded(progress) * [14.23, 15.336, 13.566][beat],
    axis = beat === 1 ? 2 : 1,
    keepdims = beat === 2;
  const inputCount = axis === 1 ? 3 : 4,
    termCount = keepdims
      ? inputCount
      : Math.min(
          inputCount,
          Math.floor((seconds - (axis === 1 ? 0.9 : 0.6125)) / (axis === 1 ? 0.75 : 0.45)) + 1,
        );
  const count = Math.max(0, termCount),
    firstReady = keepdims || seconds >= (axis === 1 ? 4.3 : 3.1),
    resultCount = keepdims
      ? 4
      : axis === 1
        ? [4.3, 11.25, 12.1, 12.925].filter((t) => seconds >= t).length
        : [3.1, 7.775, 9.0875].filter((t) => seconds >= t).length;
  const values = axis === 1 ? tokenMean : featureMean;
  return {
    seconds,
    axis,
    keepdims,
    count,
    firstReady,
    resultCount,
    values,
    broadcast: keepdims && seconds >= 8.4375,
    inputs: [sequence0, sequence1].map((rows) =>
      axis === 1 ? rows.map((row) => row[0]) : rows[0],
    ),
    sum: [sequence0, sequence1].map((rows) =>
      (axis === 1 ? rows.map((row) => row[0]) : rows[0]).slice(0, count).reduce((a, x) => a + x, 0),
    ),
  };
}
export function teachingSnapshot(id, beat, progress) {
  const q = Math.max(0, Math.min(1, (progress - 0.12) / 0.56));
  if (id === 'intro') {
    const elapsed = Math.max(0, Math.min(1, progress)) * 15.934;
    return {
      wordCount:
        beat > 0
          ? 6
          : [2, 2.3125, 2.825, 3.725, 4.2125, 4.6].filter((t) => elapsed + 1e-9 >= t).length,
      featureCount:
        beat > 0 ? 4 : [6.6125, 7.4125, 7.75, 8.075].filter((t) => elapsed + 1e-9 >= t).length,
    };
  }
  if (id === 'shape') {
    const elapsed = Math.max(0, Math.min(1, progress)) * 16.246;
    return {
      axisCount: beat > 0 ? 3 : [0.2875, 4.1875, 6.3].filter((t) => elapsed + 1e-9 >= t).length,
    };
  }
  if (id === 'index')
    return {
      selected: sequence1[1],
      row: 1,
      token: 'enjoy',
      batch: 1,
    };
  if (id === 'broadcast') {
    const order = [4, 5, 6, 7, 0, 1, 2, 3, 8, 9, 10, 11];
    const completed = beat === 0 ? 0 : beat === 1 ? Math.min(12, Math.floor(q * 13)) : 12;
    const active = order[Math.min(11, completed)];
    return {
      completed,
      active,
      completedIndices: order.slice(0, completed),
      result: sequence0.map((row) => row.map((value, column) => value + bias[column])),
    };
  }
  if (id === 'reduce')
    return {
      axis: beat === 1 ? 2 : 1,
      values: beat === 1 ? featureMean : tokenMean,
      keepdims: beat === 2,
    };
  return {
    reshaped: reshapeBatch0,
    transposed: transposeBatch0,
  };
}
export function boundaryCheck(dimensions, dtype) {
  return {
    shape: dimensions.length === 3 && dimensions.every((v, i) => v === shape[i]),
    dtype: dtype === 'float32',
  };
}
export function indexFrame(state) {
  const beat = state.beat ?? 0;
  return {
    batch: event(state, 0, 'choose-index-batch') > 0,
    token: event(state, 0, 'choose-index-token') > 0,
    features: count(4, event(state, 0, 'retain-index-features')),
    slice: event(state, 1, 'keep-singleton-token'),
    both: event(state, 2, 'keep-both-sentences'),
    vector: [...sequence1[1]],
    sliceValues: [[...sequence1[1]]],
    bothValues: [[...sequence0[1]], [...sequence1[1]]],
    vectorShape: [4],
    sliceShape: [1, 4],
    bothShape: [2, 4],
    beat,
  };
}
export function broadcastFrame(state) {
  const progress = event(state, 0, 'add-feature-offsets'),
    processed = count(24, progress);
  return {
    progress,
    processed,
    placed: broadcastOrder.slice(0, processed),
    active: processed < 24 ? broadcastOrder[processed] : null,
    fraction: 24 * progress - processed,
    shifted: [0, 1].map((b) =>
      shifted.slice(b * 12, b * 12 + 12).reduce((rows, value, i) => {
        if (i % 4 === 0) rows.push([]);
        rows.at(-1).push(value);
        return rows;
      }, []),
    ),
    repair: event(state, 1, 'insert-feature-singleton'),
    reject: event(state, 1, 'reject-token-vector'),
    square: event(state, 3, 'resolve-square-broadcast'),
  };
}
export function reductionFrame(state) {
  const beat = state.beat ?? 0,
    axis = beat === 1 ? 2 : 1,
    progress = event(
      state,
      beat,
      beat === 0 ? 'pool-token-column' : beat === 1 ? 'pool-feature-row' : 'subtract-kept-mean',
    ),
    terms = axis === 1 ? 3 : 4,
    position = progress * 12,
    processed = count(12, progress);
  const selected = Math.max(0, Math.ceil(processed / terms) - 1),
    selectedTermCount = processed - selected * terms;
  return {
    axis,
    progress,
    processed,
    terms,
    selected,
    selectedTermCount,
    active: processed < 12 ? Math.floor(processed / terms) : null,
    completed: Math.floor(processed / terms),
    termCount: processed % terms,
    means: axis === 1 ? tokenMean : featureMean,
    keep: event(state, 2, 'retain-mean-token-slot'),
    centered: [sequence0, sequence1].map((rows, b) =>
      rows.map((row) => row.map((value, d) => value - tokenMean[b][d])),
    ),
    complete: complete(progress),
  };
}
export function layoutFrame(state) {
  const beat = state.beat ?? 0,
    order = beat === 1 ? transposeBatch0.flat() : reshapeBatch0.flat(),
    position = beat === 0
      ? 3 * event(state, 0, 'fill-first-row') +
        event(state, 0, 'start-mixed-row') +
        2 * event(state, 0, 'cross-word-boundary') +
        6 * event(state, 0, 'reshape-flat-stream')
      : order.length * event(state, beat, beat === 1 ? 'transpose-axis-swap' : 'compare-layout-owners'),
    progress = position / order.length,
    processed = count(order.length, progress);
  return {
    progress,
    order,
    processed,
    active: processed < order.length ? order[processed] : null,
    fraction: position - processed,
    reshape: reshapeBatch0,
    transpose: transposeBatch0,
    sourceStrides: [48, 16, 4],
    reshapeStrides: [48, 12, 4],
    transposeStrides: [48, 4, 16],
  };
}
export function memoryFrame(state) {
  const beat = state.beat ?? 0,
    edit = event(state, 0, 'edit-shared-value'),
    copied = event(state, 1, 'edit-independent-copy'),
    flatten = event(state, 2, 'flatten-transposed-view'),
    source = [...tensor];
  if (beat < 2 && complete(edit)) source[4] = 99;
  const independent = [...source];
  if (beat === 1 && complete(copied)) independent[0] = -1;
  return {
    edit,
    copied,
    flatten,
    source,
    independent,
    basicView: [source.slice(4, 8), source.slice(16, 20)],
    basicSliceSharesMemory: true,
    retrievedAdvancedIndexSharesMemory: false,
    transposeSharesMemory: true,
    flattenedTransposeSharesMemory: false,
    flattened: [
      transposeBatch0.flat(),
      Array.from(
        {
          length: 4,
        },
        (_, d) => sequence1.map((row) => row[d]),
      ).flat(),
    ],
  };
}

export function indexedWriteFrame(state) {
  const copyWrite = event(state, 3, 'edit-independent-copy');
  const rewind = event(state, 4, 'rewind-indexed-write');
  const sourceWrite = event(state, 5, 'write-indexed-source');
  const source = [...sequence0[0]];
  const picked = [...source];
  if (complete(copyWrite) && !complete(rewind)) picked[0] = -1;
  if (complete(sourceWrite)) source[0] = -1;
  return {
    source,
    picked,
    copyWrite,
    rewind,
    sourceWrite,
    addressSource: complete(event(state, 4, 'address-source')),
  };
}

export function headFrame(state, input = [sequence0, sequence1]) {
  const split = event(state, 1, 'expose-feature-pairs'),
    move = event(state, 1, 'move-head-axis'),
    reveal = event(state, 2, 'reveal-head-mismatch'),
    resolve = event(state, 2, 'resolve-head-construction'),
    correct = input.map((rows) =>
      [0, 1].map((h) => rows.map((row) => row.slice(h * 2, h * 2 + 2))),
    ),
    direct = input.map((rows) => {
      const flat = rows.flat();
      return [0, 1].map((h) =>
        rows.map((_, t) => {
          const start = 2 * (h * rows.length + t);
          return flat.slice(start, start + 2);
        }),
      );
    });
  return {
    split,
    move,
    reveal,
    resolve,
    correct,
    direct,
    correctPair: correct[0][0][1],
    directPair: direct[0][0][1],
    shape: [2, 2, 3, 2],
    choiceShown: complete(resolve),
  };
}
export function precisionFrame() {
  const inputs = [2 ** 24, 1, -(2 ** 24)],
    narrowFirst = Math.fround(inputs[0] + inputs[1]),
    wideFirst = inputs[0] + inputs[1],
    narrowSum = Math.fround(narrowFirst + inputs[2]),
    wideSum = wideFirst + inputs[2];
  return {
    inputs,
    narrowFirst,
    wideFirst,
    narrowSum,
    wideSum,
    narrowMean: Math.fround(narrowSum / inputs.length),
    wideMean: wideSum / inputs.length,
  };
}
