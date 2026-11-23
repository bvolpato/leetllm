import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LAB_POLICY,
  ABSTENTION_TEXT,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  supportReceiptFixture,
  answer,
  readableRankedCandidates,
  commitCheckpoint,
  freshShippingAnswer,
} from '../animations/capstone-document-qa-product.mjs';

test('the complete extractive passage keeps its end-exclusive citation and refuses a changed question', () => {
  const receipt = supportReceiptFixture(SUPPORT_QUESTION, SUPPORT_PASSAGE, 'entailed', 'review-1');
  const result = answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, receipt);
  assert.equal(result.answer, LAB_POLICY);
  assert.deepEqual(result.citations[0].span, [0, 138]);
  const changed = answer(SUPPORT_QUESTION + ' After a failed rotation?', SUPPORT_PASSAGE, receipt);
  assert.equal(changed.status, 'ABSTAIN');
  assert.equal(changed.answer, ABSTENTION_TEXT);
  assert.deepEqual(changed.citations, []);
  const fresh = freshShippingAnswer(true);
  assert.equal(fresh.status, 'ABSTAIN');
  assert.deepEqual(fresh.citations, []);
  assert.equal(freshShippingAnswer(false).status, 'ANSWER');
});

test('filtering before top one recovers the readable alternative lost by global truncation', () => {
  const rows = [
    { id: 'restricted', region: 'US', score: 9 },
    { id: 'readable', region: 'EU', score: 8 },
    { id: 'second', region: 'EU', score: 7 },
  ];
  assert.deepEqual(readableRankedCandidates(rows, 'EU', 1, false), []);
  assert.equal(readableRankedCandidates(rows, 'EU', 1, true)[0].id, 'readable');
  assert.deepEqual(
    rows.map((r) => r.id),
    ['restricted', 'readable', 'second'],
  );
});

test('current-token writes preserve counters and terminal cancellation', () => {
  const current = {
    token: 8,
    steps: 2,
    maxSteps: 6,
    status: 'researching',
    checkpoint: 'source-batch-2',
  };
  assert.equal(
    commitCheckpoint(current, { token: 7, steps: 3, checkpoint: 'late-A' }).accepted,
    false,
  );
  assert.equal(
    commitCheckpoint(current, { token: 8, steps: 3, checkpoint: 'current-B' }).state.checkpoint,
    'current-B',
  );
  for (const steps of [1, 7, true, 2.5])
    assert.equal(
      commitCheckpoint(current, { token: 8, steps, checkpoint: 'invalid' }).accepted,
      false,
    );
  assert.equal(
    commitCheckpoint(
      { ...current, status: 'cancelled' },
      { token: 8, steps: 3, checkpoint: 'late' },
    ).accepted,
    false,
  );
});
