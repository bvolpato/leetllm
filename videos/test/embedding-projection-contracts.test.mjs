import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cauchyMap,
  pairDistanceFor,
  mapPairFixture,
  savedCoordinates,
  unitFinite,
  freshCoordinates,
  FRESH_BASIS,
} from '../animations/embedding-projection.mjs';

test('the supplied t-SNE motion normalizes every ordered pair after moving one point', () => {
  const before = mapPairFixture(pairDistanceFor(0.01));
  const after = mapPairFixture(pairDistanceFor(0.1));
  assert(Math.abs(before.denominator - 2.8583852214189114) < 1e-12);
  assert(Math.abs(after.denominator - 5.461552261869084) < 1e-12);
  assert(Math.abs(before.q[0][1] - 0.01) < 1e-12);
  assert(Math.abs(after.q[0][1] - 0.1) < 1e-12);
  for (const result of [before, after]) {
    assert(Math.abs(result.q.flat().reduce((sum, x) => sum + x) - 1) < 1e-12);
    result.q.forEach((row, i) => assert.equal(row[i], 0));
  }
  assert.notEqual(before.q[2][3], after.q[2][3]);
  assert.throws(() =>
    cauchyMap([
      [0, NaN],
      [1, 1],
    ]),
  );
  assert.throws(
    () =>
      cauchyMap([
        [1e308, 0],
        [-1e308, 0],
      ]),
    /normalizer/,
  );
  assert.throws(() => pairDistanceFor(NaN), /Unreachable/);
  assert.throws(() => pairDistanceFor(Infinity), /Unreachable/);
});

test('saved coordinate consistency preserves a common sign convention and rejects invalid directions', () => {
  const good = freshCoordinates();
  const bad = freshCoordinates(true);
  assert.deepEqual(good.document, [2, -1]);
  assert(Math.abs(good.query[0] - 2.2) < 1e-12);
  assert(Math.abs(good.cosine - 0.8) < 1e-12);
  assert(Math.abs(bad.cosine + 0.8) < 1e-12);
  const flipped = FRESH_BASIS.map((row) => row.map((x) => -x));
  const both = [
    [4, 2],
    [3, 3],
  ].map((v) => unitFinite(savedCoordinates(v, [2, 1], flipped)));
  assert(Math.abs(both[0].reduce((sum, x, i) => sum + x * both[1][i], 0) - good.cosine) < 1e-12);
  assert.throws(() => savedCoordinates([1, 2], [1], [[1, 0]]));
  assert.throws(() => unitFinite([0, 0]));
  const large = unitFinite([1e308, 1e308]);
  assert(Math.abs(Math.hypot(...large) - 1) < 1e-12);
});
