import { packedValues, scores, values } from './fixtures.mjs';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.12) / 0.7));
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export function summary(count, rescale = true) {
  let m = -Infinity,
    l = 0,
    u = [0, 0];
  for (let start = 0; start < count; start += 2) {
    const ss = scores.slice(start, Math.min(start + 2, count)),
      mm = Math.max(m, ...ss),
      alpha = m === -Infinity ? 0 : rescale ? Math.exp(m - mm) : 1;
    const w = ss.map((v) => Math.exp(v - mm));
    l = alpha * l + sum(w);
    u = u.map((v, d) => alpha * v + sum(w.map((weight, i) => weight * values[start + i][d])));
    m = mm;
  }
  return {
    m,
    l,
    u,
    output: u.map((v) => (l ? v / l : 0)),
    lse: m + Math.log(l),
  };
}
export function tileSummary(start, end) {
  const selected = scores.slice(start, end),
    m = Math.max(...selected),
    weights = selected.map((score) => Math.exp(score - m));
  const u = [0, 1].map((d) => sum(weights.map((weight, i) => weight * values[start + i][d])));
  const l = sum(weights);
  return {
    m,
    l,
    u,
    output: u.map((value) => value / l),
  };
}
export function mergeSummaries(left, right) {
  const m = Math.max(left.m, right.m),
    alphaLeft = Math.exp(left.m - m),
    alphaRight = Math.exp(right.m - m);
  const l = alphaLeft * left.l + alphaRight * right.l;
  const u = left.u.map((value, i) => alphaLeft * value + alphaRight * right.u[i]);
  return {
    m,
    l,
    u,
    output: u.map((value) => value / l),
    alphaLeft,
    alphaRight,
  };
}
export function keepMask(q, k, corner) {
  return Array.from(
    {
      length: q,
    },
    (_, i) =>
      Array.from(
        {
          length: k,
        },
        (_, j) => j <= i + (corner === 'right' ? k - q : 0),
      ),
  );
}
export function referenceCases() {
  const cases = [
    {
      label: 'Square',
      scores: [
        [1, 0],
        [0, 1],
      ],
      values: [10, 20],
      mask: [
        [true, true],
        [true, true],
      ],
    },
    {
      label: 'Cached decode',
      scores: [[1, 2, 3]],
      values: [2, 4, 8],
      mask: [[true, true, true]],
    },
    {
      label: 'Empty row',
      scores: [[1, 2]],
      values: [10, 20],
      mask: [[false, false]],
    },
    {
      label: 'Packed boundary',
      scores: [
        [1, 2, 9, 8],
        [9, 8, 1, 2],
      ],
      values: [10, 20, 100, 200],
      mask: [
        [true, true, false, false],
        [false, false, true, true],
      ],
    },
  ];
  return cases.map((test) => {
    const dense = test.scores.map((row, r) => {
      const permitted = row.filter((_, j) => test.mask[r][j]);
      if (!permitted.length) return 0;
      const max = Math.max(...permitted),
        weights = row.map((v, j) => (test.mask[r][j] ? Math.exp(v - max) : 0));
      return sum(weights.map((v, j) => v * test.values[j])) / sum(weights);
    });
    const tiled = test.scores.map((row, r) => {
      let m = -Infinity,
        l = 0,
        u = 0;
      for (let j = 0; j < row.length; j++) {
        if (!test.mask[r][j]) continue;
        const next = Math.max(m, row[j]),
          alpha = l ? Math.exp(m - next) : 0,
          weight = Math.exp(row[j] - next);
        l = l * alpha + weight;
        u = u * alpha + weight * test.values[j];
        m = next;
      }
      return l ? u / l : 0;
    });
    const error = Math.max(...dense.map((v, i) => Math.abs(v - tiled[i])));
    return {
      ...test,
      dense,
      tiled,
      error,
      passed: error < 1e-12,
    };
  });
}
export const clamp = (v) => Math.max(0, Math.min(1, v));
export function gradientFixture() {
  const z = summary(4),
    p = scores.map((v) => Math.exp(v - z.lse)),
    dP = values.map((v) => v[0] - v[1]),
    D = sum(p.map((v, i) => v * dP[i])),
    dS = p.map((v, i) => v * (dP[i] - D));
  return {
    ...z,
    p,
    dP,
    D,
    dS,
    dQ: sum(dS.map((v, i) => v * scores[i])),
    dK: dS,
    dV: p.map((v) => [v, -v]),
  };
}
export function meanMask(mask, row = [10, 20, 30, 40, 50]) {
  return mask.map((m) => {
    const allowed = row.filter((_, i) => m[i]);
    return allowed.length ? sum(allowed) / allowed.length : 0;
  });
}
export function localMask(q, k, left, right) {
  return Array.from(
    {
      length: q,
    },
    (_, i) =>
      Array.from(
        {
          length: k,
        },
        (_, j) => j >= Math.max(0, i + k - q - left) && j <= Math.min(k - 1, i + k - q + right),
      ),
  );
}
export function packedAverage(cut) {
  return sum(packedValues.slice(0, cut)) / cut;
}
