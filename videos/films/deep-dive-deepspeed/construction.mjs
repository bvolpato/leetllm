import { adam, clamp, sum } from './arithmetic.mjs';
export function sentence(state, id, beat, index) {
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  return clamp(state.cues?.[`ds-${id}-b${beat}-s${index}`]?.progress ?? state.beatP);
}
export const complete = (state, id, beat, index) => sentence(state, id, beat, index) === 1;
export function memoryRecipe(P, N, p, g, o, stage) {
  const parts = [
    (P * p) / (stage >= 3 ? N : 1),
    (P * g) / (stage >= 2 ? N : 1),
    (P * o) / (stage >= 1 ? N : 1),
  ];
  return {
    parts,
    total: sum(parts),
  };
}
export function paddedWorkingSet(lengths, ranks, live) {
  const shards = lengths.map((n) => Math.ceil(n / ranks)),
    padded = shards.map((n) => n * ranks);
  const resident = sum(shards),
    gathered = sum(live.map((i) => padded[i]));
  return {
    shards,
    padded,
    resident,
    gathered,
    total: resident + gathered,
  };
}
export function tokenObjective(means, counts) {
  const count = sum(counts),
    weights = counts.map((n) => n / count);
  return {
    count,
    weights,
    mean: sum(means.map((v, i) => v * weights[i])),
    equalRank: sum(means) / means.length,
  };
}
export function ringSends(elements, ranks, collectives) {
  return ((elements * (ranks - 1)) / ranks) * collectives;
}
export function accumulationContract(backwards, steps, size, managed) {
  return {
    backwards,
    microsteps: managed ? steps : backwards,
    updates: managed ? Math.floor(steps / size) : steps,
  };
}
export function gradientGate(completeWindow, receipts) {
  const ready =
    completeWindow &&
    receipts.length === 2 &&
    receipts.every((value) => typeof value === 'number' && Number.isFinite(value));
  return {
    ready,
    gradient: ready ? sum(receipts) / receipts.length : null,
    next: ready ? adam([1, 0, 0], sum(receipts) / receipts.length, 1) : [1, 0, 0],
  };
}
