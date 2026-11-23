import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshDeadline,
  puctWorksheet,
  coverage,
} from '../animations/design-reasoning-agent-test-time-compute.mjs';
const state = (beat, sentence, progress = 1) => ({
  beat,
  cues: Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [
      `ra-fresh-deadline-1-${i}`,
      {
        phase: i < sentence ? 'after' : i === sentence ? 'during' : 'before',
        progress: i < sentence ? 1 : i === sentence ? progress : 0,
      },
    ]),
  ),
});
test('the completed candidate survives deadline while uncertain calls retain the conserved budget', () => {
  const initial = freshDeadline({ beat: 0, beatP: 1 });
  assert.equal(initial.spent, 900);
  assert.equal(initial.free, 1100);
  assert.equal(initial.reveal, false);
  const before = freshDeadline(state(1, 1, 0.999));
  assert.deepEqual(
    before.reservations.map((x) => x.id),
    ['A', 'B'],
  );
  assert.equal(before.free, 1100);
  const admitted = freshDeadline(state(1, 1));
  assert.equal(admitted.spent, 2300);
  assert.equal(admitted.free, 200);
  assert.deepEqual(admitted.reservations, [
    { id: 'B', value: 2000 },
    { id: 'D', value: 1500 },
  ]);
  const final = freshDeadline(state(1, 4));
  assert.equal(final.deadline, true);
  assert.equal(final.returnC, true);
  assert.equal(
    final.spent + final.free + final.reservations.reduce((a, r) => a + r.value, 0),
    6000,
  );
  assert.deepEqual(final.reservations, admitted.reservations);
});
test('a supplied rollout updates both visits and running value before recomputing the exploration score', () => {
  const initial = puctWorksheet(),
    backed = puctWorksheet(true);
  assert.equal(initial.bonus, 0.4);
  assert.equal(initial.total, 0.9);
  assert.equal(backed.Q, (0.5 + 1) / 2);
  assert.equal(backed.parent, 17);
  assert.equal(backed.visits, 2);
  assert(Math.abs(backed.bonus - (0.2 * Math.sqrt(17)) / 3) < 1e-15);
  assert(backed.total > 1);
  assert(Math.abs(coverage(1e-20, 100) - 1e-18) < 1e-32);
});
