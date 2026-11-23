export const HEADS = Object.freeze({
  queries: 8,
  mhaKV: 8,
  gqaKV: 2,
  mqaKV: 1,
  layers: 2,
  batch: 1,
  tokens: 3,
  width: 4,
  bytes: 2,
});
export const QUERY_VECTORS = Object.freeze([
  [2, 0],
  [0, 2],
  [1, 1],
  [-1, 1],
  [2, 0],
  [0, 2],
  [1, 1],
  [-1, 1],
]);
export const KV_KEYS = Object.freeze([
  [
    [1, 0],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 0],
  ],
]);
export const KV_VALUES = Object.freeze([
  [
    [1, 0],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 0],
  ],
]);
