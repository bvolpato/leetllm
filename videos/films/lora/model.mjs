import assert from 'node:assert/strict';
import { EXAMPLE, NF4_LEVELS } from './fixtures.mjs';
import { matvec, matmul } from './arithmetic.mjs';
export function forward(scale = 1, x = EXAMPLE.x) {
  const intermediate = matvec(EXAMPLE.A, x);
  const base = matvec(EXAMPLE.W, x);
  const correction = matvec(EXAMPLE.B, intermediate).map((value) => value * scale);
  const update = matmul(EXAMPLE.B, EXAMPLE.A).map((row) => row.map((value) => value * scale));
  const merged = EXAMPLE.W.map((row, i) => row.map((value, j) => value + update[i][j]));
  return {
    intermediate,
    base,
    correction,
    update,
    merged,
    output: base.map((value, i) => value + correction[i]),
  };
}
export function learningSteps() {
  let a = 1,
    b = 0;
  return Array.from(
    {
      length: 3,
    },
    (_, step) => {
      const output = a * b,
        gradient = output - 1;
      const gradA = b * gradient,
        gradB = a * gradient;
      const snapshot = {
        step,
        a,
        b,
        output,
        loss: (output - 1) ** 2 / 2,
        gradA,
        gradB,
      };
      a -= 0.1 * gradA;
      b -= 0.1 * gradB;
      return snapshot;
    },
  );
}
export function adapterGradients({ A, B, x, g, scale = 1 }) {
  const z = matvec(A, x);
  const back = A.map((_, k) => B.reduce((value, row, i) => value + row[k] * g[i], 0));
  return {
    z,
    gradB: g.map((value) => z.map((coefficient) => scale * value * coefficient)),
    gradA: back.map((value) => x.map((coordinate) => scale * value * coordinate)),
  };
}
export function nf4Block(weights) {
  assert(weights.length && weights.every(Number.isFinite));
  const scale = Math.max(...weights.map(Math.abs));
  const normalized = weights.map((value) => (scale === 0 ? 0 : value / scale));
  const codes = normalized.map((value) =>
    NF4_LEVELS.reduce(
      (best, candidate, i) =>
        Math.abs(value - candidate) < Math.abs(value - NF4_LEVELS[best]) ? i : best,
      0,
    ),
  );
  return {
    scale,
    normalized,
    codes,
    decoded: codes.map((code) => scale * NF4_LEVELS[code]),
  };
}
export function doraRow(v, magnitude, x) {
  assert.equal(v.length, x.length);
  const norm = Math.hypot(...v);
  assert(norm > 0 && Number.isFinite(norm));
  const dot = v.reduce((total, value, i) => total + value * x[i], 0);
  const detached = x.map((value) => (magnitude * value) / norm);
  return {
    norm,
    output: (magnitude * dot) / norm,
    detached,
    full: detached.map((value, i) => value - (magnitude * dot * v[i]) / norm ** 3),
    weight: v.map((value) => (magnitude * value) / norm),
  };
}
export const rotationPolicy = {
  minimumDays: 90,
  overdue: { id: 'P04', days: 92 },
  routine: { id: 'R07', days: 12 },
};

// These are supplied evaluation outcomes for two separate twenty-ticket sets.
const policyMisses = ['P20'];
const routineMisses = [rotationPolicy.routine.id, 'R20'];
export function policyEvaluation(repairedTicket) {
  const rows = [policyMisses, routineMisses].map((misses, i) => {
    const cases = Array.from({ length: 20 }, (_, j) => {
      const id = (i === 0 ? 'P' : 'R') + String(j + 1).padStart(2, '0');
      return { id, correct: !misses.includes(id) || repairedTicket === id };
    });
    const correct = cases.filter((ticket) => ticket.correct).length;
    return { cases, correct, rate: correct / cases.length };
  });
  const minimum = 0.95;
  return {
    rows,
    minimum,
    pooled: rows.reduce((n, row) => n + row.correct, 0),
    deploy: rows.every((row) => row.rate >= minimum),
  };
}

export function trainingInventory(activationGB, adapterGB = 1) {
  const parts = [
    { label: 'Frozen weights', gb: 16, color: 'blue' },
    { label: 'Buffers', gb: 4, color: 'muted' },
    { label: 'Activations', gb: activationGB, color: 'cyan' },
    { label: 'Adapter state', gb: adapterGB, color: 'yellow' },
  ];
  return { parts, total: parts.reduce((n, part) => n + part.gb, 0), capacity: 32 };
}

