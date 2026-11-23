import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pairedPlayback,
  paginationSnapshot,
} from '../animations/ai-lab-technical-presentation.mjs';

test('paired evidence reaches its frozen totals by the population phrase and holds them afterward', () => {
  const completed = pairedPlayback(0, 0, { 'paired-population': { progress: 1 } });
  assert.equal(completed.n, 200);
  assert.equal(completed.baselineHits, 148);
  assert.equal(completed.candidateHits, 162);
  assert.deepEqual(
    pairedPlayback(1, 0, { 'paired-population': { progress: 1 } }).counts,
    completed.counts,
  );
  const partial = pairedPlayback(0, 1, { 'paired-population': { progress: 0.5 } });
  assert.equal(partial.n, 100);
  assert.equal(
    Object.values(partial.counts).reduce((a, b) => a + b, 0),
    100,
  );
});

test('the repeated-cursor phrase paints both receipts and the actual stopped incomplete result', () => {
  const first = paginationSnapshot(1, 1, { 'pagination-repeat': { progress: 0.3 } });
  assert.equal(first.pages, 1);
  assert(first.canRequest);
  const repeated = paginationSnapshot(1, 0, { 'pagination-repeat': { progress: 1 } });
  assert.equal(repeated.pages, 2);
  assert(repeated.duplicate);
  assert(!repeated.complete);
  assert(!repeated.canRequest);
  assert.equal(repeated.requestId, 'req-42');
});
