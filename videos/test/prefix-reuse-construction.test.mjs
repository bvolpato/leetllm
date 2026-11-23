import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fullBlockPrefix,
  longestLookup,
  priceInput,
  ownershipAfter,
  guideWork,
} from '../animations/prefix-reuse.mjs';

test('full-block eligibility never rounds into a changed token', () => {
  for (let common = 0; common <= 513; common++) {
    const reused = fullBlockPrefix(common, 32);
    assert(reused <= common && common - reused < 32);
    assert.equal(reused % 32, 0);
  }
  assert.throws(() => fullBlockPrefix(20, 0), /Invalid prefix or block size/);
});

test('inclusive lookup positions use longest reached endpoint without adding overlaps', () => {
  assert.equal(longestLookup([12, 40], [31, 60]), 12);
  assert.equal(longestLookup([12, 40], [31, 60, 40]), 40);
  assert.equal(longestLookup([15], [34]), 15);
  assert.equal(longestLookup([15], [35]), 0);
});

test('a stable-prefix marker changes write accounting while conserving input volume', () => {
  const full = [
    { read: 0, write: 6000, ordinary: 0 },
    ...Array.from({ length: 3 }, () => ({ read: 1024, write: 4976, ordinary: 0 })),
  ];
  const bounded = [
    { read: 0, write: 1024, ordinary: 4976 },
    ...Array.from({ length: 3 }, () => ({ read: 1024, write: 0, ordinary: 4976 })),
  ];
  for (const rows of [full, bounded])
    assert.equal(
      rows.reduce((n, r) => n + r.read + r.write + r.ordinary, 0),
      24000,
    );
  assert(Math.abs(priceInput(full) - 26467.2) < 1e-8);
  assert(Math.abs(priceInput(bounded) - 21491.2) < 1e-8);
});

test('allocation preserves referenced storage and evicts only after uncached capacity is exhausted', () => {
  const pool = { total: 120, referenced: 53, cached: 41, free: 26 };
  assert.deepEqual(ownershipAfter(pool, 26), {
    total: 120,
    referenced: 79,
    cached: 41,
    free: 0,
    evicted: 0,
    available: 41,
  });
  assert.deepEqual(ownershipAfter(pool, 35), {
    total: 120,
    referenced: 88,
    cached: 32,
    free: 0,
    evicted: 9,
    available: 32,
  });
  assert.throws(() => ownershipAfter(pool, 68), /Allocation exceeds available blocks/);
  assert.equal(pool.referenced, 53);
});

test('a changed block cannot regain reuse from a later matching suffix', () => {
  assert.deepEqual(guideWork(4800, 64, 16), { guide: 4800, tail: 64, reused: 4800, fresh: 64 });
  const changed = guideWork(4800, 64, 16, 4097);
  assert.equal(changed.reused, 4096);
  assert.equal(changed.fresh, 768);
  assert(changed.fresh > 700 && changed.fresh <= 768);
});
