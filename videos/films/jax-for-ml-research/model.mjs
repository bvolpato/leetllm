import {
  capturedCalls,
  doublingTraces,
  exampleGradients,
  momentumFixture,
  motion,
  paddedReduction,
  projectionFixture,
  regularizedHistory,
  weightPenalty,
} from './arithmetic.mjs';
import { history, rows } from './fixtures.mjs';
import { batchComparison } from './batch.mjs';
import assert from 'node:assert/strict';
export function sampleModel(id, state) {
  const b = Math.min(1, state.beat),
    q = motion(state.beatP),
    step = b ? 1 + Math.floor(q * 79) : 0,
    validRows = b ? 2 : 4,
    padded = b && state.beatP >= 0.5,
    paddedRows = padded ? 2 : 0,
    lossTerms = rows.slice(0, validRows).map((r) => r.y * r.y),
    squaredSum = lossTerms.reduce((a, v) => a + v, 0),
    valuesVisible = id === 'values' && (b > 0 || q >= 0.25),
    middleUpdated = id === 'values' && (b > 0 || q >= 0.72);
  return {
    b,
    q,
    step,
    rows,
    initial: history[0],
    first: history[1],
    current: history[step],
    history: history.slice(0, step + 1),
    time: b ? 6 + q * 6 : q * 6,
    validRows,
    paddedRows,
    padded,
    lossTerms,
    squaredSum,
    validLoss: squaredSum / validRows,
    naiveLoss: squaredSum / (validRows + paddedRows),
    valuesVisible,
    middleUpdated,
  };
}
export function validateModel() {
  validateJaxConstruction();
  assert.equal(history[0].loss, 3.75);
  assert.deepEqual(history[0].gradient, [-4.5, -1.5, -2.5]);
  assert.deepEqual(history[1].p, [0.225, 0.07500000000000001, 0.125]);
  assert(history[80].loss < 0.008);
  assert.equal(rows.reduce((a, r) => a + -2 * r.y * r.x[0], 0) / 4, -4.5);
  for (const beat of [0, 1])
    for (const beatP of [0.02, 0.25, 0.5, 0.75, 0.98]) {
      const s = sampleModel('jit', {
        beat,
        beatP,
      });
      assert.equal(s.validRows, beat ? 2 : 4);
      assert.equal(s.validRows + s.paddedRows, s.padded ? 4 : s.validRows);
      assert.equal(s.validLoss, beat ? 2.5 : 3.75);
      assert.equal(s.naiveLoss, s.padded ? 1.25 : s.validLoss);
      assert.deepEqual(s.lossTerms, beat ? [4, 1] : [4, 1, 1, 9]);
    }
  const start = sampleModel('values', {
      beat: 0,
      beatP: 0.02,
    }),
    middle = sampleModel('values', {
      beat: 0,
      beatP: 0.5,
    }),
    finish = sampleModel('values', {
      beat: 0,
      beatP: 0.98,
    }),
    held = sampleModel('values', {
      beat: 1,
      beatP: 0.02,
    });
  assert.equal(start.valuesVisible, false);
  assert.equal(middle.valuesVisible, true);
  assert.equal(middle.middleUpdated, false);
  assert.equal(finish.middleUpdated, true);
  assert.equal(held.valuesVisible, true);
  assert.equal(held.middleUpdated, true);
  return true;
}
export function validateJaxConstruction() {
  const short = batchComparison(2, 4);
  assert.equal(short.loss.naive, 1.25);
  assert.equal(short.loss.masked, 2.5);
  const padded = batchComparison(4, 6);
  assert.equal(padded.naiveGradient[0], -3);
  assert.deepEqual(padded.validGradient, history[0].gradient);
  const transfer = batchComparison(3, 4, 1);
  assert.deepEqual(
    transfer.batch.map((r) => r.squared),
    [1, 4, 0, 1],
  );
  assert.equal(transfer.loss.naive, 1.5);
  assert.equal(transfer.loss.masked, 5 / 3);
  assert.deepEqual(transfer.validGradient, [-2 / 3, 4 / 3, 2 / 3]);
  assert.deepEqual(exampleGradients(), [
    [-4, -0, -4],
    [0, 2, 2],
    [-2, -2, -2],
    [-12, -6, -6],
  ]);
  assert.deepEqual(momentumFixture().gradient, [-2, 0, -2.5]);
  assert.deepEqual(momentumFixture().nextParams, [0.1, 0, 0.125]);
  assert.equal(momentumFixture().preLoss, 3.75);
  assert.deepEqual(
    capturedCalls([
      {
        length: 4,
        global: 1,
      },
      {
        length: 4,
        global: 3,
      },
      {
        length: 2,
        global: 3,
      },
    ]).results.map((x) => x.result),
    [4, 4, 6],
  );
  assert.deepEqual(
    capturedCalls([
      {
        length: 3,
        global: 2,
      },
      {
        length: 3,
        global: 4,
      },
      {
        length: 5,
        global: 4,
      },
    ]).results.map((x) => x.result),
    [6, 6, 20],
  );
  assert.equal(paddedReduction([4, 1, 1, 9, 0, 0], [1, 1, 1, 1, 0, 0]).masked, 3.75);
  assert.deepEqual(doublingTraces(3), {
    dynamic: [3, 6, 12],
    fixed: [3, 6, 12, 24],
    derivative: 8,
  });
  assert.deepEqual(weightPenalty([2, -1]), {
    value: 0.5,
    gradient: [0.4, -0.2],
    biasGradient: 0,
  });
  assert.equal(regularizedHistory().at(-1).objective.toFixed(6), '0.399595');
  assert.deepEqual(projectionFixture().output, [7, 10]);
  assert.deepEqual(projectionFixture().transposed, [5, 11]);
  return true;
}
