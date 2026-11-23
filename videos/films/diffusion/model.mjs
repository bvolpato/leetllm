import { generator, mixture, normal, probabilityFlowStep } from './arithmetic.mjs';
import { CENTERS, CLEAN_VARIANCE, MAX_ADDED_VARIANCE, SCORE_PROBE, SHADOW_PIXEL, TOP_PIXEL } from './fixtures.mjs';
import { completed } from './construction.mjs';
import { fileDecision, makeReleaseStudy } from './release-study.mjs';
export function scoreProbe() {
  return [...SCORE_PROBE];
}
export const imageRng = generator(731);
export const image = Array.from(
  {
    length: 256,
  },
  (_, i) => {
    const x = i % 16,
      y = Math.floor(i / 16);
    const top = y >= 5 && y <= 7 && x >= 2 && x <= 13;
    const legs = y > 7 && y <= 13 && ((x >= 3 && x <= 4) || (x >= 11 && x <= 12));
    return top || legs ? 1 : -0.8;
  },
);
export const imageNoise = image.map(() => normal(imageRng));
// Supply the two worksheet draws explicitly while retaining the seeded field around them.
imageNoise[TOP_PIXEL] = -0.4;
imageNoise[SHADOW_PIXEL] = 0.6;
export const particleRng = generator(14207);
export const trajectories = Array.from(
  {
    length: 72,
  },
  () => {
    const center = CENTERS[Math.floor(particleRng() * 3)];
    const first = center.map(
      (value) => value + Math.sqrt(CLEAN_VARIANCE + MAX_ADDED_VARIANCE) * normal(particleRng),
    );
    const result = [first];
    for (let i = 0; i < 720; i++)
      result.push(
        probabilityFlowStep(
          result.at(-1),
          MAX_ADDED_VARIANCE * (1 - i / 720),
          -MAX_ADDED_VARIANCE / 720,
        ),
      );
    return result;
  },
);
export function trajectoryPoint(index, progress) {
  const path = trajectories[index % trajectories.length];
  const f = Math.max(0, Math.min(1, progress)) * (path.length - 1);
  const i = Math.floor(f),
    next = Math.min(i + 1, path.length - 1),
    p = f - i;
  return path[i].map((value, axis) => value + (path[next][axis] - value) * p);
}
export const contourCache = new Map();
export function densityContours(addedVariance) {
  const key = Math.round(addedVariance * 120);
  if (contourCache.has(key)) return contourCache.get(key);
  const variance = key / 120,
    cols = 48,
    rows = 30;
  const xs = Array.from(
    {
      length: cols + 1,
    },
    (_, i) => -4.4 + (8.8 * i) / cols,
  );
  const ys = Array.from(
    {
      length: rows + 1,
    },
    (_, i) => -2.75 + (5.5 * i) / rows,
  );
  const values = ys.map((y) => xs.map((x) => mixture([x, y], variance).density));
  const cases = [
    [],
    [[3, 0]],
    [[0, 1]],
    [[3, 1]],
    [[1, 2]],
    [
      [3, 2],
      [0, 1],
    ],
    [[0, 2]],
    [[3, 2]],
    [[2, 3]],
    [[2, 0]],
    [
      [0, 3],
      [1, 2],
    ],
    [[2, 1]],
    [[1, 3]],
    [[1, 0]],
    [[0, 3]],
    [],
  ];
  const result = [];
  for (const level of [0.006, 0.018, 0.045, 0.11, 0.26, 0.5]) {
    const segments = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const points = [
          [xs[col], ys[row]],
          [xs[col + 1], ys[row]],
          [xs[col + 1], ys[row + 1]],
          [xs[col], ys[row + 1]],
        ];
        const v = [
          values[row][col],
          values[row][col + 1],
          values[row + 1][col + 1],
          values[row + 1][col],
        ];
        const mask = v.reduce((sum, value, i) => sum + (value >= level ? 1 << i : 0), 0);
        const edgePoint = (edge) => {
          const j = (edge + 1) % 4,
            p = (level - v[edge]) / (v[j] - v[edge]);
          return points[edge].map((value, axis) => value + p * (points[j][axis] - value));
        };
        for (const edges of cases[mask]) segments.push(edges.map(edgePoint));
      }
    const pointKey = (point) => point.map((value) => value.toFixed(6)).join(',');
    const ends = new Map();
    segments.forEach((segment, i) =>
      segment.forEach((point, endpoint) => {
        const k = pointKey(point);
        if (!ends.has(k)) ends.set(k, []);
        ends.get(k).push([i, endpoint]);
      }),
    );
    const seen = new Set();
    for (let i = 0; i < segments.length; i++) {
      if (seen.has(i)) continue;
      seen.add(i);
      const chain = [...segments[i]];
      for (const front of [false, true])
        while (true) {
          const end = front ? chain[0] : chain.at(-1);
          const next = ends.get(pointKey(end))?.find(([j]) => !seen.has(j));
          if (!next) break;
          seen.add(next[0]);
          const point = segments[next[0]][1 - next[1]];
          if (front) chain.unshift(point);
          else chain.push(point);
        }
      result.push({
        level,
        points: chain,
      });
    }
  }
  contourCache.set(key, result);
  return result;
}
export function scalarReverseTrace() {
  const betas = [0.02, 0.03, 0.04],
    alphas = betas.map((x) => 1 - x),
    bars = [];
  let product = 1;
  for (const a of alphas) bars.push((product *= a));
  const draws = [-0.2558802884476004, 0.511431512516514, 0],
    rows = [];
  let x = 1.25;
  for (let i = 0; i < 3; i++) {
    const step = 2 - i,
      prediction = 0.45 * x + 0.02 * step,
      mean = (x - (betas[step] / Math.sqrt(1 - bars[step])) * prediction) / Math.sqrt(alphas[step]),
      next = mean + Math.sqrt(betas[step]) * draws[i];
    rows.push({
      step,
      input: x,
      prediction,
      mean,
      draw: draws[i],
      next,
    });
    x = next;
  }
  const saved = rows[0].next,
    step = 1,
    prediction = 0.45 * saved + 0.02,
    mean =
      (saved - (betas[step] / Math.sqrt(1 - bars[step])) * prediction) / Math.sqrt(alphas[step]);
  return {
    rows,
    saved,
    restoredNext: rows[1].next,
    resetNext: mean + Math.sqrt(0.03) * draws[0],
    final: x,
  };
}
export function posteriorFixture() {
  const mean = Math.SQRT2 / 3,
    within = 1 / 3,
    between = mean ** 2;
  return {
    means: [-mean, mean],
    within,
    between,
    total: within + between,
    mean: 0,
  };
}
export function crossReadFixture(query = [0.25, 0.1, 0.7]) {
  const keys = [
      [0.3, 0.05, 0.65],
      [0.1, 0.8, 0.1],
      [0.35, 0.1, 0.55],
    ],
    values = [
      [0.7, 0.2],
      [0.2, 0.7],
      [0.8, 0.1],
    ],
    scores = keys.map((k) => k.reduce((n, v, i) => n + v * query[i], 0) / Math.sqrt(3)),
    max = Math.max(...scores),
    masses = scores.map((x) => Math.exp(x - max)),
    shares = masses.map((x) => x / masses.reduce((a, b) => a + b, 0));
  return {
    query,
    keys,
    values,
    scores,
    masses,
    shares,
    output: [0, 1].map((i) => shares.reduce((n, w, j) => n + w * values[j][i], 0)),
  };
}
export const releaseJob = makeReleaseStudy(image);

export function freshDiffusionSnapshot(state) {
  const b = state.beat ?? 0;
  const { variants, steps, branches, candidates: [old, current], currentAttempt } = releaseJob;
  const committed = b === 2 && completed(state, 'fresh-commit');
  return {
    work: b > 1 || (b === 1 && completed(state, 'fresh-work')) ? variants * steps * branches : null,
    old: b > 1 || (b === 1 && completed(state, 'fresh-old')) ? fileDecision(old, currentAttempt, true) : null,
    current: b > 1 || (b === 1 && completed(state, 'fresh-current')) ? fileDecision(current, currentAttempt, false) : null,
    published: committed && fileDecision({ ...current, checked: current.file }, currentAttempt, true) === 'publish',
  };
}
