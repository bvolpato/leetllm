export function plotTicks(domain) {
  const step = domain[1] - domain[0] <= 6 ? 1 : 2;
  return Array.from(
    {
      length: Math.floor(domain[1] / step) - Math.ceil(domain[0] / step) + 1,
    },
    (_, i) => (Math.ceil(domain[0] / step) + i) * step,
  );
}
export function formatScaleValue(v) {
  return Math.abs(v) < 1e-12 ? '0' : v.toFixed(3);
}
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function pca2(points) {
  const mean = [0, 1].map((axis) => points.reduce((sum, v) => sum + v[axis], 0) / points.length);
  const centered = points.map((v) => [v[0] - mean[0], v[1] - mean[1]]);
  const a = centered.reduce((sum, v) => sum + v[0] * v[0], 0);
  const cross = centered.reduce((sum, v) => sum + v[0] * v[1], 0);
  const d = centered.reduce((sum, v) => sum + v[1] * v[1], 0);
  const large = (a + d + Math.sqrt((a - d) ** 2 + 4 * cross ** 2)) / 2;
  const angle = 0.5 * Math.atan2(2 * cross, a - d);
  let vector = [Math.cos(angle), Math.sin(angle)];
  if (vector[0] < 0) vector = vector.map((v) => -v);
  const scores = centered.map((v) => v[0] * vector[0] + v[1] * vector[1]);
  const total = a + d;
  const residual = centered.reduce((sum, v, i) => {
    const reconstructed = [mean[0] + scores[i] * vector[0], mean[1] + scores[i] * vector[1]];
    return sum + (points[i][0] - reconstructed[0]) ** 2 + (points[i][1] - reconstructed[1]) ** 2;
  }, 0);
  return {
    mean,
    vector,
    scores,
    varianceKept: large / total,
    residual,
  };
}
export function kmeans(data, initial, maxSteps = 20) {
  let centers = initial.map((v) => [...v]);
  let old = null;
  let cluster;
  for (let step = 0; step < maxSteps; step++) {
    cluster = data.map((point) =>
      centers
        .map((c) => distance(point, c))
        .indexOf(Math.min(...centers.map((c) => distance(point, c)))),
    );
    const next = centers.map((_, k) => {
      const members = data.filter((_, i) => cluster[i] === k);
      return [0, 1].map((axis) => members.reduce((sum, v) => sum + v[axis], 0) / members.length);
    });
    if (JSON.stringify(cluster) === JSON.stringify(old))
      return {
        labels: cluster,
        centers: next,
      };
    centers = next;
    old = [...cluster];
  }
  return {
    labels: cluster,
    centers,
  };
}
export const unit = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export function meanOf(data, assignments, k) {
  const members = data.filter((_, i) => assignments[i] === k);
  return [0, 1].map((axis) => members.reduce((sum, p) => sum + p[axis], 0) / members.length);
}
export function lloyd(data, initial) {
  let centers = initial.map((p) => [...p]),
    previous = [];
  for (let step = 0; step < 30; step++) {
    const assignments = data.map((point) =>
      centers
        .map((c) => distance(point, c))
        .reduce((best, value, k, all) => (value < all[best] ? k : best), 0),
    );
    if (centers.some((_, k) => !assignments.includes(k))) return null;
    const next = centers.map((_, k) => meanOf(data, assignments, k));
    if (assignments.every((value, i) => value === previous[i]))
      return {
        labels: assignments,
        centers: next,
        inertia: data.reduce((sum, p, i) => sum + distance(p, next[assignments[i]]) ** 2, 0),
      };
    centers = next;
    previous = assignments;
  }
  return null;
}
export function combinations(n, k, start = 0, prefix = []) {
  if (!k) return [prefix];
  return Array.from(
    {
      length: n - start - k + 1,
    },
    (_, j) => start + j,
  ).flatMap((i) => combinations(n, k - 1, i + 1, [...prefix, i]));
}
export function silhouette(data, assignments, index) {
  const own = data
    .map((_, i) => i)
    .filter((i) => i !== index && assignments[i] === assignments[index]);
  if (!own.length)
    return {
      a: 0,
      b: 0,
      score: 0,
      singleton: true,
      otherGroup: null,
    };
  const a = own.reduce((sum, i) => sum + distance(data[index], data[i]), 0) / own.length;
  const others = [...new Set(assignments)]
    .filter((k) => k !== assignments[index])
    .map((k) => ({
      k,
      mean:
        data.reduce((sum, p, i) => sum + (assignments[i] === k ? distance(data[index], p) : 0), 0) /
        assignments.filter((v) => v === k).length,
    }));
  const nearest = others.reduce((best, row) => (row.mean < best.mean ? row : best));
  return {
    a,
    b: nearest.mean,
    score: (nearest.mean - a) / Math.max(a, nearest.mean),
    singleton: false,
    otherGroup: nearest.k,
  };
}
export function visibleLineSegments(start, end, boxes) {
  const cuts = [];
  for (const box of boxes) {
    let lo = 0,
      hi = 1;
    for (const [axis, min, max] of [
      ['x', box.x, box.x + box.width],
      ['y', box.y, box.y + box.height],
    ]) {
      const delta = end[axis] - start[axis];
      if (Math.abs(delta) < 1e-12) {
        if (start[axis] < min || start[axis] > max) {
          lo = 1;
          hi = 0;
          break;
        }
      } else {
        const a = (min - start[axis]) / delta,
          b = (max - start[axis]) / delta;
        lo = Math.max(lo, Math.min(a, b));
        hi = Math.min(hi, Math.max(a, b));
      }
    }
    if (lo <= hi) cuts.push([lo, hi]);
  }
  cuts.sort((a, b) => a[0] - b[0]);
  const intervals = [];
  let cursor = 0;
  for (const [lo, hi] of cuts) {
    if (lo > cursor) intervals.push([cursor, lo]);
    cursor = Math.max(cursor, hi);
  }
  if (cursor < 1) intervals.push([cursor, 1]);
  return intervals.map((interval) =>
    interval.map((t) => ({
      x: mix(start.x, end.x, t),
      y: mix(start.y, end.y, t),
    })),
  );
}
