import test from 'node:test';
import assert from 'node:assert/strict';
import {
  packingImplementationState,
  sftExposure,
  sftBoundaryRepair,
  sftResume,
  sftCheckpointGate,
  SFT_CHECKPOINTS,
  packingSnapshot,
} from '../animations/supervised-finetuning.mjs';

test('a constant target count can conceal both lost stop supervision and a cross-segment label', () => {
  const bad = sftBoundaryRepair(false),
    good = sftBoundaryRepair(true);
  assert.equal(bad.count, 3);
  assert.equal(good.count, 3);
  assert.deepEqual(
    bad.tokens.filter((_, i) => bad.active[i]),
    ['open', 'ticket', 'USER'],
  );
  assert.deepEqual(
    good.tokens.filter((_, i) => good.active[i]),
    ['open', 'ticket', 'END'],
  );
  assert(Math.abs(bad.mean - 1.4606755448912938) < 1e-12);
  assert(Math.abs(good.mean - 0.7675283643313485) < 1e-12);
});
test('block-isolated attention ignores changes to a different incident, while global attention leaks', () => {
  const before = packingSnapshot(1, 1),
    after = packingSnapshot(2, 1);
  assert.equal(before.bOutput, 15);
  assert.equal(after.bOutput, 15);
  assert.equal(before.wrongOutput, 7.2);
  assert.equal(after.wrongOutput, 67.2);
  assert.equal(after.aOutput, 101.5);
});
test('identical next gradient moves saved weights differently when Adam history is reset', () => {
  const restored = sftResume(true),
    reset = sftResume(false);
  assert.equal(restored.saved, reset.saved);
  assert(restored.weight < restored.saved);
  assert(reset.weight > reset.saved);
  assert(Math.abs(restored.weight - 0.873366296) < 1e-8);
  assert(Math.abs(reset.weight - 1) < 1e-8);
});
test('world-size and accumulation changes alter the real item and target budgets', () => {
  assert.deepEqual(sftExposure(4, 8, 4, 1560), { items: 128, targets: 6240 });
  assert.deepEqual(sftExposure(2, 16, 8, 1560), { items: 256, targets: 12480 });
  assert.throws(() => sftExposure(4, 0, 4, 1560));
});
test('checkpoint selection respects the inclusive format floor before policy and loss tie breaks', () => {
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS).step, 600);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS, 1).step, 400);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS, 1.01), null);
  const tied = [
    { step: 40, format: 0.98, policy: 0.97, loss: 1.2 },
    { step: 20, format: 0.98, policy: 0.97, loss: 1.2 },
    { step: 10, format: 0.98, policy: 0.97, loss: 1.3 },
  ];
  assert.equal(sftCheckpointGate(tied).step, 20);
});

test('voice cue controls the packed intervention and every visible partial sum uses the same integer values', () => {
  const before = packingImplementationState(1, 0.99, {
    'packing-actual-change': { phase: 'before', progress: 0 },
  });
  const after = packingImplementationState(1, 0, {
    'packing-actual-change': { phase: 'after', progress: 1 },
  });
  assert.deepEqual(before.values, [1, 2, 3, 10, 20, 30]);
  assert.deepEqual(after.values, [101, 102, 103, 10, 20, 30]);
  for (const p of [0.01, 0.157, 0.501, 0.953]) {
    const f = packingImplementationState(1, p, {
      'packing-actual-change': { phase: 'during', progress: p },
    });
    assert(f.values.every(Number.isInteger));
    assert.equal(f.global, f.values.slice(0, 5).reduce((s, v) => s + v, 0) / 5);
    assert.equal(f.independent, 15);
  }
});
