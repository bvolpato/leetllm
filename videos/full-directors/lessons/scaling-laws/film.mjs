import assert from 'node:assert/strict';
import { drawOpening, checkOpening, openingState } from './cloth.mjs';
import { ground } from './studio.mjs';
import { contractions, counts, pairedRuns, kaplan, runs } from './accounting.mjs';
import {
  twoTerms,
  comparison,
  exchange,
  growth,
  fresh,
  penalties,
  growthExample,
  growthExponents,
  finalState,
} from './allocation.mjs';
import {
  studies,
  frontier,
  proxy,
  widthStudy,
  fitGrid,
  floors,
  inventoryCap,
  proxyRuns,
  synthetic,
  widths,
  releases,
} from './experiments.mjs';
import {
  trialRuler,
  lifetime,
  dataSupply,
  drafts,
  metrics,
  architecture,
  bills,
  crossing,
  trial,
  qualifies,
  draftBill,
  answers,
  score,
  scoringState,
  route,
} from './deployment.mjs';
import { loss, anchorFit, surfaceLoss } from '../../../films/scaling-laws/arithmetic.mjs';
import { simultaneousWidthUpdate, EXPONENT_GRID } from '../../../films/scaling-laws/model.mjs';

const scenes = [
  drawOpening,
  contractions,
  counts,
  pairedRuns,
  kaplan,
  twoTerms,
  comparison,
  comparison,
  exchange,
  growth,
  studies,
  frontier,
  proxy,
  widthStudy,
  fitGrid,
  floors,
  inventoryCap,
  trialRuler,
  lifetime,
  lifetime,
  dataSupply,
  drafts,
  metrics,
  architecture,
  trialRuler,
  fresh,
];
function draw(ctx, clock) {
  if (clock.beat.chapterIndex) ground(ctx);
  scenes[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  checkOpening();
  const mock = (chapter, index, progress = 1) => ({
    beat: { id: chapter + '-b0' + (index + 1), beatIndex: index },
    reveal: () => progress,
  });
  const question = openingState(mock('c01', 1));
  assert.equal(question.squares, 100);
  assert.equal(question.measures.rows, 20);
  const settled = openingState(mock('c01', 2));
  assert.equal(settled.measures.rows, 10);
  assert.equal(settled.fixed.firstRow, 10);
  assert.equal(settled.moving.firstRow, 0);
  assert.deepEqual(
    runs.map(([n, d]) => n * d),
    [10, 20, 20, 40],
  );
  assert(runs[2][2] < runs[1][2]);
  for (const b of [2, 4]) {
    const tall = penalties(5, 20, 2, b),
      sq = penalties(10, 10, 2, b);
    assert.equal(tall.l < sq.l, b === 4);
    assert.equal(tall.p, 2 / Math.sqrt(5));
    assert.equal(sq.q, b / Math.sqrt(10));
    assert.equal(tall.n * tall.d, sq.n * sq.d);
  }
  const old = penalties(10, 10);
  for (let j = 0; j <= 100; j++) {
    const n = 10 + (0.1 * j) / 100,
      moved = penalties(n, 100 / n);
    assert(Math.abs(moved.n * moved.d - 100) < 1e-10);
    assert(moved.p <= old.p && moved.q >= old.q);
    if (j === 100) assert.equal(Math.round(1e6 * (moved.l - old.l)), 16);
  }
  assert.equal(loss(20, 20).toFixed(3), '1.894');
  const { alpha, beta, compute } = growthExample;
  const powers = growthExponents(alpha, beta);
  assert(Math.abs(compute ** powers.weights - 9) < 1e-10);
  assert(Math.abs(compute ** powers.tokens - 3) < 1e-10);
  assert.equal(proxyRuns.length, 9);
  assert.equal(loss(25, 16), 1.9);
  assert.equal(releases[4][2] / releases[4][1], 1875);
  for (const width of widths) {
    for (const rate of [1, 0.25]) {
      assert(Math.abs(simultaneousWidthUpdate(width, true, rate).prediction - 2 * rate) < 1e-10);
      assert(
        Math.abs(simultaneousWidthUpdate(width, false, rate).prediction - (width + 1) * rate) <
          1e-10,
      );
    }
  }
  assert.equal(EXPONENT_GRID.rows.length, 8);
  assert.equal(EXPONENT_GRID.best.alpha, 0.07);
  assert.equal(EXPONENT_GRID.best.beta, 0.098);
  assert.equal(surfaceLoss(1e9, 1e11).toFixed(3), '2.408');
  for (const a of [0.1, 0.2]) {
    const fit = anchorFit(a);
    assert.equal(fit.predict(1), 3);
    assert.equal(fit.predict(100), 2.5);
  }
  assert(Math.abs(anchorFit(0.1).predict(1e6) - anchorFit(0.2).predict(1e6)) > 0.23);
  assert.equal((synthetic.n / 1e9).toFixed(2), '7.82');
  assert.equal((synthetic.d / 1e12).toFixed(2), '12.53');
  assert.equal(surfaceLoss(49e9, 2e12).toFixed(3), '2.086');
  assert.deepEqual(trial.observed.map(qualifies), [false, true]);
  assert.equal((trial.observed[0] - trial.prediction).toFixed(3), '0.040');
  assert.equal(crossing.toFixed(2), '1.65');
  for (const q of [0, 1, crossing, 3]) {
    const [a, b] = bills(q);
    assert(Math.abs(a.serve - q * 1.4) < 1e-12);
    assert.equal(b.rate, 60);
    if (q === crossing) assert.equal(a.total.toFixed(2), b.total.toFixed(2));
    else assert.equal(a.total < b.total, q < crossing);
  }
  assert.equal(draftBill(16), 16 * draftBill(1));
  assert.equal(draftBill(4), 32768e9);
  assert.equal(score(3).complete, 0);
  assert.deepEqual(score(4), { complete: 1, correct: 15 });
  assert.deepEqual(score(answers.length), { complete: 2, correct: 34 });
  assert.deepEqual(scoringState(mock('c23', 3)), { count: 10, tokenRows: 4, gradedRows: 4 });
  const tokensCounted = { ...mock('c23', 4), reveal: phrase => Number(phrase.startsWith('Thirty-four')) };
  assert.deepEqual(scoringState(tokensCounted), { count: 10, tokenRows: 10, gradedRows: 4 });
  assert.deepEqual(scoringState(mock('c23', 4)), { count: 10, tokenRows: 10, gradedRows: 10 });
  const active = new Set([...route.shared, ...route.experts]);
  assert.equal(route.shared.length * route.billionsPerTile, 4);
  assert.equal(route.experts.length * route.billionsPerTile, 6);
  assert.equal(6 * active.size * route.billionsPerTile * 1e9 * 100e9, 6e21);
  const closing = (index, progress = 1, elapsed = 3) => ({
    ...mock('c26', index, progress),
    elapsed,
    wordCue: () => ({ end: 2 }),
  });
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const move = finalState(closing(3, progress));
    assert(Math.abs(move.n * move.d - 900) < 1e-9);
    assert.equal(move.excess, Math.max(0, move.d - 40));
  }
  const cap = finalState(closing(4));
  assert.equal(cap.n, 22.5);
  assert.equal(cap.d, 40);
  assert.equal(loss(cap.n, cap.d, 3, 6).toFixed(3), '2.581');
  const questionAtMemoryCap = finalState(closing(5));
  assert.equal(questionAtMemoryCap.memory, true);
  assert.equal(questionAtMemoryCap.n, cap.n);
  const beforeAnswer = finalState(closing(6, 1, 1.99));
  assert.equal(beforeAnswer.trim, 0);
  assert.equal(beforeAnswer.work, 900);
  const midway = finalState(closing(6, 1, 2.45));
  assert(midway.n < cap.n && midway.n > 20);
  assert.equal(midway.d, cap.d);
  assert(Math.abs(midway.work - 850) < 1e-6);
  const max = finalState(closing(6));
  assert.equal(max.n, 20);
  assert.equal(max.work, 800);
  assert.equal(max.neededRows * max.n, 900);
  assert.equal(max.missingRows, 5);
  return true;
}
export default { title: 'How to Spend a Training Budget', draw, check };
