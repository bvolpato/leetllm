import assert from 'node:assert/strict';
import { A, B, V, common, contrast, severity } from '../../../films/linear-algebra/fixtures.mjs';
import {
  gramCalculation,
  leastSquaresFit,
  solverRoundingExample,
  sparseFrame,
  retrievalFrame,
} from '../../../films/linear-algebra/model.mjs';
import { dot, times, plus, num } from './studio.mjs';
import { early, projection, stretched, contribution, directionScores, orderByScore, batchCosines } from './tickets.mjs';
import { middle, centered, centeredScores, comparisonRows, spread, samples, leftovers } from './fitting.mjs';
import { ending, spectrum, energy, retainedState, factorCount, rankOne, code, contrastRoute } from './dispatch.mjs';

const scenes = [...early, ...middle, ...ending];

const captionStarts = {
  'c03-b01': ['so we can compare a step', 'whose combinations reach'],
  'c04-b01': ['so the common ruler'],
  'c05-b01': ['The slow-only ticket', 'The rollback-only ticket'],
  'c06-b01': ['Write two', 'Write one'],
  'c06-b02': ['Write one'],
  'c07-b02': ['equals the squared length'],
  'c09-b01': ['Now stretch', 'square root of three'],
  'c10-b01': ['by its singular strength'],
  'c12-b01': ['and shrink contrast to zero'],
  'c13-b04': ['takes a square grid'],
  'c15-b01': ['Now turn'],
  'c15-b03': ['with weights that sum to one', 'as its first principal direction'],
  'c16-b04': ['then take a dot product', 'place the first sixty-four', 'and multiply'],
  'c17-b01': ['and those empty cells fill', "can subtract the mean's contribution",
    'and measures energy around zero'],
  'c18-b04': ['but hurts the joint ticket'],
  'c19-b01': ['Make the second feature', 'and then the second'],
  'c20-b01': ['the sum of the two weights'],
  'c21-b04': ['so its height'],
  'c22-b01': ['and shrink the other', 'gives its two-norm condition number'],
  'c23-b01': ['into a tenth of input error'],
  'c24-b02': ['The other route', 'take the dot product', 'with the observed readings'],
  'c24-b03': ['and subtract it from the second'],
  'c24-b04': ['grows from eight ten-thousandths', 'to twelve ten-thousandths',
    'shrinks from point zero zero one six two', 'to point zero zero one three eight'],
  'c24-b05': ['even while their predictions'],
  'c25-b02': ['about seventy-eight percent', 'about ninety-eight percent'],
  'c25-b04': ['check the projected tickets and queries'],
  'c26-b01': ['learns the two thin factors'],
  'c26-b02': ['limits how many independent output directions'],
  'c26-b03': ['for each of those four thousand ninety-six positions', 'gives sixty-five thousand'],
  'c26-b05': ['and the other tracks its squared gradient'],
  'c27-b04': ['to recover the totals zero and eight'],
  'c28-b05': ['name two cases that need different actions'],
  'c28-b01': ['Restore contrast', 'Save that score'],
};
const visualOnly = {
  'c05-b01': ['scores below zero', 'just as far above zero'],
  'c06-b01': ['at the upper left', 'at the upper right'],
  'c06-b02': ['at the lower left'],
  'c09-b01': ['stretch the common coordinate'],
  'c12-b01': ['shrink contrast to zero'],
  'c15-b01': ['turn the measuring stick'],
  'c17-b01': ['those empty cells fill'],
  'c19-b01': ['copy of the first', 'then the second'],
  'c22-b01': ['shrink the other'],
  'c24-b02': ['forms the Gram matrix'],
  'c26-b03': ['in total'],
  'c26-b05': ['squared gradient'],
  'c28-b01': ['turning the measuring direction', 'file the notes'],
};

