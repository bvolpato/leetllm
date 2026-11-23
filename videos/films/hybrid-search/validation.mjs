import { DENSE_VECTORS, FUSION_LANES } from './fixtures.mjs';
import { consensusSnapshot, fusionSnapshot, newQuerySnapshot } from './construction.mjs';
import {
  bm25Term,
  coordinateGeneration,
  fuse,
  libraryEvidence,
  lowerLayerSearch,
} from './model.mjs';
import assert from 'node:assert/strict';
import { normalizeVector, dotProduct } from 'vizmatic';
export function validateModel() {
  assert.deepEqual(libraryEvidence('G-14').hits, ['G-14']);
  assert.deepEqual(libraryEvidence('growing tomatoes').hits, []);
  assert(libraryEvidence('growing tomatoes').similarity > 0.99);
  assert.deepEqual(
    [
      coordinateGeneration(0, 0).winner,
      coordinateGeneration(90, 0).winner,
      coordinateGeneration(90, 90).winner,
    ],
    [0, 1, 0],
  );
  assert(Math.abs(bm25Term(2) - 1.375) < 1e-12);
  assert(Math.abs(bm25Term(1, 0.5) - 1.2571428571428573) < 1e-12);
  assert(Math.abs(bm25Term(1, 2) - 0.7096774193548387) < 1e-12);
  assert.deepEqual(lowerLayerSearch(1).expanded, ['S', 'A', 'B']);
  assert.deepEqual(lowerLayerSearch(3).expanded, ['S', 'A', 'B', 'D', 'C']);
  assert.equal(lowerLayerSearch(1).best[0], 'B');
  assert.equal(lowerLayerSearch(3).best[0], 'C');
  assert.equal(consensusSnapshot(0, 9 / 14.878).arrived, 0);
  assert.equal(consensusSnapshot(0, 14 / 14.878).arrived, 4);
  assert.equal(newQuerySnapshot(0, 0.99).returned, 0);
  assert.equal(newQuerySnapshot(1, 7 / 18.03).contributed, 4);
  const agreed = fuse(FUSION_LANES);
  assert.equal(agreed[0].id, 'Garden');
  assert.equal(agreed[0].score, 2 / 61);
  assert.equal(agreed.find((record) => record.id === 'Cooking').score, 1 / 62);
  DENSE_VECTORS.map(normalizeVector).forEach((vector) =>
    assert(Math.abs(dotProduct(vector, vector) - 1) < 1e-12),
  );
  const trap = fuse([
    ['Garden', 'Cooking'],
    ['Travel', 'Cooking'],
  ]);
  assert.equal(trap[0].id, 'Cooking');
  assert.equal(
    trap.slice(0, 1).some((x) => x.id === 'Garden'),
    false,
  );
  assert.throws(() => fuse([['Garden', 'Garden']]));
  assert.deepEqual(fuse([[], []]), []);
  assert(
    dotProduct(normalizeVector([0.95, 0.15]), normalizeVector([1, 0.1])) >
      dotProduct(normalizeVector([0.95, 0.15]), normalizeVector([0.1, 1])),
  );
  assert.equal(fusionSnapshot(1, 0.9).result.find((row) => row.id === 'Garden').score, 1 / 61);
  assert.equal(fusionSnapshot(1, 0.02).received, 0);
  assert.equal(fusionSnapshot(1, 0.3).received, 0);
  assert.equal(fusionSnapshot(1, 0.5).received, 1);
  assert.equal(fusionSnapshot(1, 0.5).result.length, 1);
  assert.equal(fusionSnapshot(1, 0.9).events.filter((event) => event.lane === 0).length, 2);
  assert.equal(fusionSnapshot(2, 0.12).received, 2);
  assert.equal(fusionSnapshot(2, 0.22).result.find((row) => row.id === 'Garden').score, 2 / 61);
  assert.equal(fusionSnapshot(2, 0.48).received, 4);
  assert.deepEqual(fusionSnapshot(2, 0.88).result, fuse(FUSION_LANES));
}
