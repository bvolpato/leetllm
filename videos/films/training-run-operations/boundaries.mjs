export const trainingRun = {
  step: 1840,
  replicas: 4,
  sequences: 2,
  rounds: 8,
  finished: 5,
};
export const drillRun = {
  step: 73,
  replicas: 2,
  sequences: 3,
  rounds: 4,
  finished: 2,
};

// These two fixtures have equal microbatches and no skipped updates.
export function boundary(run) {
  const perRound = run.replicas * run.sequences;
  const perUpdate = perRound * run.rounds;
  const saved = run.step * perUpdate;
  const pending = perRound * run.finished;
  return { perRound, perUpdate, saved, pending, live: saved + pending };
}

export function canFinish(grace, window, save, margin) {
  return window + save + margin <= grace;
}

// Sample IDs in the next window of the drill's deterministic global order.
const drillIds = [
  42, 17, 63, 8, 91, 34, 76, 12, 85, 24, 57, 19, 55, 28, 70, 16, 82, 39, 61, 20, 45, 93, 11, 52,
];
export function nextDrillGroup(consumed) {
  const { saved, perRound } = boundary(drillRun);
  const start = consumed - saved;
  if (!Number.isInteger(start) || start < 0 || start + perRound > drillIds.length)
    throw new RangeError('Cursor outside the supplied drill window');
  return drillIds.slice(start, start + perRound);
}
