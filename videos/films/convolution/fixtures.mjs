export const IMAGE = Array.from(
  {
    length: 5,
  },
  () => [0, 0, 1, 1, 1],
);
export const KERNEL = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];
export const HORIZONTAL = [
  [-1, -1, -1],
  [0, 0, 0],
  [1, 1, 1],
];
export const PADDED_ORDER = [
  2,
  4,
  24,
  20,
  0,
  ...Array.from(
    {
      length: 25,
    },
    (_, i) => i,
  ).filter((i) => ![2, 4, 24, 20, 0].includes(i)),
];
export const ARTICLE_CROP = [
  [0.05, 0.08, 0.06, 0.07],
  [0.12, 0.92, 0.88, 0.09],
  [0.08, 0.9, 0.93, 0.11],
  [0.06, 0.07, 0.09, 0.05],
];
export const RIDGE = [
  [-0.6, -0.6, -0.6],
  [1.1, 1.1, 1.1],
  [-0.6, -0.6, -0.6],
];
export const POOL_MAP = [
  [0.1, 0.42, 0.18, 0.3],
  [0.25, 0.91, 0.44, 0.12],
  [0.08, 0.21, 0.77, 0.55],
  [0.16, 0.14, 0.32, 0.49],
];
export const OVERLAP_MAP = [
  [1, 2, 3],
  [4, 9, 5],
  [6, 7, 8],
];
export const POOL_INCOMING = [
  [2, -1],
  [0.5, 3],
];
