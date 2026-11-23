import { dcg, sum } from './arithmetic.mjs';
import { ORDERING_PRODUCTS, catalog } from './fixtures.mjs';
import { relevantRecall } from './model.mjs';
import { orderingFrame, recallSnapshot, sampleModel } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const control = orderingFrame(0, 1),
    treatment = orderingFrame(1, 1);
  assert.deepEqual(
    control.rows.map((row) => row.rank),
    [1, 2, 3],
  );
  assert.deepEqual(
    treatment.rows.map((row) => row.rank),
    [3, 1, 2],
  );
  assert(Math.abs(control.ndcg - 0.7363636171343382) < 1e-12);
  assert.equal(treatment.ndcg, 1);
  assert.equal(orderingFrame(0, 1).normalizationReady, false);
  assert.equal(orderingFrame(1, 7.5 / 17.602).movement, 0);
  assert.equal(orderingFrame(1, 9.9 / 17.602).committed, true);
  for (let n = 0; n <= 100; n++) {
    const frame = orderingFrame(1, n / 100);
    assert.equal(frame.currentDcg, sum(frame.rows.map((row) => row.gain / row.discount)));
    assert.deepEqual(
      frame.rows.map((row) => row.id),
      ['P4', 'P5', 'P6'],
    );
  }
  assert.equal(catalog.filter((v) => v.ok).length, 3);
  assert(Math.abs(dcg([1, 3, 2]) / dcg([3, 2, 1]) - 0.7363636171343382) < 1e-9);
  assert(
    sampleModel('pairwise', {
      beat: 0,
      beatP: 0,
    }).scores[0] <
      sampleModel('pairwise', {
        beat: 0,
        beatP: 0,
      }).scores[1],
  );
  for (const beatP of [0, 0.4, 0.8, 1]) {
    const held = sampleModel('pairwise', {
      beat: 0,
      beatP,
    });
    assert.equal(held.n, 0);
    assert.deepEqual(held.w, [1, 0]);
    assert.deepEqual(held.scores, [0.85, 0.95]);
  }
  const early = sampleModel('pairwise', {
    beat: 1,
    beatP: 0.1,
  });
  const middle = sampleModel('pairwise', {
    beat: 1,
    beatP: 0.43,
  });
  const final = sampleModel('pairwise', {
    beat: 1,
    beatP: 0.9,
  });
  assert.equal(early.n, 0);
  assert.equal(middle.n, 6);
  assert.equal(final.n, 12);
  assert(middle.w[1] > early.w[1] && final.w[1] > middle.w[1]);
  assert(final.scores[0] > final.scores[1]);
  assert.deepEqual(
    sampleModel('pairwise', {
      beat: 1,
      beatP: 1,
    }).w,
    final.w,
  );
  assert.deepEqual(
    sampleModel('recall', {
      beat: 1,
      beatP: 0,
    }).kept,
    ['P5', 'P4'],
  );
  assert.equal(catalog.filter((row) => row.ok).length, 3);
  assert.equal(
    sampleModel('eligibility', {
      beat: 0,
      beatP: 0.02,
    }).shortlistCount,
    0,
  );
  assert.equal(
    sampleModel('eligibility', {
      beat: 0,
      beatP: 0.5,
    }).shortlistCount,
    2,
  );
  assert.equal(
    sampleModel('eligibility', {
      beat: 0,
      beatP: 0.99,
    }).shortlistCount,
    3,
  );
  assert.equal(
    sampleModel('eligibility', {
      beat: 1,
      beatP: 0.02,
    }).shortlistCount,
    3,
  );
  const timeStart = sampleModel('time', {
    beat: 0,
    beatP: 0.02,
  });
  const timeMiddle = sampleModel('time', {
    beat: 0,
    beatP: 0.5,
  });
  const timeEnd = sampleModel('time', {
    beat: 0,
    beatP: 0.99,
  });
  assert(timeStart.pendingWindowDay < timeMiddle.pendingWindowDay);
  assert(timeMiddle.pendingWindowDay < timeEnd.pendingWindowDay);
  assert.equal(
    sampleModel('time', {
      beat: 1,
      beatP: 0.02,
    }).timelineProgress,
    1,
  );
  assert.equal(timeEnd.pendingWindowDay, 5.5);
  assert.deepEqual(recallSnapshot(0, 0.02).kept, ['P5', 'P6', 'P4']);
  assert.equal(recallSnapshot(0, 0.12).removed, false);
  assert.equal(recallSnapshot(0, 0.18).removed, true);
  assert.deepEqual(recallSnapshot(0, 0.5).kept, ['P5', 'P4']);
  assert.equal(recallSnapshot(0, 0.5).p4x, 740);
  assert.deepEqual(recallSnapshot(1, 0), recallSnapshot(0, 0.88));
  assert(dcg([3, 1]) / dcg([3, 2, 1]) < 1);
  assert.deepEqual(relevantRecall(['P5', 'P4']).retainedRelevantIds, ['P5']);
  assert.equal(relevantRecall(['P5', 'P4']).value, 1 / 2);
  assert.equal(relevantRecall(['P5', 'P4'], ORDERING_PRODUCTS, 1).value, 2 / 3);
  return true;
}
