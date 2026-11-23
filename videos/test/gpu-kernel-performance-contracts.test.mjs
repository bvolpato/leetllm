import test from 'node:test';
import assert from 'node:assert/strict';
import {
  laneSectorCoverage,
  edgeOwnership,
  resourceCapacity,
  timingEvidence,
  freshEdgeReadout,
} from '../animations/gpu-kernel-performance-engineering-lab.mjs';

test('sector coverage follows admitted word addresses rather than an aligned-warp constant', () => {
  assert.deepEqual(laneSectorCoverage(7).sectors, [0, 1, 2, 3, 4]);
  assert.equal(laneSectorCoverage(33).fraction, 0.8);
  assert.equal(laneSectorCoverage(0, 1).fraction, 0.125);
  assert.throws(() => laneSectorCoverage(0, 0));
});
test('partial-tile consumers have distinct matching producers across warp ownership', () => {
  for (const [n, bx] of [
    [33, 1],
    [67, 2],
    [73, 2],
  ]) {
    const m = edgeOwnership(n, bx, 0);
    assert.equal(m.producers.length, (n - bx * 32) * 32);
    assert.equal(new Set(m.consumers.map((x) => x.index)).size, m.consumers.length);
    assert.equal(m.barrierArrivals, 256);
    const pair = m.pairs.find((p) => p.producer.row === 1 && p.producer.col === bx * 32);
    assert.equal(pair.producer.warp, 1);
    assert.equal(pair.consumer.warp, 0);
    assert.deepEqual(pair.producer.shared, pair.consumer.shared);
    assert.equal(pair.consumer.index, bx * 32 * n + 1);
  }
});
test('whole-block capacity uses the minimum of independent resource budgets', () => {
  assert.deepEqual(
    [resourceCapacity(40).blocks, resourceCapacity(48).blocks, resourceCapacity(56).blocks],
    [6, 5, 4],
  );
  assert.equal(resourceCapacity(48).warps, 40);
  assert.equal(resourceCapacity(48).fraction, 0.625);
  assert.equal(resourceCapacity(1).blocks, 8);
});
test('all recorded timing samples retain padding uncertainty despite its lower median', () => {
  const e = timingEvidence();
  assert(e.data.padded.median < e.data.tiled.median);
  assert.equal(e.paddingRangesOverlap, true);
  assert.equal(e.allTiledBelowNaive, true);
});
test('fresh edge answers remain concealed until each separate spoken reveal completes', () => {
  const k = (name) => 'gpu-fresh-trial-' + name;
  assert.equal(freshEdgeReadout().producerCount, null);
  assert.equal(
    freshEdgeReadout({ [k('values')]: { phase: 'during', progress: 0.99 } }).producerCount,
    null,
  );
  assert.equal(freshEdgeReadout({ [k('values')]: { phase: 'after' } }).producerCount, 96);
  assert.equal(freshEdgeReadout({ [k('value')]: { phase: 'after' } }).value, 131);
  assert.equal(freshEdgeReadout({ [k('value')]: { phase: 'after' } }).outputIndex, null);
  assert.equal(freshEdgeReadout({ [k('index')]: { phase: 'after' } }).outputIndex, 4289);
});