function withCaptionPhrases(clock) {
  const starts = captionStarts[clock.beat.id];
  if (!starts) return clock;
  for (const phrase of starts) clock.reveal(phrase, 0, { captionStart: phrase });
  const skip = visualOnly[clock.beat.id];
  if (!skip) return clock;
  return {
    ...clock,
    reveal(phrase, seconds, options) {
      return clock.reveal(phrase, seconds, skip.includes(phrase) ? { captionStart: false } : options);
    },
  };
}
const approx = (n, expected) => assert.ok(Math.abs(n - expected) < 1e-8, `${n} differs from ${expected}`);
const rowsAgree = (a, b) => {
  const x = a.flat(Infinity),
    y = b.flat(Infinity);
  assert.equal(x.length, y.length);
  x.forEach((v, i) => approx(v, y[i]));
};
function check() {
  assert.equal(scenes.length, 28);
  assert.equal(dot(A[0], [1, 1]), dot(A[1], [1, 1]));
  rowsAgree(batchCosines(A.slice(0, 2), A), [
    [1, 0, 1 / Math.SQRT2],
    [0, 1, 1 / Math.SQRT2],
  ]);
  approx(dot(common, contrast), 0);
  rowsAgree(projection([3, 1], common), [2, 2]);
  assert.deepEqual(gramCalculation().gram, [
    [2, 1],
    [1, 2],
  ]);
  for (const pair of gramCalculation().products) {
    assert.deepEqual(pair.terms, A.map((row) => [row[pair.row], row[pair.column]]));
    assert.equal(pair.terms.filter(([a, b]) => a * b).length, pair.value);
  }
  rowsAgree(
    V.map((v) => {
      const s = directionScores(v);
      return dot(s, s);
    }),
    [3, 1],
  );
  rowsAgree(stretched, [Math.sqrt(3 / 2), -1 / Math.SQRT2]);
  rowsAgree([contribution(0), contribution(1)], [[0.5, 0.5, 1], [0.5, -0.5, 0]]);
  for (const sign of [-1, 1])
    rowsAgree(
      plus(contribution(0, sign), contribution(1)),
      A.map((row) => row[0]),
    );
  const rebuilt = A.map((row) => projection(row, common));
  rowsAgree(directionScores(common), [1 / Math.SQRT2, 1 / Math.SQRT2, Math.SQRT2]);
  rowsAgree(rebuilt, [[0.5, 0.5], [0.5, 0.5], [1, 1]]);
  rowsAgree(rebuilt[0], rebuilt[1]);
  approx(Math.hypot(...A.flatMap((row, i) => row.map((v, j) => v - rebuilt[i][j]))), 1);
  for (const [t, expected] of [
    [0, [0, 2, 1]],
    [1, [0, 1, 2]],
  ]) {
    const result = retrievalFrame({ beat: 0, cues: { 'retrieval-ties': { phase: 'during', progress: t } } });
    assert.deepEqual(orderByScore(result.scores), expected);
    const found = expected.slice(0, 2).filter((i) => A[i][0]).length;
    approx(found / 2, t === 0 ? 1 : 0.5);
  }
  rowsAgree(V.map(spread), [1 / 3, 1]);
  rowsAgree(centeredScores.map(([u, v]) => u * v), [1 / 6, -1 / 6, 0]);
  rowsAgree(comparisonRows(0), [[1, 0], [2, 1]]);
  rowsAgree(comparisonRows(1), [[1 / 3, -2 / 3], [4 / 3, 1 / 3]]);
  for (const t of [0, 0.5, 1]) {
    const [old, next] = comparisonRows(t);
    rowsAgree(plus(next, times(old, -1)), [1, 1]);
    approx(dot(old, contrast), dot(next, contrast));
  }
  approx(
    centered.reduce((sum, r) => sum + dot(r, common) * dot(r, contrast), 0),
    0,
  );
  approx(dot(plus(centered[0], [1, 1]), contrast), dot(centered[0], contrast));
  assert.deepEqual(
    [0, 1].map(
      (p) => sparseFrame({ beat: 0, cues: { 'sparse-center': { phase: 'during', progress: p } } }).nonzeros,
    ),
    [6, 36],
  );
  const fit = leastSquaresFit(A);
  rowsAgree(fit.weights, [2 / 3, 5 / 3]);
  approx(fit.squaredError, 1 / 3);
  fit.columns.forEach((column) => approx(dot(column, fit.residual), 0));
  const dup = leastSquaresFit(B);
  rowsAgree(dup.weights, [0.75, 0.75]);
  rowsAgree(dup.prediction, [1.5, 0, 1.5]);
  for (const w of [dup.weights, [2.75, -1.25], [0.25, 1.25]]) rowsAgree(samples(w, false).y, dup.prediction);
  rowsAgree(samples([0.25, 1.25], true, true).y, [0.25, 1.25, 0.25, 1.25]);
  approx((0.003 - 0.002) / 0.01, 0.1);
  const solve = solverRoundingExample(3, 1);
  rowsAgree(solve.table[0].map((_, j) => dot(solve.table.map((row) => row[j]), solve.observations)), solve.projectedTarget);
  rowsAgree(solve.projectedTarget, [6.081, 6.20424]);
  rowsAgree(solve.directWeights, [0.975, 2.025]);
  rowsAgree(solve.normalWeights, [1.8675, 1.15]);
  rowsAgree(leftovers(solve.gram, solve.projectedTarget), [0.0008, 0.00162]);
  rowsAgree(leftovers(solve.storedGram, solve.storedTarget), [0.0012, 0.00138]);
  approx(solve.conditionNumber ** 2, solve.gramConditionNumber);
  approx(energy(spectrum, 3), 46);
  for (const rank of [0, 1, 2]) {
    const spoken = ['The first strength retains', 'The first two retain'].slice(0, rank);
    const k = { beat: { beatIndex: 1 }, reveal: (phrase) => Number(spoken.includes(phrase)) };
    const state = retainedState(k);
    assert.equal(state.rank, rank);
    assert.equal(state.kept, [0, 36, 45][rank]);
    assert.equal(num(100 * state.fraction, 1), ['0', '78.3', '97.8'][rank]);
  }
  assert.ok(energy(spectrum, 1) / 46 < 0.95 && energy(spectrum, 2) / 46 >= 0.95);
  approx(factorCount(4096, 4096, 8), 65536);
  for (const t of [0, 0.5, 1.8, 3.7, 5.4]) {
    const { output } = rankOne(t);
    approx(dot(output, [-0.8, 0.6]), 0);
  }
  assert.equal(num(dot([4, 0], contrast), 3), '−2.828');
  assert.equal(dot([4, 4], contrast), 0);
  approx(dot([4, 4], common) * Math.SQRT2, 8);
  assert.deepEqual([...A, [0, 0]].map(code), [1, 2, 3, 0]);
  assert.deepEqual(
    directionScores(contrast).map((s) => contrastRoute(s, false)),
    ['Performance', 'Release repair', 'Both teams'],
  );
  assert.equal(contrastRoute(dot(A[2], contrast), true), contrastRoute(dot([0, 0], contrast), true));
}
export default {
  title: 'Which Direction Can We Afford to Lose?',
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, withCaptionPhrases(clock));
  },
  check,
};
