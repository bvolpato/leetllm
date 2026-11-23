import test from 'node:test';
import assert from 'node:assert/strict';
import {
  roundedFormat,
  activationBytes,
  residentResources,
  modeledCopySchedule,
  allocatorAccounting,
  reduction,
  freshRuntimeValues,
  tileReuse,
  precisionFailureTraces,
  cachedBlockRelease,
} from '../animations/cuda-execution.mjs';

test('format rounding distinguishes range,precision and tie-to-even underflow', () => {
  assert.equal(roundedFormat(70000, 10, -14, 15), Infinity);
  assert.equal(roundedFormat(70000, 7, -126, 127), 70144);
  assert.equal(roundedFormat(-70000, 10, -14, 15), -Infinity);
  assert.equal(roundedFormat(1 - 1e-4, 10, -14, 15), 1);
  assert.equal(roundedFormat(1 - 1e-4, 7, -126, 127), 1);
  assert.equal(roundedFormat(2 ** -25, 10, -14, 15), 0);
  assert.equal(roundedFormat(3 * 2 ** -25, 10, -14, 15), 2 ** -23);
  assert(Object.is(roundedFormat(-0, 10, -14, 15), -0));
  assert.equal(roundedFormat(1 + 2 ** -10, 10, -14, 15), 1 + 2 ** -10);
});
test('stored score count changes both position axes when length halves', () => {
  const fixture = { batch: 32, heads: 12, layers: 12, tokens: 2048, bytes: 2, scores: true };
  const full = activationBytes(fixture);
  assert.equal(full, 38654705664);
  assert.equal(activationBytes({ ...fixture, batch: 16 }), full / 2);
  assert.equal(activationBytes({ ...fixture, tokens: 1024 }), full / 4);
  assert.equal(activationBytes({ batch: 32, tokens: 128, width: 768, bytes: 4 }), 12 * 2 ** 20);
  assert.throws(() => activationBytes({ ...fixture, tokens: 0 }));
});
test('whole resident blocks obey all three supplied SM resource ceilings', () => {
  const a = residentResources(16),
    b = residentResources(32),
    middle = residentResources(20);
  assert.equal(a.blocks, 4);
  assert.equal(a.warps, 32);
  assert.equal(a.occupancy, 0.5);
  assert.equal(b.blocks, 2);
  assert.equal(b.warps, 16);
  assert.equal(b.occupancy, 0.25);
  assert.equal(middle.blocks, 3);
  assert.equal(middle.warps, 24);
  assert.equal(residentResources(128).blocks, 0);
  assert.throws(() => residentResources(0));
});
test('overlapped schedule preserves input readiness and exclusive compute ownership', () => {
  for (const overlap of [false, true]) {
    const s = modeledCopySchedule(overlap);
    for (const owner of ['A', 'B']) {
      const copy = s.events.find((e) => e.owner === owner && e.lane === 'copy');
      const compute = s.events.find((e) => e.owner === owner && e.lane === 'compute');
      assert(compute.start >= copy.end);
    }
    const compute = s.events.filter((e) => e.lane === 'compute').sort((a, b) => a.start - b.start);
    assert(compute[1].start >= compute[0].end);
    assert.equal(s.completion, overlap ? 17 : 20);
  }
});
test('cache release retains live allocations and fresh reduction excludes guarded workers', () => {
  assert.deepEqual(allocatorAccounting(8, 2, 1), { allocated: 8, reserved: 10, modeledDriver: 11 });
  assert.deepEqual(allocatorAccounting(8, 0, 1), { allocated: 8, reserved: 8, modeledDriver: 9 });
  const r = reduction(freshRuntimeValues, 8);
  assert.deepEqual(
    r.blocks.map((b) => b.subtotal),
    [21, 14],
  );
  assert.equal(r.total, 35);
  assert.equal(r.denominator, 13);
  assert.equal(r.mean, 35 / 13);
  const guards = r.blocks.flatMap((b) => b.threads).filter((t) => !t.valid);
  assert.deepEqual(
    guards.map((t) => t.index),
    [13, 14, 15],
  );
  assert(guards.every((t) => t.value === 0 && t.reachesBarrier));
});
test('tile reuse changes the memory source while retaining both complete pass results', () => {
  const values = [3, 1, 4, 2, 2, 5, 1, 3],
    direct = tileReuse(values, 2, false),
    shared = tileReuse(values, 2, true);
  assert.deepEqual(shared.reads, direct.reads);
  assert.deepEqual(shared.passSums, [21, 21]);
  assert.equal(direct.globalLoads, 16);
  assert.equal(shared.globalLoads, 8);
  assert.equal(shared.sharedReads, 16);
  assert.throws(() => tileReuse(values, 0, true));
});
test('the same finite versus NaN observation admits distinct precision failure mechanisms', () => {
  const { overflow, underflow } = precisionFailureTraces();
  assert.equal(overflow.product, Infinity);
  assert(Number.isNaN(overflow.fp16));
  assert.equal(overflow.fp32, 0);
  assert.equal(underflow.stored, 0);
  assert(Number.isNaN(underflow.fp16));
  assert.equal(underflow.fp32, 1);
});
test('allocator releases whole named cached blocks without changing any live owner', () => {
  for (const [progress, reserved] of [
    [0, 10],
    [0.25, 10],
    [0.5, 9],
    [0.75, 9],
    [1, 8],
  ]) {
    const state = cachedBlockRelease(progress);
    assert.equal(state.allocated, 8);
    assert.equal(state.reserved, reserved);
    assert.equal(state.modeledDriver, reserved + 1);
    assert.deepEqual(
      state.blocks.map((b) => b.id),
      [0, 1],
    );
  }
  assert.equal(cachedBlockRelease(0.5).blocks[0].reserved, false);
  assert.equal(cachedBlockRelease(0.5).blocks[1].reserved, true);
});
