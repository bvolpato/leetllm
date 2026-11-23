import assert from 'node:assert/strict';
export function verifyRetry({ first, retry }) {
  assert.equal(retry, first);
}
export function verifyNewEvent({ first, next }) {
  assert.notEqual(next, first);
}
export function verifyStoredCount({ stored }) {
  assert.equal(stored, 2);
}
export const replayChecks = [verifyRetry, verifyNewEvent, verifyStoredCount];
