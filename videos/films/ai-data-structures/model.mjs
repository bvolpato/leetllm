import { MESSAGES, NEXT_CALLER_IDS, UPDATED_MESSAGES } from './fixtures.mjs';
import {
  breadthFirstTrace,
  capacityState,
  collisionWorksheet,
  doublingHistory,
  eligibleTopK,
  heapTrace,
  ownershipSnapshot,
  permittedFreshRanking,
  scoreRows,
  search,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    scoreRows().map((r) => r.score),
    [2, 0, 2, 1],
  );
  assert.deepEqual(search(), [0, 2]);
  assert.deepEqual(search(UPDATED_MESSAGES), [0, 3]);
  assert.deepEqual(search(MESSAGES, 'unknown'), []);
  assert.deepEqual(search(MESSAGES, 'CHARGED charged twice'), [0, 2]);
  assert.deepEqual(
    heapTrace().map((r) => r.action),
    ['insert', 'insert', 'replace', 'discard'],
  );
  assert.deepEqual(heapTrace()[2].swaps, [[0, 1]]);
  assert.deepEqual(
    heapTrace()[2].after.map((r) => r.id),
    [2, 0],
  );
  assert.deepEqual(ownershipSnapshot('copy', true).stored, [0, 2]);
  assert.deepEqual(ownershipSnapshot('alias', true).stored, [2]);
  assert.deepEqual(
    eligibleTopK().filteredThenSelected.map((r) => r.id),
    [2, 3],
  );
  assert.deepEqual(
    breadthFirstTrace().map((r) => r.current),
    [null, 0, 2, 3],
  );
  assert.deepEqual(capacityState(true, true).logicalOrder, [4, 5]);
  validateStructureChapters();
  return true;
}
export function validateStructureChapters() {
  const d = doublingHistory(7);
  assert.equal(d.copied, 9);
  assert.equal(d.writes, 7);
  assert.equal(d.total, 16);
  assert.equal(d.capacity, 12);
  assert.deepEqual(collisionWorksheet().bucket, [0, 0]);
  assert.deepEqual(collisionWorksheet(true).charged, [0, 2]);
  assert.deepEqual(collisionWorksheet().charged, [0, 2, 3]);
  assert.deepEqual(
    permittedFreshRanking().all.map((r) => r.score),
    [1, 1, 1, 1],
  );
  assert.deepEqual(permittedFreshRanking().late, []);
  assert.deepEqual(
    permittedFreshRanking().early.map((r) => r.id),
    [2, 3],
  );
  assert.deepEqual(permittedFreshRanking(NEXT_CALLER_IDS).early.map((r) => r.id), [1, 2]);
  return true;
}
