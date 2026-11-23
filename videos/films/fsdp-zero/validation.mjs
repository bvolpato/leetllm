import {
  adamContinuation,
  capacitySnapshot,
  onlineAttention,
  perRank,
  pipelineSchedule,
  recipeLedger,
  reduceScatter,
  stageSnapshot,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(perRank(0), {
    weights: 2,
    gradients: 2,
    optimizer: 4,
  });
  assert.deepEqual(perRank(1), {
    weights: 2,
    gradients: 2,
    optimizer: 1,
  });
  assert.deepEqual(perRank(2), {
    weights: 2,
    gradients: 0.5,
    optimizer: 1,
  });
  assert.deepEqual(perRank(3), {
    weights: 0.5,
    gradients: 0.5,
    optimizer: 1,
  });
  assert.equal(
    Object.values(perRank(3)).reduce((a, b) => a + b, 0),
    2,
  );
  assert.throws(() => perRank(4), RangeError);
  assert.deepEqual(reduceScatter(), [10, 14, 18, 22]);
  assert.equal(stageSnapshot(1, 0, 0).total, 8);
  assert.equal(stageSnapshot(2, 0, 0).total, 5);
  assert.equal(stageSnapshot(3, 0, 0).total, 3.5);
  for (let stage = 0; stage < 4; stage++)
    assert.deepEqual(stageSnapshot(stage, 1, 0).current, perRank(stage));
  assert.equal(capacitySnapshot(0, 14 / 21.07).peak, 7);
  assert(!capacitySnapshot(0, 14 / 21.07).fits);
  assert.equal(capacitySnapshot(0, 1).peak, 5.5);
  assert(capacitySnapshot(0, 1).fits);
  assert.equal(capacitySnapshot(1, 1).peak, 8.5);
  assert(!capacitySnapshot(1, 1).fits);
  assert.equal(recipeLedger(30, 12, 2).total, 95);
  assert.equal(recipeLedger(30, 12, 3).total, 40);
  assert.equal(recipeLedger(70, 32).total, 35);
  assert(Math.abs(adamContinuation().resumed - 1 / 70) < 1e-12);
  assert.equal(adamContinuation().reset, 0.1);
  assert.deepEqual(pipelineSchedule().maxLive, [4, 3, 2, 1]);
  assert.deepEqual(pipelineSchedule(4, 8, false).maxLive, [8, 8, 8, 8]);
  assert.equal(pipelineSchedule().ticks, 22);
  assert.equal(pipelineSchedule(4, 8, false).ticks, 22);
  assert(Math.abs(onlineAttention().at(-1).output - 8) < 1e-12);
  return true;
}
