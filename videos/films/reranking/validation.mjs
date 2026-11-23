import { pairLengthWork } from './arithmetic.mjs';
import { bias, labels, scores, weights } from './fixtures.mjs';
import { candidateScope, reorderMotion } from './construction.mjs';
import { budgetPredictionState, packedEvidence, policyScore, rerank } from './model.mjs';
import assert from 'node:assert/strict';
import { dotProduct } from 'vizmatic';
export function validateModel() {
  assert.equal(pairLengthWork(8, 248).entries / pairLengthWork(8, 56).entries, 16);
  assert.equal(pairLengthWork(8, 56).totalEntries, 12288);
  assert.equal(pairLengthWork(8, 248).totalEntries, 196608);
  assert.throws(() => pairLengthWork(8, -1), RangeError);
  assert.deepEqual(rerank([0, 1, 2]), [2, 1, 0]);
  assert.equal(rerank([0, 1]).includes(2), false);
  assert.equal(scores[2], 2.3);
  assert.equal(policyScore(10, true), 7);
  assert.equal(policyScore(15, true), 5);
  assert.equal(policyScore(10, false), 5);
  assert.deepEqual(
    packedEvidence(4, 40).included.map((p) => p.id),
    ['member'],
  );
  const short = packedEvidence(5, 40);
  assert.deepEqual(
    short.eligible.map((p) => [p.id, p.tokens]),
    [
      ['member', 18],
      ['locker', 26],
    ],
  );
  assert.equal(40 - short.used, 22);
  assert.deepEqual(
    short.packed.map((p) => p.id),
    ['member'],
  );
  assert.equal(short.complete, false);
  const lockerReceipt = packedEvidence(5, 44);
  assert.equal(lockerReceipt.complete, true);
  assert.equal(lockerReceipt.used, 44);
  assert.equal(lockerReceipt.packed[1].text.split(' ').slice(-4).join(' '), 'Remove the battery first.');
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  assert.deepEqual(
    [...scores].sort((a, b) => b - a).map(sigmoid),
    scores.map(sigmoid).sort((a, b) => b - a),
  );
  assert.equal(1 / (labels.indexOf('Opening hours') + 1), 1 / 3);
  const full = 'Building guide. Sunday closed.';
  assert(!full.slice(0, 15).includes('Sunday'));
  const early = reorderMotion(0, 0.02),
    middle = reorderMotion(0, 0.5),
    late = reorderMotion(0, 0.98),
    held = reorderMotion(1, 0.02);
  assert(early.y > middle.y && middle.y > late.y);
  assert.equal(late.y, 355);
  assert.deepEqual(held, late);
  for (let index = 0; index <= 100; index++) {
    const paused = budgetPredictionState(0, index / 100);
    assert.equal(paused.depth, 0);
    assert.deepEqual(paused.admitted, []);
    assert.equal(paused.result, null);
    assert.equal(paused.targetAdmitted, false);
  }
  assert.equal(budgetPredictionState(1, 0.119).depth, 0);
  assert.equal(budgetPredictionState(1, 0.12).depth, 1);
  assert.equal(budgetPredictionState(1, 0.4).depth, 2);
  assert.equal(budgetPredictionState(1, 0.68).depth, 3);
  for (const [progress, id] of [
    [0.2, 'borrowing'],
    [0.5, 'fines'],
    [0.8, 'return-box'],
  ]) {
    const current = budgetPredictionState(1, progress);
    assert.equal(current.admitted.length, current.depth);
    assert.equal(current.result.id, id);
    assert.equal(current.result.score, Math.max(...current.admitted.map((row) => row.score)));
    for (const row of current.admitted)
      assert.equal(row.score, dotProduct(row.state, weights) + bias);
    assert.equal(current.targetAdmitted, current.depth === 3);
  }
  assert.deepEqual(budgetPredictionState(2, 0), budgetPredictionState(1, 1));
  assert.equal(
    candidateScope({
      beat: 1,
      t: 25.9895,
    }).depth,
    2,
  );
  assert.equal(
    candidateScope({
      beat: 1,
      t: 27.07075,
    }).depth,
    2,
  );
  assert.equal(
    candidateScope({
      beat: 1,
      t: 28.152,
    }).depth,
    3,
  );
  assert(
    candidateScope({
      beat: 1,
      t: 27.07075,
    }).cutoffY > 623,
  );
  assert.equal(
    candidateScope({
      beat: 2,
      beatP: 0.12,
    }).cutoffY,
    793,
  );
}
