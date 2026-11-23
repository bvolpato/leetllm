import { between, clamp01, tsneTerm } from './arithmetic.mjs';
import {
  METHODS_BEAT_SECONDS,
  PCA_POINTS,
  TSNE_PAIR,
  UMAP_BEAT_SECONDS,
  UMAP_DIRECTIONS,
  VECTOR_BYTES,
} from './fixtures.mjs';
import {
  NEIGHBOR_MATCHES,
  PCA_AXIS,
  PCA_PROJECTION,
  mean,
  originalBytes,
  reducedBytes,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const SNAPSHOTS = {
  opening: [
    {
      stage: 0,
      coordinates: 1536,
      bytes: originalBytes,
      title: 'Inspect a crowded representation',
    },
    {
      stage: 1,
      coordinates: 256,
      bytes: reducedBytes,
      title: 'Shorten each stored vector',
    },
    {
      stage: 2,
      coordinates: 256,
      bytes: reducedBytes,
      title: 'Measure what the shorter index preserves',
    },
  ],
  budget: [
    {
      stage: 0,
      dimensions: 1536,
      bytes: 6144,
      total: originalBytes,
    },
    {
      stage: 1,
      dimensions: 256,
      bytes: 1024,
      total: reducedBytes,
    },
    {
      stage: 2,
      dimensions: 256,
      bytes: 1024,
      total: reducedBytes,
    },
  ],
  projection: [
    {
      stage: 0,
      visible: ['A', 'B', 'C', 'D'],
    },
    {
      stage: 1,
      visible: ['A', 'B', 'C', 'D'],
    },
    {
      stage: 2,
      visible: ['A', 'B', 'C', 'D'],
    },
  ],
  tsne: TSNE_PAIR.map.map((q, stage) => ({
    stage,
    p: TSNE_PAIR.original,
    q,
    term: tsneTerm(TSNE_PAIR.original, q),
  })),
  verify: [
    {
      stage: 0,
      count: 0,
      active: 0,
    },
    {
      stage: 1,
      count: NEIGHBOR_MATCHES,
      active: 6,
    },
    {
      stage: 2,
      count: NEIGHBOR_MATCHES,
      active: 6,
    },
  ],
  serving: [
    {
      stage: 0,
      active: ['fit', 'basis'],
    },
    {
      stage: 1,
      active: ['documents', 'queries'],
    },
    {
      stage: 2,
      active: ['held-out queries', 'index bytes', 'latency'],
    },
  ],
};
export function makeTrack(sceneId, snapshots) {
  return createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
}
export const TRACKS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
export function methodsState({ beat = 0, beatP = 0 } = {}) {
  const seconds = clamp01(beatP) * METHODS_BEAT_SECONDS[Math.min(2, beat)];
  const axis = beat > 0 ? 1 : between(seconds, 4.7625, 6.925);
  const projection = beat > 0 ? 1 : between(seconds, 8.475, 10.8625);
  const points = PCA_POINTS.map((point, index) => {
    const score = PCA_PROJECTION[index].value;
    const target = {
      x: mean.x + score * PCA_AXIS.x,
      y: mean.y + score * PCA_AXIS.y,
    };
    return {
      id: point.id,
      x: point.x + (target.x - point.x) * projection,
      y: point.y + (target.y - point.y) * projection,
    };
  });
  const graph = beat < 1 ? 0 : beat > 1 ? 1 : between(seconds, 0.1375, 0.7875);
  const edges =
    beat < 1
      ? [0, 0]
      : beat > 1
        ? [1, 1]
        : [between(seconds, 2.8625, 4.975), between(seconds, 7.1625, 10)];
  return {
    axis,
    projection,
    points,
    graph,
    edges,
  };
}
export function umapState({ beat = 0, beatP = 0 } = {}) {
  const seconds = clamp01(beatP) * UMAP_BEAT_SECONDS[Math.min(2, beat)];
  const directed =
    beat > 0 ? [1, 1] : [between(seconds, 3.2, 5.1875), between(seconds, 5.725, 7.9)];
  const weights = UMAP_DIRECTIONS.map((weight, index) =>
    beat > 0 || seconds >= [10.5625, 12.325][index] ? weight : null,
  );
  const unionStage =
    beat < 1
      ? 0
      : beat > 1
        ? 4
        : seconds < 0.25
          ? 0
          : seconds < 4.575
            ? 1
            : seconds < 8.5
              ? 2
              : seconds < 11.1125
                ? 3
                : 4;
  const product = UMAP_DIRECTIONS[0] * UMAP_DIRECTIONS[1];
  const union = unionStage === 4 ? UMAP_DIRECTIONS[0] + UMAP_DIRECTIONS[1] - product : null;
  const unionOpacity = beat < 1 ? 0 : beat > 1 ? 1 : between(seconds, 11.1125, 12.35);
  return {
    directed,
    weights,
    product,
    unionStage,
    union,
    unionOpacity,
  };
}
export function projectionState({ beat = 0, beatP = 0 } = {}) {
  const snapshot = SNAPSHOTS.projection[Math.min(2, beat)];
  const collisionOpacity = beat < 1 ? 0 : beat > 1 ? 1 : clamp01((beatP - 0.35) / 0.14);
  const drop = beat < 1 ? 0 : beat > 1 ? 1 : clamp01((beatP - 0.05) / 0.44);
  const remainingZ = 8 * (1 - drop);
  return {
    ...snapshot,
    collisionOpacity,
    drop,
    remainingZ,
    nearestToA: remainingZ < 1 ? 'D' : 'B',
  };
}
export function storageTransition({ beat = 0, beatP = 0 } = {}) {
  const progress = beat < 1 ? 0 : beat > 1 ? 1 : clamp01((beatP - 0.08) / 0.7);
  const dimensions = Math.round(
    VECTOR_BYTES.dimensions + (VECTOR_BYTES.reduced - VECTOR_BYTES.dimensions) * progress,
  );
  const bytesPerVector = dimensions * VECTOR_BYTES.bytesPerCoordinate;
  const currentBytes = bytesPerVector * VECTOR_BYTES.records;
  return {
    dimensions,
    bytesPerVector,
    currentBytes,
    fraction: currentBytes / originalBytes,
    startingBytes: originalBytes,
    reducedBytes,
  };
}
