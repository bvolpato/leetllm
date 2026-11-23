import { AXIS_TRAP, FRESH_H, H, P, R, REQUEST_W, REQUEST_X, WORDS } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { multiplyMatrices, dotProduct, lerpArray, weightedVectorState } from 'vizmatic';
export const COMPOSED = multiplyMatrices(P, R);
export const BASE_OUTPUT = H.map((message) => multiplyMatrices(message, P));
export const unit = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => {
  const p = unit(value);
  return p * p * (3 - 2 * p);
};
export const scale = (row, amount) => row.map((value) => value * amount);
export const add = (a, b) => a.map((value, i) => value + b[i]);
export const zero = (count) => Array(count).fill(0);
export const done = (value) => value >= 1;
export const same = (a, b) => a.every((value, i) => Math.abs(value - b[i]) < 1e-12);
export const sumRows = (rows) => rows.reduce(add, zero(rows[0].length));
export function event(state, id, beat, from = 0.18, to = 0.72) {
  const current = state.beat ?? 0;
  if (current < beat) return 0;
  if (current > beat) return 1;
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : unit(cue.progress);
  return smooth(((state.beatP ?? 0) - from) / (to - from));
}
export const transform = (vector) => multiplyMatrices([vector], P)[0];
export const transformBatch = (hidden) => hidden.map((message) => multiplyMatrices(message, P));
export function coordinateFrame(state) {
  const first = event(state, 'first-coordinate', 0),
    second = event(state, 'second-coordinate', 1);
  const swapped = event(state, 'swap-coordinates', 2);
  return {
    first,
    second,
    point: [0.5 * first, 0.5 * second],
    swapped,
    swapPoint: lerpArray([1, 0], [0, 1], swapped),
  };
}
export function directionFrame(state) {
  const first = event(state, 'first-direction', 1),
    second = event(state, 'second-direction', 2);
  return {
    first,
    second,
    rows: [scale(P[0], first), scale(P[1], second)],
  };
}
export function mixtureFrame(state) {
  const first = 1 - 0.5 * event(state, 'scale-first', 0);
  const second = 1 - 0.5 * event(state, 'scale-second', 1);
  const join = event(state, 'join-vectors', 2);
  const rows = [scale(P[0], first), scale(P[1], second)];
  return {
    first,
    second,
    join,
    rows,
    secondOrigin: scale(rows[0], join),
    secondTip: add(scale(rows[0], join), rows[1]),
    result: done(join) ? sumRows(rows) : null,
  };
}
export function dotFrame(state) {
  const first = event(state, 'dot-first', 0),
    second = event(state, 'dot-second', 1);
  const products = H[0][2].map((value, i) => value * P[i][2]);
  return {
    first,
    second,
    products,
    accumulated: products[0] * first + products[1] * second,
    complete: done(first) && done(second),
    output: transform(H[0][2]),
  };
}
export function compositionFrame(state) {
  const amounts = ['downstream-first', 'downstream-second', 'downstream-third'].map((id, i) =>
    event(state, id, 0, 0.12 + i * 0.23, 0.3 + i * 0.23),
  );
  const intermediate = transform(H[0][2]),
    pieces = R.map((row, i) => scale(row, intermediate[i] * amounts[i]));
  const count = Math.floor(4 * event(state, 'compose-matrices', 1) + 1e-9);
  const directAmounts = [
    event(state, 'direct-first', 2, 0.18, 0.5),
    event(state, 'direct-second', 2, 0.53, 0.82),
  ];
  const directPieces = COMPOSED.map((row, i) => scale(row, H[0][2][i] * directAmounts[i]));
  return {
    amounts,
    intermediate,
    pieces,
    sum: sumRows(pieces),
    count,
    directAmounts,
    directPieces,
    directSum: sumRows(directPieces),
    result: multiplyMatrices([intermediate], R)[0],
    directComplete: directAmounts.every(done),
  };
}
export function rowsFrame(state) {
  const progress = WORDS[0].map((word, i) =>
    event(state, 'row-' + word, 1, 0.08 + i * 0.25, 0.28 + i * 0.25),
  );
  return {
    progress,
    output: BASE_OUTPUT[0],
    completed: progress.filter(done).length,
    active: Math.max(
      0,
      progress.findLastIndex((value) => value > 0),
    ),
  };
}
export function tensorFrame(state) {
  const batch = event(state, 'project-batch', 2);
  return {
    batch,
    completed: Math.floor(6 * batch + 1e-9),
    output: BASE_OUTPUT,
    message: event(state, 'select-message', 1, 0.15, 0.32),
    word: event(state, 'select-word', 1, 0.34, 0.51),
    feature: event(state, 'select-feature', 1, 0.53, 0.72),
    slice: event(state, 'tensor-slice-columns', 1, 0.76, 0.94),
  };
}
export function localEditFrame(state) {
  const amount = event(state, 'change-password', 1);
  const hidden = H.map((message) => message.map((row) => [...row]));
  hidden[0][2][0] += amount;
  const output = transformBatch(hidden),
    changed = [];
  output.forEach((message, b) =>
    message.forEach((row, t) => {
      if (!same(row, BASE_OUTPUT[b][t])) changed.push([b, t]);
    }),
  );
  return {
    amount,
    hidden,
    output,
    changed,
    input: hidden[0][2],
    selected: output[0][2],
    delta: output[0][2].map((value, j) => value - BASE_OUTPUT[0][2][j]),
  };
}
export function validateModel() {
  assert.deepEqual(COMPOSED, [
    [1.5, 0.5],
    [0.5, 1.5],
  ]);
  assert.deepEqual(transform(H[0][2]), [0.5, 0.5, 0.5]);
  assert.equal(
    dotProduct(
      H[0][2],
      P.map((row) => row[2]),
    ),
    0.5,
  );
  assert.deepEqual(multiplyMatrices([transform(H[0][2])], R)[0], [1, 1]);
  for (const vector of [
    [0, 0],
    [1, 0],
    [0, 1],
    [0.5, 0.5],
    [1.5, 0.5],
    [-0.25, 0.75],
  ]) {
    assert(
      same(multiplyMatrices([transform(vector)], R)[0], multiplyMatrices([vector], COMPOSED)[0]),
    );
  }
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const edit = localEditFrame({
      beat: 1,
      beatP: 0.5,
      cues: {
        'change-password': {
          phase: p === 1 ? 'after' : 'during',
          progress: p,
        },
      },
    });
    assert.deepEqual(edit.changed, p === 0 ? [] : [[0, 2]]);
    assert(same(edit.delta, scale(P[0], p)));
    assert.equal(edit.selected[1], 0.5);
  }
  assert.deepEqual(
    mixtureFrame({
      beat: 2,
      beatP: 1,
    }).result,
    [0.5, 0.5, 0.5],
  );
  assert.equal(
    dotFrame({
      beat: 1,
      beatP: 1,
    }).accumulated,
    0.5,
  );
  validateExtendedModel();
  return true;
}
export const REQUEST_Y = multiplyMatrices(REQUEST_X, REQUEST_W);
export const SCORE_H = H[0].map((row) => [...row]);
export const EXTENDED_SCENES = new Set([
  'latency-gradient',
  'latency-dot',
  'request-batch',
  'many-outputs',
  'shape-guard',
  'broadcasting',
  'pairwise-scores',
  'normalized-scores',
  'batched-transpose',
  'pooling',
  'padding-mask',
  'input-guards',
  'linear-api',
  'fresh-case',
]);
export const transpose = (values) => values[0].map((_, j) => values.map((row) => row[j]));
export const gram = (values) => multiplyMatrices(values, transpose(values));
export const mean = (values) => scale(sumRows(values), 1 / values.length);
export const cueDone = (state, id, beat) => done(event(state, id, beat));
export const scoreTerms = (rows, i, j) => rows[i].map((v, d) => v * rows[j][d]);
export function batchedScoreState(values) {
  const shape = [values.length, values[0].length, values[0][0].length];
  const correct = values.map(gram);
  const reversed = Array.from(
    {
      length: shape[2],
    },
    (_, d) =>
      Array.from(
        {
          length: shape[1],
        },
        (_, t) => values.map((row) => row[t][d]),
      ),
  );
  return {
    shape,
    correct,
    reversed,
    wrong: values.map((matrix, b) => multiplyMatrices(matrix, reversed[b])),
  };
}
export function extendedFrame(id, state) {
  const beat = state.beat ?? 0;
  if (id === 'latency-gradient') {
    const learning = event(state, 'gradient-scale', 1),
      update = event(state, 'gradient-update', 1);
    return {
      learning,
      update,
      gradient: [4, 2],
      change: [0.4 * learning, 0.2 * learning],
      weights: [2 - 0.4 * update, 2 - 0.2 * update],
      settled: cueDone(state, 'gradient-result', 1),
    };
  }
  if (id === 'latency-dot') {
    const restore = event(state, 'latency-restore', 2),
      returned = unit(restore / 0.65);
    const recompute = unit((restore - 0.65) / 0.35),
      restoring = restore > 0 && restore < 1;
    const wrong = cueDone(state, 'latency-swapped', 2),
      swapped = wrong && returned < 1;
    const input = swapped ? [1, 2] : [2, 1];
    const parts =
      wrong && restore > 0
        ? lerpArray([2, 2], [4, 1], recompute)
        : input.map((v, i) => v * [2, 1][i]);
    const progress =
      beat < 2 ? [event(state, 'latency-prompt', 1), event(state, 'latency-queue', 1)] : [1, 1];
    return {
      input,
      parts,
      progress,
      accumulated: parts.reduce((n, v, i) => n + v * progress[i], 0),
      swapped,
      restore,
      restoring,
      returned,
      position: event(state, 'latency-swap', 2) * (1 - returned),
      swap: event(state, 'latency-swap', 2),
      reveal: beat < 2 ? cueDone(state, 'latency-sum', 1) : wrong && !restoring,
    };
  }
  if (id === 'request-batch')
    return {
      values: REQUEST_X.map((row) => dotProduct(row, [2, 1])),
      visible: ['request-a', 'request-b', 'request-c'].map((id) => cueDone(state, id, 1)),
      column: event(state, 'request-column', 2),
    };
  if (id === 'many-outputs')
    return {
      values: REQUEST_Y,
      time: cueDone(state, 'request-b-time', 1),
      priority: cueDone(state, 'request-b-priority', 1),
      first: event(state, 'priority-first', 1),
      second: event(state, 'priority-second', 1),
      all: event(state, 'request-all-outputs', 2),
    };
  if (id === 'shape-guard')
    return {
      repaired: cueDone(state, 'shape-repair', 1),
      rank: event(state, 'shape-rank', 2),
      arrayRank: 2,
      matrixRank: 1,
    };
  if (id === 'broadcasting') {
    const feature = event(state, 'feature-bias', 0),
      row = event(state, 'row-bias', 1);
    return {
      feature,
      row,
      correct: REQUEST_Y.map((v) => [v[0] + 0.1 * feature, v[1] - 0.1 * feature]),
      wrong: REQUEST_Y.map((v, i) => v.map((x) => x + [0.1, -0.1, 0][i] * row)),
      settled: cueDone(state, 'broadcast-diagnosis', 2),
    };
  }
  if (id === 'pairwise-scores')
    return {
      values: gram(SCORE_H),
      transpose: event(state, 'score-transpose', 0),
      cells: Math.floor(9 * event(state, 'score-grid', 1) + 1e-9),
      terms: scoreTerms(SCORE_H, 2, 2),
      diagonal: cueDone(state, 'score-diagonal', 2),
    };
  if (id === 'normalized-scores') {
    const change = event(state, 'length-double', 0),
      vector = [0.5 + 0.5 * change, 0.5 + 0.5 * change],
      norm = Math.hypot(...vector);
    return {
      change,
      vector,
      norm,
      dot: vector[0],
      cosine: vector[0] / norm,
      normalize: event(state, 'unit-normalize', 1),
      unit: vector.map((x) => x / norm),
      zero: cueDone(state, 'zero-direction', 2),
    };
  }
  if (id === 'batched-transpose') {
    const scores = batchedScoreState(AXIS_TRAP),
      repaired = cueDone(state, 'batch-repair', 2),
      showingWrong = beat > 0 && !repaired;
    return {
      ...scores,
      wrongRevealed: cueDone(state, 'batch-reverse', 1),
      checked: cueDone(state, 'batch-diagonal', 2),
      repaired,
      showingWrong,
      selected: showingWrong ? scores.wrong : scores.correct,
    };
  }
  if (id === 'pooling') {
    const progress = ['pool-reset', 'pool-my', 'pool-password'].map((id) => event(state, id, 1));
    const divide = smooth((event(state, 'pool-result', 1) - 0.22) / 0.78);
    const terms = BASE_OUTPUT[0].map((values, i) => ({
      id: 'pooled-' + i,
      label: 'T' + i,
      weight: 1 - (2 * divide) / 3,
      values,
    }));
    const accumulation = weightedVectorState({
      terms,
      progress: progress.reduce((n, p) => n + p, 0) / 3,
    });
    return {
      terms,
      divide,
      progress: accumulation.progress,
      accumulation,
      reveal: cueDone(state, 'pool-result', 1),
      raw: cueDone(state, 'pool-sum', 1),
      permute: event(state, 'pool-permute', 2),
      result: mean(BASE_OUTPUT[0]),
    };
  }
  if (id === 'padding-mask') {
    const padded = event(state, 'padding-add', 0);
    return {
      padded,
      masked: cueDone(state, 'padding-select', 1),
      failure: cueDone(state, 'padding-empty', 2),
      plain: padded === 1 ? [0.25, 0.25] : [0.5, 0.5],
      correct: [0.5, 0.5],
      valid: beat === 2 ? [false, false, false, false] : [true, true, false, false],
    };
  }
  if (id === 'input-guards')
    return {
      convert: event(state, 'guard-convert', 0),
      ranks: event(state, 'guard-rank', 0),
      checked: event(state, 'guard-feature', 1),
      nonempty: event(state, 'guard-nonempty', 1),
      run: cueDone(state, 'guard-product', 1),
      locality: event(state, 'guard-locality', 2),
    };
  if (id === 'linear-api')
    return {
      stored: transpose(P),
      transposed: event(state, 'linear-store', 0),
      biased: event(state, 'linear-bias', 1),
      values: BASE_OUTPUT[0].map((row) =>
        row.map((v, i) => v + [0.1, -0.2, 0.3][i] * event(state, 'linear-bias', 1)),
      ),
    };
  if (id === 'fresh-case') {
    const reveal = cueDone(state, 'fresh-token-answer', 1),
      hidden = FRESH_H.map((row) => [...row]);
    const inputProgress = event(state, 'fresh-input-change', 0),
      divide = smooth((event(state, 'fresh-summary-answer', 2) - 0.22) / 0.78);
    hidden[2][0] += inputProgress;
    const output = multiplyMatrices(hidden, P),
      valid = output.slice(0, 3),
      terms = valid.map((values, i) => ({
        id: 'fresh-term-' + i,
        label: 'T' + i,
        weight: 1 - (2 * divide) / 3,
        values,
      }));
    return {
      reveal,
      inputProgress,
      divide,
      hidden,
      output,
      terms,
      sum: sumRows(valid),
      summary: mean(valid),
      plain: mean(output),
      progress: event(state, 'fresh-summary', 2),
      result: cueDone(state, 'fresh-summary-answer', 2),
      wrong: cueDone(state, 'fresh-padding-answer', 2),
    };
  }
  throw Error('Unknown extended vector scene ' + id);
}
export function validateExtendedModel() {
  assert.deepEqual(REQUEST_Y, [
    [2, 0.2],
    [5, 1.9],
    [7, 2.1],
  ]);
  assert.deepEqual(gram(SCORE_H), [
    [1, 0, 0.5],
    [0, 1, 0.5],
    [0.5, 0.5, 0.5],
  ]);
  const axes = batchedScoreState(AXIS_TRAP);
  assert.deepEqual(
    axes.correct[0].map((row, i) => row[i]),
    [1, 0.5],
  );
  assert.deepEqual(
    axes.wrong[0].map((row, i) => row[i]),
    [1, 0.25],
  );
  const final = extendedFrame('fresh-case', {
    beat: 3,
  });
  assert.deepEqual(final.output, [
    [1, 0, 0.5],
    [0, 1, 0.5],
    [2, 1, 1.5],
    [0, 0, 0],
  ]);
  assert(same(final.summary, [1, 2 / 3, 5 / 6]));
  assert.deepEqual(final.plain, [0.75, 0.5, 0.625]);
  assert.deepEqual(
    extendedFrame('fresh-case', {
      beat: 0,
    }).output[2],
    [1, 1, 1],
  );
  for (const p of [0, 0.001, 0.25, 0.75, 1]) {
    const s = {
      beat: 0,
      cues: {
        'length-double': {
          phase: 'during',
          progress: p,
        },
      },
    };
    const f = extendedFrame('normalized-scores', s);
    assert(Math.abs(f.cosine - 1 / Math.sqrt(2)) < 1e-12);
  }
}
