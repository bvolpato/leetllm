import {
  perRank,
  recipeLedger,
  reduceScatter,
  pipelineSchedule,
  onlineAttention,
} from '../../../films/fsdp-zero/model.mjs';
import { GRADIENT_CONTRIBUTIONS } from '../../../films/fsdp-zero/fixtures.mjs';
import { sum, clamp } from './studio.mjs';
export { perRank, recipeLedger, pipelineSchedule, onlineAttention };
export const letters = ['A', 'B', 'C', 'D'];
export const bytes = [2, 2, 4, 4, 4];
export const ranks = [0, 1, 2, 3];
export const portGBps = (gigabitsPerSecond) => gigabitsPerSecond / 8;
export function budget(params, group, stage, extra = 0) {
  const { parts, total } = recipeLedger(params, group, stage);
  return {
    parts: Object.values(parts),
    state: total,
    extra,
    peak: total + extra,
    free: 80 - total - extra,
  };
}
export function columns(changed) {
  const rows = GRADIENT_CONTRIBUTIONS.map((row) => [...row]);
  if (changed) rows[3][2] = 9;
  return { rows, values: reduceScatter(rows) };
}
export const targets = [[1], [3, 3, 3]];
export function objective() {
  const counts = targets.map((r) => r.length),
    gradients = targets.map((r) => sum(r.map((y) => -2 * y)) / r.length);
  const factors = counts.map((n) => (counts.length * n) / sum(counts));
  return {
    counts,
    gradients,
    factors,
    uniform: sum(gradients) / counts.length,
    corrected: sum(gradients.map((g, i) => g * factors[i])) / counts.length,
  };
}
export function storeWeight(down) {
  const master = Math.fround(1 - down);
  const rounded = (gap) => 1 - Math.round((1 - master) / gap) * gap;
  return [master, rounded(2 ** -11), rounded(2 ** -8)];
}
export function gatherState(launch, time) {
  const ready = launch + 4;
  const transferred = clamp((time - launch) / 4);
  return {
    launch,
    time,
    ready,
    transferred,
    remaining: 4 * (1 - transferred),
    first: time < 6,
    second: time >= ready,
    wait: Math.max(ready - 6, 0),
    weights: 3.5 * (Number(time < 6) + Number(time >= ready)),
  };
}
export function adam(gradients) {
  let m = 0,
    v = 0,
    t = 0,
    delta = 0;
  for (const g of gradients) {
    m = 0.5 * m + 0.5 * g;
    v = 0.5 * v + 0.5 * g * g;
    t++;
    delta = (-0.1 * (m / (1 - 0.5 ** t))) / Math.sqrt(v / (1 - 0.5 ** t));
  }
  return { m, v, t, delta };
}
export function lifetimes(phase) {
  return [1, 2, Number(phase === 1 || phase === 2) * 2, [0, 0, 4, 4, 1, 1, 0][phase]];
}
export const shardGroupSize = 8;
export function afterForward(policy) {
  if (policy === true) return { retained: 0, gatherRanks: shardGroupSize };
  if (policy === false) return { retained: 1, gatherRanks: 0 };
  return { retained: 1 / policy, gatherRanks: policy };
}
export const mesh = { dp: 8, tp: 4, pp: 2, cp: 2, micro: 1, accum: 4 };
export const partials = [
  [1, 4],
  [2, -1],
].map((row, i) => row.map((v) => v * [2, 3][i]));
export const output = partials[0].map((v, i) => v + partials[1][i]);
export function peakParts(activations) {
  return [2, 1.5, 0.5, activations];
}
export const attention = onlineAttention();
export const schedules = [pipelineSchedule(4, 8, false), pipelineSchedule(4, 8, true)];
