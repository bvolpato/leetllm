import { adam, stateLedger } from './arithmetic.mjs';
import { memoryRecipe, paddedWorkingSet, ringSends, tokenObjective } from './construction.mjs';
import { sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(
    [0, 1, 2, 3].map((stage) => stateLedger(stage).total),
    [24, 10.5, 8.25, 6],
  );
  assert.equal((1 + 3) ** 2 / 4, 4);
  assert.equal((1 ** 2 + 3 ** 2) / 2, 5);
  assert(Math.abs(adam([1, 0, 0], 2, 1)[1] - 0.2) < 1e-12);
  for (let beat = 0; beat < 3; beat++)
    for (const beatP of [0, 0.2, 0.8, 0.999]) {
      const s = sampleModel('gather', {
        beat,
        beatP,
      });
      assert.equal(s.total, s.resident + s.gathered);
      const a = sampleModel('accumulation', {
        beat,
        beatP,
      });
      assert(a.micro <= 8);
      assert.equal(a.updates, a.micro === 8 ? 1 : 0);
    }
  assert.equal(
    sampleModel('gather', {
      beat: 2,
      beatP: 1,
    }).total,
    24,
  );
  assert(
    sampleModel('checkpoint', {
      beat: 2,
      beatP: 0,
    }).gap > 1e-5,
  );
  assert.equal(memoryRecipe(1.5, 4, 2, 4, 12, 2).total, 9);
  assert.deepEqual(paddedWorkingSet([7, 11, 5], 3, [1, 0]), {
    shards: [3, 4, 2],
    padded: [9, 12, 6],
    resident: 9,
    gathered: 21,
    total: 30,
  });
  assert.equal(tokenObjective([1, 3], [2, 6]).mean, 2.5);
  assert.equal(ringSends(12, 4, 3), 27);
  return true;
}
