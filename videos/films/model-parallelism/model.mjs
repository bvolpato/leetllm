import { mergeMass, parallelMLP } from './arithmetic.mjs';
import { B, W, X } from './fixtures.mjs';
import { multiplyMatrices, smoothstep } from 'vizmatic';
export function shards() {
  const y = multiplyMatrices(X, W)[0],
    left = y.slice(0, 2),
    right = y.slice(2),
    first = multiplyMatrices([left], B.slice(0, 2))[0],
    second = multiplyMatrices([right], B.slice(2))[0];
  return {
    y,
    left,
    right,
    first,
    second,
    total: first.map((v, i) => v + second[i]),
  };
}
export function introWeightLayout(progress) {
  const horizontal = smoothstep(progress * 2),
    vertical = smoothstep(progress * 2 - 1);
  return Array.from(
    {
      length: 8,
    },
    (_, i) => {
      const old = {
          x: 390 + Math.floor(i / 4) * 780 + (i % 2) * 140,
          y: 590 + Math.floor((i % 4) / 2) * 130,
        },
        next = {
          x: 260 + Math.floor(i / 2) * 400 + (i % 2) * 130,
          y: 640,
        };
      return {
        x: old.x + (next.x - old.x) * horizontal,
        y: old.y + (next.y - old.y) * vertical,
        width: 100,
        height: 90,
      };
    },
  );
}
export const mpReference = parallelMLP();
export const mpFresh = parallelMLP([-1, 3]);
export function attentionExample(boost) {
  const scores = [1000, 1000, 1000 + (boost ? Math.log(2) : 0)];
  const values = [0, 0, 9];
  const merged = mergeMass([
    { scores: scores.slice(0, 2), values: values.slice(0, 2) },
    { scores: scores.slice(2), values: values.slice(2) },
    { scores: [], values: [] },
  ]);
  const weights = scores.map((s) => Math.exp(s - merged.maximum));
  return { scores, values, weights, shares: weights.map((w) => w / merged.mass), ...merged };
}
export function columnTeachingState(state) {
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const seconds = Number.isFinite(state.t) ? state.t - 17.536 : progress * 16.488;
  const result = shards(),
    slices = [result.left, result.right];
  const joined = slices.flat(),
    count =
      beat === 1
        ? Math.min(
            joined.length,
            Math.floor(joined.length * smoothstep((seconds - 5.9625) / (9.3875 - 5.9625)) + 1e-9),
          )
        : 0;
  return {
    mode: beat === 0 ? 'local-products' : beat === 1 ? 'concatenation' : 'local-activation',
    slices,
    joined,
    count,
    visibleJoined: joined.slice(0, count),
    activated: slices.map((slice) => slice.map((value) => Math.max(0, value))),
  };
}
