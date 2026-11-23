import { sum } from './arithmetic.mjs';
import { checkpointRow, context } from './fixtures.mjs';

export function checkpointLayout(lateRank = null) {
  const savedWidth = 2;
  const newWidth = 4;
  const shards = Array.from({ length: checkpointRow.length / savedWidth }, (_, rank) => ({
    offset: rank * savedWidth,
    values: checkpointRow.slice(rank * savedWidth, (rank + 1) * savedWidth),
  }));
  const available = shards.filter((_, rank) => rank !== lateRank);
  const reconstructed = Array(checkpointRow.length).fill(null);
  for (const { offset, values } of available) {
    reconstructed.splice(offset, values.length, ...values);
  }
  return {
    source: checkpointRow,
    savedWidth,
    newWidth,
    shards,
    available,
    reconstructed,
    target: [reconstructed.slice(0, newWidth), reconstructed.slice(newWidth)],
    complete: reconstructed.every((v) => v !== null),
  };
}

export function forwardWave(microbatches, stages = 2) {
  const ticks = microbatches + stages - 1;
  const slots = ticks * stages;
  const idle = slots - microbatches * stages;
  return { microbatches, stages, ticks, slots, idle, bubble: idle / slots };
}
export function contextMergeSnapshot(beat, p, receivedOverride) {
  const received =
      receivedOverride ??
      (beat === 0 ? 0 : beat > 1 ? 3 : Math.min(3, Math.floor(Math.max(0, p - 0.04) / 0.17))),
    local = context[0],
    remote = context[1].slice(0, received),
    count = local.length + remote.length,
    total = sum(local) + sum(remote);
  return {
    received,
    local,
    remote,
    count,
    total,
    value: total / count,
    complete: received === 3,
  };
}
export function expertSkewTrace(progress) {
  const balanced = [
      [2, 7],
      [4, 9],
      [2, 4],
      [2, 7],
      [7, 9],
      [4, 9],
      [2, 9],
      [7, 4],
    ],
    skewed = [
      [2, 7],
      [2, 4],
      [2, 9],
      [2, 7],
      [2, 4],
      [2, 9],
      [2, 7],
      [2, 4],
    ],
    changed = Math.floor(Math.max(0, Math.min(1, progress)) * 8),
    assignments = balanced.map((pair, i) => (i < changed ? skewed[i] : pair)),
    experts = [2, 7, 4, 9],
    counts = experts.map((expert) => assignments.filter((pair) => pair.includes(expert)).length);
  return {
    changed,
    assignments,
    experts,
    counts,
    tokens: 8,
    totalAssignments: counts.reduce((a, b) => a + b, 0),
  };
}
