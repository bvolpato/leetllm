import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleModel,
  interval,
  observedUserRows,
  userReadout,
  servedSelectionSnapshot,
} from '../animations/ab-testing-online-evaluation-llms.mjs';

test('the opening benefit and uncertainty readout describe the same observed experiment', () => {
  const opening = sampleModel('intro', { beat: 0, beatP: 0.5 }),
    readout = userReadout(observedUserRows),
    uncertainty = interval();
  assert.equal(opening.a, readout.a);
  assert.equal(opening.b, readout.b);
  assert.equal(opening.lift, uncertainty.d);
  assert.equal(opening.relative, uncertainty.d / uncertainty.a);
  assert.equal((opening.lift * 100).toFixed(2), '3.63');
});
test('served-only filtering removes the two failures while keeping the successful user identity', () => {
  const before = servedSelectionSnapshot(0),
    halfway = servedSelectionSnapshot(0.4),
    after = servedSelectionSnapshot(1);
  assert.deepEqual([before.n, halfway.n, after.n], [3, 2, 1]);
  assert.deepEqual([before.success, halfway.success, after.success], [1, 1, 1]);
  assert.equal(after.rate, 1);
  assert.deepEqual(
    after.users.filter((row) => row.drop < 1).map((row) => row.id),
    ['T1'],
  );
  assert.deepEqual(
    after.users.map((row) => row.y),
    before.users.map((row) => row.y),
  );
});
