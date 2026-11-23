import test from 'node:test';
import assert from 'node:assert/strict';
import {
  product2x2State,
  localMemorySpills,
  ringTraffic,
  sharedBound,
  nearestRank,
  hardwareDecision,
  pallasOwnershipTrace,
  projection,
  traversal,
} from '../animations/accelerator-architecture-field-guide.mjs';

test('every conceptual multiply contribution retains its input,weight and output owner', () => {
  for (const n of [8, 0, 3, 1, 6, 2, 7, 4, 5]) {
    const s = product2x2State(n);
    assert.equal(
      s.counts.flat().reduce((a, b) => a + b, 0),
      n,
    );
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const expected = s.terms
          .slice(0, n)
          .filter((t) => t.i === i && t.j === j)
          .reduce((v, t) => v + t.a * t.w, 0);
        assert.equal(s.sums[i][j], expected);
      }
  }
  assert.deepEqual(product2x2State(8).sums, [
    [19, 22],
    [43, 50],
  ]);
});

test('PSUM spills reach SBUF before only its excess reaches HBM', () => {
  const first = localMemorySpills({ psumLive: 6, sbufLive: 4 });
  assert.equal(first.psumToSbuf, 2);
  assert.equal(first.sbufTotal, 6);
  assert.equal(first.sbufToHbm, 0);
  const second = localMemorySpills({ psumLive: 6, sbufLive: 7 });
  assert.equal(second.psumToSbuf, 2);
  assert.equal(second.sbufTotal, 9);
  assert.equal(second.sbufToHbm, 1);
  assert.equal(localMemorySpills({ psumLive: 3, sbufLive: 6 }).sbufToHbm, 0);
});

test('four-rank ring counts completed chunk sends rather than logical tensor bytes', () => {
  const s = ringTraffic(128 * 1024, 4);
  assert.equal(s.sends, 6);
  assert.equal(s.chunkBytes, 32 * 1024);
  assert.equal(s.sentPerRank, s.sends * s.chunkBytes);
  assert.equal(s.sentPerRank, 192 * 1024);
  assert.equal(ringTraffic(120, 3).sentPerRank, 160);
});

test('shared-memory residency floors before additional resource limits', () => {
  assert.equal(sharedBound(192, 64), 3);
  assert.equal(sharedBound(192, 96), 2);
  assert.equal(sharedBound(191.99, 64), 2);
  assert.equal(sharedBound(63, 64), 0);
  assert.throws(() => sharedBound(192, 0));
});

test('nearest rank preserves the declared sample population and rejects a faster ineligible candidate', () => {
  assert.equal(nearestRank([...Array(19).fill(1), 9]), 1);
  assert.equal(nearestRank([...Array(9).fill(1), 9]), 9);
  const [a, b] = hardwareDecision();
  assert.equal(a.p95First, 400);
  assert.equal(a.raw, 50);
  assert.equal(a.requestEligibleTokens, 360);
  assert.equal(a.eligible, false);
  assert.equal(a.eligibleGoodput, 0);
  assert.equal(b.eligible, true);
  assert.equal(b.eligibleGoodput, 40);
  assert.equal(b.tokensPerDollar, 20000);
});

test('a single live Pallas output window requires consecutive reduction ownership', () => {
  const good = pallasOwnershipTrace('consecutive'),
    bad = pallasOwnershipTrace('interleaved');
  assert.deepEqual(
    good.filter((s) => s.complete).map((s) => [s.output, s.sum]),
    [
      ['Y00', 3],
      ['Y01', 7],
    ],
  );
  assert(good.every((s) => !s.lost));
  assert(bad.some((s) => s.lost));
  assert(bad.every((s) => !s.complete));
});

test('the original projection and expensive operand-reuse examples keep their physical contracts', () => {
  assert.equal(projection(8).floorMs, projection(8, 400e12).floorMs);
  assert(projection(32768, 400e12).floorMs < projection(32768).floorMs);
  assert.equal(traversal(0).kib, 18);
  assert.equal(traversal(1).kib, 12);
});
