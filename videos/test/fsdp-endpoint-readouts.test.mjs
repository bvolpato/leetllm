import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pipelineSchedule,
  pipelineVisibleTicks,
  contextAttentionConstruction,
} from '../animations/fsdp-zero.mjs';

test('the revealed pipeline count ends at the real schedule length', () => {
  for (const flush of [false, true]) {
    const schedule = pipelineSchedule(4, 8, flush);
    for (let i = 0; i <= 1000; i++) {
      const count = pipelineVisibleTicks(i / 1000, schedule.ticks);
      assert(count >= 1 && count <= schedule.ticks);
      assert.equal(
        schedule.events.filter((e) => e.tick < count).length <= schedule.events.length,
        true,
      );
    }
    assert.equal(pipelineVisibleTicks(1, schedule.ticks), schedule.ticks);
    assert.equal(pipelineVisibleTicks(1.1, schedule.ticks), schedule.ticks);
  }
});
test('the final attention quotient waits for the same totals to reach their endpoint', () => {
  for (const p of [0, 0.5, 0.95, 0.9666666667, 0.999999]) {
    const c = contextAttentionConstruction(p);
    assert.equal(c.complete, false);
    assert.equal(c.mass, 1 + 3 * p);
    assert.equal(c.weighted, 2 + 30 * p);
    assert.equal(c.output, c.weighted / c.mass);
  }
  const c = contextAttentionConstruction(1);
  assert.equal(c.complete, true);
  assert.equal(c.mass, 4);
  assert.equal(c.weighted, 32);
  assert.equal(c.output, 8);
  // Out-of-order frame requests retain no mutable accumulated state.
  assert.equal(contextAttentionConstruction(0.5).complete, false);
  assert.equal(contextAttentionConstruction(0.5).output, 6.8);
});
