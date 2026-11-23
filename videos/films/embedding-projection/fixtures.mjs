export const DROP_FIXTURE = Object.freeze([
  {
    id: 'A',
    point: [0, 0, 0],
  },
  {
    id: 'B',
    point: [1, 0, 0],
  },
  {
    id: 'C',
    point: [0, 2, 0],
  },
  {
    id: 'D',
    point: [0, 0, 8],
  },
]);
export const VECTOR_BYTES = Object.freeze({
  dimensions: 1536,
  reduced: 256,
  bytesPerCoordinate: 4,
  records: 10_000_000,
});
export const PCA_POINTS = Object.freeze([
  {
    id: 'A',
    x: -3,
    y: -1,
  },
  {
    id: 'B',
    x: -1,
    y: 0,
  },
  {
    id: 'C',
    x: 1,
    y: 0,
  },
  {
    id: 'D',
    x: 3,
    y: 1,
  },
]);
export const TSNE_PAIR = Object.freeze({
  original: 0.1,
  map: [0.01, 0.01, 0.1],
});
export const UMAP_DIRECTIONS = Object.freeze([0.8, 0.6]);
export const NEIGHBOR_SOURCE = Object.freeze([
  [0, 0],
  [0.2, 0],
  [3, 0],
  [3.2, 0],
  [0, 3],
  [0.2, 3],
]);
export const NEIGHBOR_Z = Object.freeze([0.2, -0.2, -0.2, 0.2, 0, 0]);
export const NEIGHBOR_MAP = Object.freeze([
  [0, 0],
  [0.2, 0],
  [1, 1],
  [4, 4],
  [4.1, 4.1],
  [4.2, 4.2],
]);
export const METHODS_BEAT_SECONDS = Object.freeze([15.408, 14.114, 14.524]);
export const UMAP_BEAT_SECONDS = Object.freeze([14.69, 13.42, 14.886]);
export const policyVectors = [
  [1, 0.92, 0.04, 0, 0.02, 0],
  [0.92, 0.8, 0.04, 0.01, 0.02, 0],
  [0.02, 0, 1, 0.88, 0.04, 0],
  [0.02, 0.02, 0.91, 0.98, 0, 0],
  [0, 0, 0.04, 0.02, 1, 0.89],
  [0.02, 0, 0, 0.02, 0.91, 1],
];
export const policyQuery = [0.98, 1, 0.03, 0, 0.01, 0];
export const FRESH_BASIS = Object.freeze([
  [0.6, 0.8],
  [-0.8, 0.6],
]);
