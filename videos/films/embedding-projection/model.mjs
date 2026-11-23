import { nearest, pcaMean, savedCoordinates, unitFinite } from './arithmetic.mjs';
import {
  DROP_FIXTURE,
  FRESH_BASIS,
  NEIGHBOR_MAP,
  NEIGHBOR_SOURCE,
  NEIGHBOR_Z,
  PCA_POINTS,
  UMAP_DIRECTIONS,
  VECTOR_BYTES,
  policyQuery,
  policyVectors,
} from './fixtures.mjs';
export const projectedDrop = Object.freeze(
  DROP_FIXTURE.map(({ id, point }) => ({
    id,
    xy: point.slice(0, 2),
    z: point[2],
  })),
);
export const originalBytes =
  VECTOR_BYTES.dimensions * VECTOR_BYTES.bytesPerCoordinate * VECTOR_BYTES.records;
export const reducedBytes =
  VECTOR_BYTES.reduced * VECTOR_BYTES.bytesPerCoordinate * VECTOR_BYTES.records;
export const mean = pcaMean(PCA_POINTS);
export const centered = PCA_POINTS.map((point) => ({
  x: point.x - mean.x,
  y: point.y - mean.y,
}));
export const covXX = centered.reduce((sum, point) => sum + point.x ** 2, 0) / (centered.length - 1);
export const covXY =
  centered.reduce((sum, point) => sum + point.x * point.y, 0) / (centered.length - 1);
export const covYY = centered.reduce((sum, point) => sum + point.y ** 2, 0) / (centered.length - 1);
export const trace = covXX + covYY;
export const PCA_LAMBDA_1 = (trace + Math.sqrt((covXX - covYY) ** 2 + 4 * covXY ** 2)) / 2;
export const eigen = {
  x: covXY,
  y: PCA_LAMBDA_1 - covXX,
};
export const eigenLength = Math.hypot(eigen.x, eigen.y);
export const PCA_AXIS = Object.freeze({
  x: eigen.x / eigenLength,
  y: eigen.y / eigenLength,
});
export const PCA_PROJECTION = Object.freeze(
  centered.map((point) => ({
    id: PCA_POINTS[centered.indexOf(point)].id,
    value: point.x * PCA_AXIS.x + point.y * PCA_AXIS.y,
  })),
);
export const PCA_EXPLAINED = PCA_LAMBDA_1 / trace;
export const UMAP_UNION =
  UMAP_DIRECTIONS[0] + UMAP_DIRECTIONS[1] - UMAP_DIRECTIONS[0] * UMAP_DIRECTIONS[1];
export const NEIGHBOR_SOURCE_3D = Object.freeze(
  NEIGHBOR_SOURCE.map(([x, y], index) => [x, y, NEIGHBOR_Z[index]]),
);
export const neighborMean = [0, 1, 2].map((axis) =>
  NEIGHBOR_SOURCE_3D.reduce((sum, point) => sum + point[axis] / NEIGHBOR_SOURCE_3D.length, 0),
);
export const neighborCentered = NEIGHBOR_SOURCE_3D.map((point) =>
  point.map((value, axis) => value - neighborMean[axis]),
);
export const covariance = (left, right) =>
  neighborCentered.reduce((sum, point) => sum + point[left] * point[right], 0) /
  (neighborCentered.length - 1);
export const neighborCovXX = covariance(0, 0);
export const neighborCovXY = covariance(0, 1);
export const neighborCovYY = covariance(1, 1);
export const neighborTrace = neighborCovXX + neighborCovYY;
export const neighborLambda1 =
  (neighborTrace + Math.hypot(neighborCovXX - neighborCovYY, 2 * neighborCovXY)) / 2;
export const neighborLambda2 = neighborTrace - neighborLambda1;
export const neighborAxis1Raw = [neighborCovXY, neighborLambda1 - neighborCovXX];
export const neighborAxis1Length = Math.hypot(...neighborAxis1Raw);
export const neighborAxis1 = neighborAxis1Raw.map((value) => value / neighborAxis1Length);
export const neighborAxis2 = [-neighborAxis1[1], neighborAxis1[0]];
export const NEIGHBOR_PCA = Object.freeze(
  neighborCentered.map((point) => [
    point[0] * neighborAxis1[0] + point[1] * neighborAxis1[1],
    point[0] * neighborAxis2[0] + point[1] * neighborAxis2[1],
  ]),
);
export const NEIGHBOR_PCA_EIGENVALUES = Object.freeze([
  neighborLambda1,
  neighborLambda2,
  covariance(2, 2),
]);
export const SOURCE_NEIGHBORS = Object.freeze(nearest(NEIGHBOR_SOURCE_3D));
export const MAP_NEIGHBORS = Object.freeze(nearest(NEIGHBOR_MAP));
export const PCA_NEIGHBORS = Object.freeze(nearest(NEIGHBOR_PCA));
export const PCA_MATCHES = SOURCE_NEIGHBORS.reduce(
  (sum, neighbor, i) => sum + Number(neighbor === PCA_NEIGHBORS[i]),
  0,
);
export const NEIGHBOR_MATCHES = SOURCE_NEIGHBORS.reduce(
  (sum, neighbor, i) => sum + Number(neighbor === MAP_NEIGHBORS[i]),
  0,
);
export const POLICY_SCORES = Object.freeze(
  policyVectors.map((v) =>
    unitFinite(v).reduce((s, x, i) => s + x * unitFinite(policyQuery)[i], 0),
  ),
);
export function freshCoordinates(flip = false) {
  const document = savedCoordinates([4, 2], [2, 1], FRESH_BASIS),
    query = savedCoordinates(
      [3, 3],
      [2, 1],
      FRESH_BASIS.map((r) => r.map((x) => (flip ? -x : x))),
    ),
    cosine = unitFinite(document).reduce((s, x, i) => s + x * unitFinite(query)[i], 0);
  return {
    document,
    query,
    cosine,
  };
}
