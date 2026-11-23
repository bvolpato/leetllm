import { combinations, distance, kmeans, lloyd, pca2, silhouette } from './arithmetic.mjs';
export const messages = [
  {
    name: 'billing A',
    text: 'charged twice',
    x: 1.0,
    y: 1.0,
  },
  {
    name: 'billing B',
    text: 'duplicate payment',
    x: 1.2,
    y: 1.8,
  },
  {
    name: 'login A',
    text: 'reset link',
    x: 4.0,
    y: 4.2,
  },
  {
    name: 'login B',
    text: 'two-factor code',
    x: 5.0,
    y: 3.8,
  },
  {
    name: 'release A',
    text: 'release runbook',
    x: 8.0,
    y: 1.0,
  },
  {
    name: 'release B',
    text: 'release approval',
    x: 9.0,
    y: 1.8,
  },
];
export const xy = messages.map((v) => [v.x, v.y]);
export const withinGroupDistances = [
  distance(xy[0], xy[1]),
  distance(xy[2], xy[3]),
  distance(xy[4], xy[5]),
];
export const labels = [0, 0, 1, 1, 2, 2];
export const seeds = [xy[0], xy[2], xy[4]];
export const centroids = [0, 1, 2].map((k) => [
  xy.filter((_, i) => labels[i] === k).reduce((sum, v) => sum + v[0], 0) / 2,
  xy.filter((_, i) => labels[i] === k).reduce((sum, v) => sum + v[1], 0) / 2,
]);
export const inertia = (centers) =>
  xy.reduce((sum, point, i) => sum + distance(point, centers[labels[i]]) ** 2, 0);
export const initialInertia = inertia(seeds);
export const updatedInertia = inertia(centroids);
export const pca = pca2(xy);
export const scaleFixture = [
  [-3.2, 100],
  [-3, 500],
  [-2.8, 900],
  [2.8, 110],
  [3, 510],
  [3.2, 910],
];
export const means = [0, 1].map(
  (axis) => scaleFixture.reduce((sum, v) => sum + v[axis], 0) / scaleFixture.length,
);
export const stds = [0, 1].map((axis) =>
  Math.sqrt(
    scaleFixture.reduce((sum, v) => sum + (v[axis] - means[axis]) ** 2, 0) / scaleFixture.length,
  ),
);
export const rawScaleLabels = kmeans(scaleFixture, [scaleFixture[0], scaleFixture[3]]).labels;
export const normalizedScaleLabels = kmeans(
  scaleFixture.map((v) => v.map((value, axis) => (value - means[axis]) / stds[axis])),
  [scaleFixture[0], scaleFixture[3]].map((v) =>
    v.map((value, axis) => (value - means[axis]) / stds[axis]),
  ),
).labels;
export const query = [2.8, 2.71];
export const coarseDistances = centroids.map((v) => distance(query, v));
export const exactNearestIndex = xy
  .map((v) => distance(query, v))
  .indexOf(Math.min(...xy.map((v) => distance(query, v))));
export const clusterTrials = [2, 3, 4].map((k) => {
  const fits = combinations(xy.length, k)
    .map((indices) =>
      lloyd(
        xy,
        indices.map((i) => xy[i]),
      ),
    )
    .filter(Boolean);
  const best = fits.reduce((a, b) => (b.inertia < a.inertia - 1e-12 ? b : a));
  return {
    k,
    ...best,
    silhouette: xy.reduce((sum, _, i) => sum + silhouette(xy, best.labels, i).score, 0) / xy.length,
  };
});
export const transferDocuments = [
  {
    id: 'P',
    text: 'billing policy',
    point: [-20, 0],
  },
  {
    id: 'B',
    text: 'billing help',
    point: [0, 0],
  },
  {
    id: 'L',
    text: 'sign-in code help',
    point: [0, 3],
  },
  {
    id: 'D',
    text: 'release policy',
    point: [20, 0],
  },
  {
    id: 'R',
    text: 'runbook note',
    point: [0, -3],
  },
];
export const transferQuery = [0, 3.2];
