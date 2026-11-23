import { regression, rows } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const motion = (p) => {
  const q = clamp((p - 0.12) / 0.7);
  return q * q * (3 - 2 * q);
};
export function exampleGradients(params = [0, 0, 0], features = rows.map((r) => r.x)) {
  return rows.map((r, i) => {
    const e = features[i][0] * params[0] + features[i][1] * params[1] + params[2] - r.y;
    return [2 * e * features[i][0], 2 * e * features[i][1], 2 * e];
  });
}
export function momentumFixture(
  mask = [
    [1, 0],
    [1, 1],
    [1, 1],
    [0, 0],
  ],
  params = [0, 0, 0],
  velocity = [0, 0, 0],
) {
  const features = rows.map((r, i) => r.x.map((v, j) => (v * mask[i][j]) / 0.75)),
    g = exampleGradients(params, features)[0].map(
      (_, j) => exampleGradients(params, features).reduce((a, r) => a + r[j], 0) / 4,
    ),
    nextVelocity = g.map((v, i) => 0.9 * velocity[i] + v),
    nextParams = params.map((v, i) => v - 0.05 * nextVelocity[i]);
  return {
    features,
    gradient: g,
    nextVelocity,
    nextParams,
    preLoss:
      rows.reduce(
        (a, r, i) =>
          a + (features[i][0] * params[0] + features[i][1] * params[1] + params[2] - r.y) ** 2,
        0,
      ) / 4,
  };
}
export function capturedCalls(calls) {
  const variants = new Map(),
    traces = [],
    results = [];
  for (const c of calls) {
    const key = JSON.stringify([c.length, c.dtype ?? 'float32', c.weak ?? false]);
    if (!variants.has(key)) {
      variants.set(key, {
        coefficient: c.global,
        id: String.fromCharCode(65 + variants.size),
      });
      traces.push(c.length);
    }
    const v = variants.get(key);
    results.push({
      length: c.length,
      global: c.global,
      captured: v.coefficient,
      variant: v.id,
      result: c.length * v.coefficient,
    });
  }
  return {
    traces,
    results,
  };
}
export function paddedReduction(losses, valid) {
  assert.equal(losses.length, valid.length);
  const sum = losses.reduce((a, v, i) => a + (valid[i] ? v : 0), 0),
    count = valid.filter(Boolean).length;
  return {
    sum,
    count,
    naive: losses.reduce((a, v) => a + v, 0) / losses.length,
    masked: sum / Math.max(1, count),
  };
}
export function doublingTraces(start = 1, threshold = 8, steps = 3) {
  const dynamic = [start],
    fixed = [start];
  while (dynamic.at(-1) < threshold && dynamic.length < 100) dynamic.push(dynamic.at(-1) * 2);
  for (let i = 0; i < steps; i++) fixed.push(fixed.at(-1) * 2);
  return {
    dynamic,
    fixed,
    derivative: 2 ** steps,
  };
}
export function weightPenalty(weights, lambda = 0.1) {
  return {
    value: lambda * weights.reduce((a, v) => a + v * v, 0),
    gradient: weights.map((v) => 2 * lambda * v),
    biasGradient: 0,
  };
}
export function regularizedHistory(lambda = 0.1, steps = 80) {
  const h = [
    {
      p: [0, 0, 0],
      mse: 3.75,
      objective: 3.75,
    },
  ];
  for (let i = 0; i < steps; i++) {
    const old = h.at(-1),
      g = regression(old.p).gradient.map((v, j) => v + (j < 2 ? 2 * lambda * old.p[j] : 0)),
      p = old.p.map((v, j) => v - 0.05 * g[j]),
      mse = regression(p).loss;
    h.push({
      p,
      mse,
      objective: mse + weightPenalty(p.slice(0, 2), lambda).value,
    });
  }
  return h;
}
export function projectionFixture() {
  const x = [1, 2],
    w = [
      [1, 2],
      [3, 4],
    ],
    output = w[0].map((_, j) => x.reduce((a, v, i) => a + v * w[i][j], 0)),
    transposed = w.map((row) => row.reduce((a, v, i) => a + v * x[i], 0));
  return {
    x,
    w,
    output,
    transposed,
  };
}
