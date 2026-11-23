import { gelu, phase, sum } from './arithmetic.mjs';
import { context, down, ids, input, order, sizes, up } from './fixtures.mjs';
import { checkpointLayout, expertSkewTrace, forwardWave } from './construction.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export function coords(rank) {
  const out = {};
  for (const axis of order) {
    out[axis] = rank % sizes[axis];
    rank = Math.floor(rank / sizes[axis]);
  }
  return out;
}
export function rankOf(c) {
  let rank = 0,
    stride = 1;
  for (const axis of order) {
    rank += c[axis] * stride;
    stride *= sizes[axis];
  }
  return rank;
}
export function group(rank, axis) {
  const c = coords(rank);
  return Array.from(
    {
      length: sizes[axis],
    },
    (_, value) =>
      rankOf({
        ...c,
        [axis]: value,
      }),
  );
}
export function mlp() {
  const pre = up[0].map((_, j) => sum(input.map((v, i) => v * up[i][j]))),
    activated = pre.map(gelu),
    partials = [0, 1].map((rank) =>
      [0, 1].map((j) => sum([0, 1].map((k) => activated[rank * 2 + k] * down[rank * 2 + k][j]))),
    ),
    output = [0, 1].map((j) => sum(partials.map((row) => row[j]))),
    serial = [0, 1].map((j) => sum(activated.map((v, k) => v * down[k][j])));
  return {
    pre,
    activated,
    partials,
    output,
    serial,
  };
}
export const full = context.flat();
export function sampleModel(id, state) {
  if (newSceneIds.has(id)) return newChapterModel(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro')
    return {
      ...base,
      focus: b,
      axes: ['Layer width', 'Layer depth', 'Sequence / examples'],
    };
  if (id === 'mesh') {
    const axis = ['tp', 'pp', 'dp'][b];
    return {
      ...base,
      axis,
      peers: group(3, axis),
      coordinate: coords(3),
      world: Object.values(sizes).reduce((a, v) => a * v, 1),
    };
  }
  if (id === 'tensor')
    return {
      ...base,
      ...mlp(),
      partialReady: b === 2 || (b === 1 && q >= 0.65),
      sumReady: b === 2,
    };
  if (id === 'pipeline') {
    const dp = b === 2 ? 8 : 4;
    const wave = forwardWave(b === 0 ? 1 : 64 / (2 * dp));
    return {
      ...base,
      ...wave,
      duration: wave.ticks,
      time: wave.ticks * q,
      dp,
    };
  }
  if (id === 'context') {
    const means = context.map((xs) => sum(xs) / xs.length),
      weights = context.map((xs) => xs.length / full.length);
    return {
      ...base,
      means,
      weights,
      global: sum(full) / full.length,
      merged: sum(means.map((v, i) => v * weights[i])),
    };
  }
  if (id === 'experts')
    return {
      ...base,
      outputs: [
        [2, 0],
        [0, 4],
      ],
      weights: [0.75, 0.25],
      combined: [1.5, 1],
      attentionWorld: 4 * 2 * 8 * 4,
      expertWorld: 1 * 64 * 1 * 4,
    };
  if (id === 'optimizer') {
    const d = [2, 4, 8][b],
      tokenGradients = [[10], [0, 0, 0]],
      localMeans = tokenGradients.map((values) => sum(values) / values.length),
      tokenCount = sum(tokenGradients.map((values) => values.length));
    return {
      ...base,
      d,
      replicated: 6,
      sharded: 12 / d,
      total: 6 + 12 / d,
      tokenGradients,
      localMeans,
      tokenCount,
      wrongGradient: sum(localMeans) / localMeans.length,
      tokenGradient: sum(tokenGradients.flat()) / tokenCount,
    };
  }
  return { ...base, ...checkpointLayout(b === 1 ? 2 : null) };
}
export const newSceneIds = new Set([
  'diagnosis',
  'source-contract',
  'small-lattice',
  'rank-algorithm',
  'stored-shapes',
  'backward-bias',
  'microbatch-budget',
  'data-ownership',
  'sequence-role',
  'expert-capacity',
  'folded-grid',
  'objective-weighting',
  'optimizer-step',
  'resume-state',
  'checkpoint-formats',
  'precision-recipes',
  'mfu-receipt',
  'measured-trace',
  'research-ownership',
  'fit-boundary',
  'earned-return',
]);
export function meshCoordinate(rank, shape) {
  assert(
    Number.isInteger(rank) && rank >= 0 && rank < Object.values(shape).reduce((a, b) => a * b, 1),
  );
  const out = {};
  for (const [k, n] of Object.entries(shape)) {
    out[k] = rank % n;
    rank = Math.floor(rank / n);
  }
  return out;
}
export function largerMlp() {
  const H = 8,
    I = 16,
    TP = 4,
    x = Array.from(
      {
        length: H,
      },
      (_, j) => ((j % 5) - 2) / 4,
    ),
    a = Array.from(
      {
        length: H,
      },
      (_, i) =>
        Array.from(
          {
            length: I,
          },
          (_, j) => (((i + 1) * (j + 3)) % 7) / 10,
        ),
    ),
    z = Array.from(
      {
        length: I,
      },
      (_, i) =>
        Array.from(
          {
            length: H,
          },
          (_, j) => (((i + 2) * (j + 1)) % 5) / 10,
        ),
    ),
    h = Array.from(
      {
        length: I,
      },
      (_, j) => gelu(sum(x.map((v, i) => v * a[i][j]))),
    ),
    partials = Array.from(
      {
        length: TP,
      },
      (_, r) =>
        Array.from(
          {
            length: H,
          },
          (_, j) => sum(h.slice(r * 4, r * 4 + 4).map((v, i) => v * z[r * 4 + i][j])),
        ),
    ),
    output = Array.from(
      {
        length: H,
      },
      (_, j) => sum(partials.map((p) => p[j])),
    ),
    serial = Array.from(
      {
        length: H,
      },
      (_, j) => sum(h.map((v, i) => v * z[i][j])),
    );
  return {
    x,
    a,
    z,
    h,
    partials,
    output,
    serial,
  };
}
export function ownedSgd() {
  const w = [1, 2, 3, 4],
    rows = [
      [1, 3, 5, 7],
      [3, 5, 7, 9],
    ],
    gradient = w.map((_, i) => sum(rows.map((r) => r[i])) / rows.length);
  return {
    w,
    rows,
    gradient,
    owned: [gradient.slice(0, 2), gradient.slice(2)],
    updated: w.map((v, i) => v - 0.1 * gradient[i]),
  };
}
export function momentumReceipt(weight, velocity, input, target, eta = 0.1, mu = 0.5) {
  const prediction = weight * input,
    gradient = (prediction - target) * input,
    nextVelocity = mu * velocity + gradient;
  return {
    weight,
    velocity,
    input,
    target,
    prediction,
    gradient,
    nextVelocity,
    nextWeight: weight - eta * nextVelocity,
  };
}
export function expertCapacityReceipt(capacity = 4) {
  const trace = expertSkewTrace(1),
    counts = new Map(),
    kept = [],
    dropped = [];
  for (const [token, pair] of trace.assignments.entries())
    for (const expert of pair) {
      const count = counts.get(expert) ?? 0;
      counts.set(expert, count + 1);
      (count < capacity ? kept : dropped).push({
        token,
        expert,
      });
    }
  return {
    ...trace,
    capacity,
    kept,
    dropped,
    affectedTokens: [...new Set(dropped.map((v) => v.token))],
  };
}
export function newChapterModel(id, state) {
  assert(newSceneIds.has(id), 'Unknown Megatron chapter ' + id);
  const b = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  return {
    id,
    b,
    p,
    mlp: id === 'stored-shapes' ? largerMlp() : undefined,
    sgd: ['objective-weighting', 'optimizer-step'].includes(id) ? ownedSgd() : undefined,
    full: id === 'resume-state' ? momentumReceipt(2, 0.4, 1, 1) : momentumReceipt(1.5, 0.8, 2, 2),
    reset: id === 'resume-state' ? momentumReceipt(2, 0, 1, 1) : momentumReceipt(1.5, 0, 2, 2),
    stale: momentumReceipt(1.5, 0.8, 1, 2),
  };
}
export function trainingSchedule() {
  return [
    ['stage 0', 'F0', 'F1', 'wait', 'B0', 'F2', 'B1', 'F3', 'B2', 'wait', 'B3'],
    ['stage 1', 'wait', 'F0', 'B0', 'F1', 'B1', 'F2', 'B2', 'F3', 'B3', 'done'],
  ];
}