export function policyRequest(x = [2, 1]) {
  const W = [[-1, 1]],
    A = [[1, -0.5]],
    B = [[0.5]],
    scale = 2;
  const base = matvec(W, x)[0],
    z = matvec(A, x)[0],
    correction = scale * B[0][0] * z;
  const evaluation = policyEvaluation();
  return {
    W,
    A,
    B,
    scale,
    x,
    base,
    z,
    unscaled: B[0][0] * z,
    correction,
    output: base + correction,
    escalate: base + correction >= 0,
    policy: evaluation.rows[0].rate,
    regression: evaluation.rows[1].rate,
    minimum: evaluation.minimum,
    deploy: evaluation.deploy,
  };
}
export function rectangularExample(progress = 1) {
  const W = [
    [1, 0, -0.5, 0.25],
    [0, 1, 0.5, -0.25],
    [0.5, -0.5, 1, 0],
  ];
  const A = Array.from(
    {
      length: 2,
    },
    (_, i) =>
      Array.from(
        {
          length: 4,
        },
        (_, j) => 0.02 * (((i * 4 + j) % 7) - 3),
      ),
  );
  const B = [
      [progress, 0],
      [0, 0],
      [0, -0.5 * progress],
    ],
    x = [1, -0.5, 0.25, 2];
  const z = matvec(A, x),
    base = matvec(W, x),
    correction = matvec(B, z).map((v) => 2 * v);
  const update = matmul(B, A).map((row) => row.map((v) => 2 * v));
  return {
    W,
    A,
    B,
    x,
    z,
    base,
    correction,
    update,
    merged: W.map((row, i) => row.map((v, j) => v + update[i][j])),
    output: base.map((v, i) => v + correction[i]),
  };
}
export function projectionBudget(width = 4096, mlp = 11008, kv = width, rank = 16) {
  const shapes = [
    [width, width],
    [kv, width],
    [kv, width],
    [width, width],
    [mlp, width],
    [mlp, width],
    [width, mlp],
  ];
  return shapes.map(([out, input], i) => ({
    name: ['q', 'k', 'v', 'o', 'gate', 'up', 'down'][i],
    out,
    input,
    a: rank * input,
    b: rank * out,
    count: rank * (input + out),
  }));
}
export function rotatedPlane(progress) {
  const first = [1, 0.3, 0.2],
    original = [-0.25, 1, -0.4],
    target = [0.5, 0.5, 1.7];
  const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const norm = Math.hypot(...first),
    axis = first.map((v) => v / norm),
    along = dot(original, axis);
  const perpendicular = original.map((v, i) => v - along * axis[i]);
  const targetAlong = dot(target, axis),
    desired = target.map((v, i) => v - targetAlong * axis[i]);
  const angle = Math.atan2(dot(axis, cross(perpendicular, desired)), dot(perpendicular, desired));
  const theta = angle * progress,
    side = cross(axis, perpendicular);
  const second = axis.map(
    (v, i) => along * v + Math.cos(theta) * perpendicular[i] + Math.sin(theta) * side[i],
  );
  const c2 = Math.hypot(...desired) / Math.hypot(...perpendicular),
    c1 = (targetAlong - along * c2) / norm;
  return {
    first,
    second,
    target,
    c1,
    c2,
    angle,
  };
}
export function validateModel() {
  const f = forward(2);
  assert.deepEqual(f.base, [4, 10]);
  assert.deepEqual(f.intermediate, [1]);
  assert.deepEqual(f.correction, [1, 2]);
  assert.deepEqual(f.output, [5, 12]);
  assert.deepEqual(matvec(f.merged, EXAMPLE.x), f.output);
  const equal = forward(2, [1, 1]);
  assert.deepEqual(equal.correction, [0, 0]);
  assert.deepEqual(equal.output, [3, 7]);
  assert.deepEqual(matvec(equal.merged, [1, 1]), equal.output);
  const steps = learningSteps();
  assert.equal(Math.abs(steps[0].gradA), 0);
  assert.equal(steps[0].gradB, -1);
  assert.equal(steps[1].b, 0.1);
  assert(steps[1].loss < steps[0].loss);
  assert(steps[1].gradA < 0);
  assert.equal((16 * (4096 + 4096)) / 4096 ** 2, 0.0078125);
  const rectangular = rectangularExample();
  rectangular.output.forEach((v, i) => assert(Math.abs(v - [1.285, -0.875, 1.105][i]) < 1e-12));
  matvec(rectangular.merged, rectangular.x).forEach((v, i) =>
    assert(Math.abs(v - rectangular.output[i]) < 1e-12),
  );
  assert.equal(
    projectionBudget().reduce((n, row) => n + row.count, 0),
    1249280,
  );
  assert.equal(
    projectionBudget(16, 32, 8, 2).reduce((n, row) => n + row.count, 0),
    512,
  );
  assert.deepEqual(nf4Block([-0.2, 0, 0.2, 2]).codes, [6, 7, 8, 15]);
  assert.equal(policyRequest().deploy, false);
  for (const [repair, expected, passes] of [
    [undefined, [19, 18], false],
    ['P20', [20, 18], false],
    ['R07', [19, 19], true],
  ]) {
    const evaluation = policyEvaluation(repair);
    assert.deepEqual(
      evaluation.rows.map((row) => row.correct),
      expected,
    );
    assert.equal(evaluation.deploy, passes);
  }
  assert.deepEqual(
    [trainingInventory(8), trainingInventory(13), trainingInventory(13, 0.5)].map(
      (sample) => sample.total,
    ),
    [29, 34, 33.5],
  );
  const dora = doraRow([3, 4], 5, [1, 0]);
  assert.equal(dora.output, doraRow([6, 8], 5, [1, 0]).output);
  assert(Math.abs(3 * dora.full[0] + 4 * dora.full[1]) < 1e-12);
  assert.equal(3 * dora.detached[0] + 4 * dora.detached[1], 3);
  return true;
}
