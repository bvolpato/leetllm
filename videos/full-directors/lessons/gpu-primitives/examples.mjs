import {
  blellochTrace,
  exclusive,
  hierarchyCounts,
  onlineSoftmax,
  reductionLevels,
  scanLevels,
  scanWork,
} from '../../../films/gpu-primitives/arithmetic.mjs';
import { ARTICLE_INPUT } from '../../../films/gpu-primitives/fixtures.mjs';
export { exclusive, scanWork };
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export const widths = [3, 1, 4, 2];
export const ends = scanLevels(widths).levels;
export const starts = exclusive(widths);
export const strips = [4, 1, 7, 2, 5, 3, 6, 8];
export const tree = reductionLevels(strips);
export const plays = [...ARTICLE_INPUT];
export const downs = blellochTrace(plays.slice(0, 4));
export const blocks = [plays.slice(0, 4), plays.slice(4)];
export const totals = blocks.map(sum);
export const offsets = exclusive(totals);
export const locals = blocks.map(exclusive);
export const globalRows = locals.map((a, i) => a.map((v) => v + offsets[i]));
export const passes = [4194304, ...hierarchyCounts(4194304)];
export const metadata = [262144, 262145].map((n) => [n, ...hierarchyCounts(n)]);
export const flags = plays.map((v) => Number(v > 0));
export const dest = exclusive(flags);
export const packed = [];
plays.forEach((v, i) => {
  if (flags[i]) packed[dest[i]] = v;
});
export const boundaries = [0, 4, 4, 8];
export const groups = boundaries.slice(1).map((end, i) => plays.slice(boundaries[i], end));
export const leaders = [6, -1, 6];
export function argmax(a) {
  if (!a.length || !a.every(Number.isFinite)) throw RangeError('Expected a nonempty finite row');
  return a.reduce((best, v, i) => (v > a[best] ? i : best), 0);
}
export const laneValues = Array.from({ length: 32 }, (_, i) => Number(i < 26));
export function peer(values, active, lane, step) {
  const source = lane + step;
  if (source >= values.length) return { source, received: values[lane], add: false };
  return { source, received: active[source] ? values[source] : undefined, add: true };
}
export const alive = laneValues.map(() => true);
export const exited = alive.map((_, i) => i !== 26);
export const downStrides = [16, 8, 4, 2, 1];
export const warp = [laneValues];
for (const step of downStrides) {
  const prev = warp.at(-1);
  warp.push(
    prev.map((v, i) => {
      const p = peer(prev, alive, i, step);
      return p.add ? v + p.received : v;
    }),
  );
}
export const priorRecords = [
  { type: 'P', v: 7 },
  { type: 'A', v: 4 },
  { type: 'A', v: 3 },
];
export function lookBack(records) {
  let base = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].type === 'X') return null;
    base = records[i].v + base;
    if (records[i].type === 'P') return base;
  }
  return base;
}
export const f = Math.fround,
  large = f(100000000),
  residual = f(3.14);
export const raw = -large + residual,
  rounded = f(raw),
  left = f(f(large - large) + residual),
  right = f(large + rounded);
export const tolerance = 0.02,
  exampleRuns = [3.13, 3.15];
export const inTolerance = (value) => Math.abs(value - residual) <= tolerance;
export const max64 = (1n << 63n) - 1n;
export const logits = [2, 1, 4, 0];
export const chunks = [logits.slice(0, 2), logits.slice(2)];
export const states = chunks.map((row) => onlineSoftmax([row]));
export const common = Math.max(...states.map((s) => s.maximum));
export const masses = states.map((s) => s.denominator * Math.exp(s.maximum - common));
export const denom = sum(masses);
export const probs = logits.map((v) => Math.exp(v - common) / denom);
// Both logits in a chunk have the same value vector.
export const chunkValues = [[1, 0], [0, 1]];
export const weightedChunks = chunkValues.map((value, i) => value.map((v) => masses[i] * v));
export const numerator = weightedChunks[0].map((v, axis) => v + weightedChunks[1][axis]);
export const vector = numerator.map((v) => v / denom);
export const readBytes = 4,
  writeBytes = 8,
  items = 1024,
  micros = 3;
export const useful = items * (readBytes + writeBytes),
  rate = useful / micros / 1000;
export const lastRow = [3, 1, 4, 2, 5];
export const swapOrder = [0, 4, 2, 3, 1];
export function runsFor(order) {
  const lengths = order.map((i) => lastRow[i]);
  return {
    lengths,
    order,
    starts: exclusive(lengths),
    width: sum(lengths),
    base: sum(lengths.slice(0, 4)),
  };
}
export const before = runsFor(lastRow.map((_, i) => i)),
  after = runsFor(swapOrder);
