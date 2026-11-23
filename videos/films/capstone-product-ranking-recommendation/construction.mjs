import { clip, dcg, sum } from './arithmetic.mjs';
import { ORDERING_PRODUCTS } from './fixtures.mjs';
import { TRAINING_PAIRS } from './training-data.mjs';
import { relevantRecall, update } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'before',
    snapshot: 0,
  },
  cues: [
    {
      id: 'after',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export function orderingFrame(beat, progress) {
  const seconds = progress * [18.534, 17.602][beat],
    ramp = (a, z) => clip((seconds - a) / (z - a));
  const movement = beat === 0 ? 0 : ramp(7.8, 9.85),
    committed = movement === 1;
  const targets = [2, 0, 1],
    rows = ORDERING_PRODUCTS.map((row, index) => {
      const rank = (committed ? targets[index] : index) + 1,
        gain = 2 ** row.grade - 1,
        discount = Math.log2(rank + 1);
      return {
        ...row,
        rank,
        slot: index + (targets[index] - index) * movement,
        gain,
        discount,
        contribution: gain / discount,
      };
    });
  const gainReady = beat > 0 || seconds >= 11.9,
    discountCount = beat > 0 ? 3 : Math.min(3, Math.floor(ramp(12.1, 14.35) * 3 + 1e-9)),
    discountReady = discountCount === 3;
  const currentDcg = sum(rows.map((row) => row.contribution)),
    idealDcg = dcg([3, 2, 1]);
  return {
    seconds,
    movement,
    committed,
    rows,
    gainReady,
    discountCount,
    discountReady,
    idealReady: beat > 0 || seconds >= 16.8,
    normalizationReady: beat > 0 && seconds >= 3.15,
    inTransit: movement > 0 && movement < 1,
    currentDcg,
    idealDcg,
    ndcg: currentDcg / idealDcg,
    predict: beat === 1 && seconds >= 4.3 && seconds < 7.8,
  };
}
export function recallSnapshot(beat, progress) {
  const removal = beat > 0 ? 1 : clip((progress - 0.03) / 0.14);
  const removed = removal === 1;
  const settle = beat > 0 ? 1 : clip((progress - 0.17) / 0.21);
  return {
    removal,
    removed,
    grades: removed ? [3, 1] : [3, 2, 1],
    kept: removed ? ['P5', 'P4'] : ['P5', 'P6', 'P4'],
    p4x: 1270 - 530 * settle,
  };
}
export function sampleModel(id, state) {
  const b = track.sample({
      ...state,
      beatP: Math.min(state.beatP ?? 0, 1 - Number.EPSILON),
    }).snapshot,
    p = clip(((state.beatP ?? 0) - 0.08) / 0.7),
    q = b ? 1 : p,
    timelineProgress = id === 'time' ? (state.beat === 0 ? p : 1) : p;
  let w = [1, 0];
  const trainingProgress =
    id === 'pairwise' ? (b ? (state.cues?.['pairwise-b2-2']?.progress ?? p) : 0) : q;
  const n = Math.floor(12 * trainingProgress);
  for (let i = 0; i < n; i++) w = update(w);
  const scores = [
    [0.85, 0.9],
    [0.95, 0.3],
  ].map((x) => sum(x.map((v, i) => v * w[i])));
  const recall = recallSnapshot(b, state.beatP ?? 0);
  return {
    b,
    p,
    q,
    shortlistCount: q < 0.12 ? 0 : q < 0.43 ? 1 : q < 0.78 ? 2 : 3,
    timelineProgress,
    pendingWindowDay: 4 + 1.5 * timelineProgress,
    w,
    n,
    scores,
    positions: [2 * q, 1 - q, 2 - q],
    ...recall,
    recall: relevantRecall(recall.kept),
  };
}
export function pairGradientPrefix(progress) {
  const position = 9 * clip(progress),
    completed = Math.min(9, Math.floor(position)),
    fraction = position - completed;
  const sum = [0, 0];
  for (let i = 0; i < completed; i++)
    for (let j = 0; j < 2; j++) sum[j] -= TRAINING_PAIRS[i].difference[j] / 2;
  if (completed < 9)
    for (let j = 0; j < 2; j++) sum[j] -= (TRAINING_PAIRS[completed].difference[j] * fraction) / 2;
  return {
    completed,
    fraction,
    sum,
    current: completed < 9 ? TRAINING_PAIRS[completed] : null,
  };
}
