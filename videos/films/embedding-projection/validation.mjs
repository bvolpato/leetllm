import { tsneTerm } from './arithmetic.mjs';
import {
  DROP_FIXTURE,
  METHODS_BEAT_SECONDS,
  PCA_POINTS,
  TSNE_PAIR,
  UMAP_BEAT_SECONDS,
  UMAP_DIRECTIONS,
  VECTOR_BYTES,
} from './fixtures.mjs';
import {
  SNAPSHOTS,
  TRACKS,
  methodsState,
  projectionState,
  storageTransition,
  umapState,
} from './construction.mjs';
import {
  NEIGHBOR_MATCHES,
  NEIGHBOR_PCA,
  NEIGHBOR_PCA_EIGENVALUES,
  NEIGHBOR_SOURCE_3D,
  PCA_AXIS,
  PCA_EXPLAINED,
  PCA_MATCHES,
  SOURCE_NEIGHBORS,
  UMAP_UNION,
  covariance,
  mean,
  originalBytes,
  projectedDrop,
  reducedBytes,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(originalBytes, 61_440_000_000);
  assert.equal(reducedBytes, 10_240_000_000);
  assert.equal(originalBytes / reducedBytes, 6);
  for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
    assert.equal(
      projectionState({
        beat: 0,
        beatP,
      }).collisionOpacity,
      0,
    );
    assert.equal(
      projectionState({
        beat: 2,
        beatP,
      }).collisionOpacity,
      1,
    );
    for (const beat of [0, 1, 2]) {
      const storage = storageTransition({
        beat,
        beatP,
      });
      assert.equal(storage.startingBytes, VECTOR_BYTES.dimensions * 4 * VECTOR_BYTES.records);
      assert.equal(storage.reducedBytes, VECTOR_BYTES.reduced * 4 * VECTOR_BYTES.records);
      assert.ok(
        storage.dimensions >= VECTOR_BYTES.reduced && storage.dimensions <= VECTOR_BYTES.dimensions,
      );
      assert.equal(storage.bytesPerVector, storage.dimensions * VECTOR_BYTES.bytesPerCoordinate);
      assert.equal(storage.currentBytes, storage.bytesPerVector * VECTOR_BYTES.records);
      assert.equal(storage.fraction, storage.currentBytes / storage.startingBytes);
    }
  }
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.34,
    }).collisionOpacity,
    0,
  );
  assert.ok(
    projectionState({
      beat: 1,
      beatP: 0.42,
    }).collisionOpacity > 0,
  );
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.49,
    }).collisionOpacity,
    1,
  );
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.05,
    }).remainingZ,
    8,
  );
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.49,
    }).remainingZ,
    0,
  );
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.05,
    }).nearestToA,
    'B',
  );
  assert.equal(
    projectionState({
      beat: 1,
      beatP: 0.49,
    }).nearestToA,
    'D',
  );
  assert.ok(
    projectionState({
      beat: 1,
      beatP: 0.5,
    }).visible.includes('D'),
  );
  assert.deepEqual(
    projectedDrop.find((row) => row.id === 'D').xy,
    projectedDrop.find((row) => row.id === 'A').xy,
  );
  assert.equal(
    storageTransition({
      beat: 1,
      beatP: 0,
    }).dimensions,
    1536,
  );
  assert.equal(
    storageTransition({
      beat: 1,
      beatP: 1,
    }).dimensions,
    256,
  );
  assert.deepEqual(
    projectedDrop.map((row) => row.xy),
    [
      [0, 0],
      [1, 0],
      [0, 2],
      [0, 0],
    ],
  );
  assert.equal(Math.hypot(...DROP_FIXTURE[3].point), 8);
  assert.ok(PCA_EXPLAINED > 0.99 && PCA_EXPLAINED < 1);
  assert.ok(Math.abs(tsneTerm(TSNE_PAIR.original, TSNE_PAIR.original)) < 1e-12);
  assert.ok(Math.abs(UMAP_UNION - 0.92) < 1e-12);
  assert.equal(SOURCE_NEIGHBORS.length, 6);
  assert.ok(Math.abs(covariance(0, 2)) < 1e-12 && Math.abs(covariance(1, 2)) < 1e-12);
  assert.ok(NEIGHBOR_PCA_EIGENVALUES[2] < NEIGHBOR_PCA_EIGENVALUES[1]);
  assert.equal(NEIGHBOR_PCA.length, NEIGHBOR_SOURCE_3D.length);
  assert.equal(PCA_MATCHES, 6);
  assert.equal(NEIGHBOR_MATCHES, 3);
  assert.equal(NEIGHBOR_MATCHES / SOURCE_NEIGHBORS.length, 0.5);
  const methodAt = (beat, seconds) =>
    methodsState({
      beat,
      beatP: seconds / METHODS_BEAT_SECONDS[beat],
    });
  assert.equal(methodAt(0, 4.7624).axis, 0);
  assert.equal(methodAt(0, 6.925).axis, 1);
  assert.equal(methodAt(0, 8.4749).projection, 0);
  assert.equal(methodAt(0, 10.8625).projection, 1);
  assert.deepEqual(methodAt(0, 0).points, PCA_POINTS);
  assert.deepEqual(methodAt(0, 15.408).points, methodAt(1, 0).points);
  for (const point of methodAt(0, 10.8625).points)
    assert(Math.abs((point.x - mean.x) * PCA_AXIS.y - (point.y - mean.y) * PCA_AXIS.x) < 1e-12);
  assert.deepEqual(methodAt(0, 15.408).edges, [0, 0]);
  assert.deepEqual(methodAt(1, 4.975).edges, [1, 0]);
  assert.deepEqual(methodAt(1, 10).edges, [1, 1]);
  assert.deepEqual(methodAt(1, 14.114), methodAt(2, 0));
  const umapAt = (beat, seconds) =>
    umapState({
      beat,
      beatP: seconds / UMAP_BEAT_SECONDS[beat],
    });
  assert.deepEqual(umapAt(0, 3.1999).directed, [0, 0]);
  assert.deepEqual(umapAt(0, 5.1875).directed, [1, 0]);
  assert.deepEqual(umapAt(0, 7.9).directed, [1, 1]);
  assert.deepEqual(umapAt(0, 10.5625).weights, [0.8, null]);
  assert.deepEqual(umapAt(0, 12.325).weights, UMAP_DIRECTIONS);
  assert.equal(umapAt(0, 14.69).union, null);
  assert.equal(umapAt(1, 11.1124).union, null);
  assert.equal(umapAt(1, 11.1125).union, UMAP_UNION);
  assert.equal(umapAt(1, 12.35).unionOpacity, 1);
  assert.deepEqual(umapAt(1, 13.42), umapAt(2, 0));
  for (const [sceneId, snapshots] of Object.entries(SNAPSHOTS)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0,
        }).snapshot,
        snapshots[beat],
      );
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0.5,
        }).snapshot,
        snapshots[beat],
      );
      if (beat + 1 < snapshots.length)
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP: 1,
          }).snapshot,
          snapshots[beat + 1],
        );
    }
  }
  return true;
}
