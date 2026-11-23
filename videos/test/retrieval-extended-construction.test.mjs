import assert from 'node:assert/strict';
import test from 'node:test';
import {
  frontierSearch,
  ivfRoute,
  reciprocalFusion,
  vectorCosine,
  vectorDot,
} from '../animations/retrieval-indexing.mjs';

test('a wider frontier preserves the temporarily worse branch that reaches the nearer owner', () => {
  assert.deepEqual(frontierSearch(1).best, ['A']);
  const wider = frontierSearch(2);
  assert.deepEqual(wider.best, ['G', 'A']);
  assert.deepEqual(wider.expanded, ['A', 'S', 'B', 'G']);
  assert.ok(wider.steps.every((s) => s.best.length <= 2));
  assert.deepEqual(frontierSearch(2), wider);
  assert.throws(() => frontierSearch(0), /positive/);
});

test('changing only the query changes the visited IVF list and the full routing work', () => {
  const before = ivfRoute(4.9),
    after = ivfRoute(5.2);
  assert.deepEqual(before.documents, after.documents);
  assert.deepEqual(before.centroids, after.centroids);
  assert.deepEqual(before.lists, [0]);
  assert.equal(before.ranked[0].id, 'generic_api');
  assert.equal(before.checks, 3);
  assert.deepEqual(after.lists, [1]);
  assert.equal(after.ranked[0].id, 'key_rotation');
  assert.ok(Math.abs(after.ranked[0].distance - 0.1) < 1e-12);
  assert.equal(after.checks, 4);
  const repaired = ivfRoute(4.9, 2);
  assert.equal(repaired.ranked[0].id, 'key_rotation');
  assert.equal(repaired.checks, 5);
});

test('fusion preserves missing-lane zero and exposes a budget loss without duplicating a lane identity', () => {
  const lanes = [
    ['d1', 'd4'],
    ['d2', 'd1', 'd4'],
  ];
  const fusion = reciprocalFusion(lanes);
  assert.deepEqual(
    fusion.map(([id]) => id),
    ['d1', 'd4', 'd2'],
  );
  assert.equal(fusion.find(([id]) => id === 'd2')[1], 1 / 61);
  assert.deepEqual(
    reciprocalFusion(lanes, 0).map(([id]) => id),
    ['d1', 'd2', 'd4'],
  );
  assert.throws(() => reciprocalFusion([['d1', 'd1']]), /Duplicate/);
});

test('directional similarity rejects a zero norm and preserves positive rescaling', () => {
  const q = [1, 0.8, 0],
    a = [1, 0.8, 0],
    b = [6, 0, 0];
  assert.ok(vectorDot(q, b) > vectorDot(q, a));
  assert.ok(vectorCosine(q, b) < vectorCosine(q, a));
  assert.equal(vectorCosine(q, [0, 0, 0]), null);
  assert.ok(
    Math.abs(
      vectorCosine(q, a) -
        vectorCosine(
          q,
          a.map((v) => v * 9),
        ),
    ) < 1e-12,
  );
});
