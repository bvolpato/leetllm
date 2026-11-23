import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleRequests,
  prefixPageState,
  speculativeAcceptance,
  revisedCapacityRows,
} from '../animations/inference-batch-capacity.mjs';

test('refilling vacated slots preserves the long request and all emitted positions', () => {
  const run = scheduleRequests([2, 2, 5, 3, 1], 3, true);
  assert.equal(run.reads, 5);
  assert.deepEqual(run.frames[2].slots, [3, 4, 2]);
  assert(run.frames.every((frame) => frame.slots[2] === 2));
  assert.deepEqual(
    run.frames
      .flatMap((f) => f.emitted)
      .filter((e) => e.id === 2)
      .map((e) => e.position),
    [1, 2, 3, 4, 5],
  );
  assert.equal(run.tokens, 13);
  assert.equal(scheduleRequests([2, 2, 5, 3, 1], 3, false).reads, 8);
});
test('private appends preserve both old prefix values and distinct page ownership', () => {
  const before = prefixPageState(0),
    after = prefixPageState(3);
  assert.equal(before.A, before.B);
  assert.notEqual(after.A, after.B);
  assert.deepEqual(
    after.pages.map((p) => p.values.slice(0, 3)),
    [
      ['p', 'q', 'r'],
      ['p', 'q', 'r'],
    ],
  );
  assert.deepEqual(
    after.pages.map((p) => [p.references, p.values[3]]),
    [
      [1, 'a'],
      [1, 'b'],
    ],
  );
  assert.deepEqual(before.pages[0].values, ['p', 'q', 'r', null]);
});
test('rejection correction redistributes positive target-minus-draft mass', () => {
  const result = speculativeAcceptance([0.1, 0.6, 0.3], [0.5, 0.25, 0.25], 0, 0.4);
  assert.equal(result.threshold, 0.2);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.residual, [0, 0.875, 0.12499999999999999]);
});
test('the revised worksheet applies memory and time limits before charging useful rate', () => {
  const rows = revisedCapacityRows(),
    choice = rows.filter((r) => r.eligible).at(-1);
  assert.equal(choice.batch, 24);
  assert.equal(choice.ms, 36);
  assert.equal(rows.find((r) => r.batch === 48).memoryPass, true);
  assert.equal(rows.find((r) => r.batch === 48).timePass, false);
  assert.equal(rows.find((r) => r.batch === 64).memoryPass, false);
  assert(Math.abs(choice.costPerMillion - 5 / 6) < 1e-12);
});
