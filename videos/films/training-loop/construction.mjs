import { cloneMatrix, firstDerivativeCue, secondDerivativeCue } from './arithmetic.mjs';
import { fitHistory, oneTrainingStep } from './model.mjs';
import { LR } from './fixtures.mjs';
import { scoreTicket } from './route-ruler.mjs';
import { finished } from './scene-clock.mjs';
import { stableSoftmax, createCueTrack } from 'vizmatic';
export function checkpointSnapshot(progress) {
  const live = [
      [0, 0],
      [0, 0],
    ],
    plain = live,
    copied = cloneMatrix(live);
  const amount = Math.max(0, Math.min(1, (progress - 0.5) / 0.32));
  for (const row of live) for (let i = 0; i < row.length; i++) row[i] += amount;
  return {
    live,
    plain,
    copied,
  };
}
export const stepTrack = createCueTrack({
  initial: {
    id: 'forward-loss',
    snapshot: {
      stage: 'forward and loss',
      weights: [
        [0, 0],
        [0, 0],
      ],
      gradient: null,
    },
  },
  cues: [
    {
      id: 'backward-gradient',
      beat: 1,
      at: 0,
      snapshot: {
        stage: 'backward',
        weights: [
          [0, 0],
          [0, 0],
        ],
        gradient: oneTrainingStep().gradient,
      },
    },
    {
      id: 'optimizer-update',
      beat: 2,
      at: 0,
      snapshot: {
        stage: 'optimizer step',
        weights: oneTrainingStep().updated,
        gradient: oneTrainingStep().gradient,
      },
    },
  ],
});
export const batchTrack = createCueTrack({
  initial: {
    id: 'first-four',
    snapshot: {
      name: 'Batch one',
      indices: [0, 1, 2, 3],
      count: 4,
    },
  },
  cues: [
    {
      id: 'final-two',
      beat: 1,
      at: 0,
      snapshot: {
        name: 'Final batch',
        indices: [4, 5],
        count: 2,
      },
    },
  ],
});
export const gradientTrack = createCueTrack({
  initial: {
    id: 'empty-gradient-buffer',
    snapshot: {
      stored: 0,
      backwardCalls: 0,
    },
  },
  cues: [
    {
      id: 'first-backward',
      beat: 0,
      at: firstDerivativeCue,
      snapshot: {
        stored: 2,
        backwardCalls: 1,
      },
    },
    {
      id: 'second-backward-adds',
      beat: 0,
      at: secondDerivativeCue,
      snapshot: {
        stored: 4,
        backwardCalls: 2,
      },
    },
    {
      id: 'clear-for-next-update',
      beat: 1,
      at: 0.3,
      snapshot: {
        stored: 0,
        backwardCalls: 0,
      },
    },
    {
      id: 'backward-in-new-window',
      beat: 2,
      at: 0.1,
      snapshot: { stored: 2, backwardCalls: 1 },
    },
  ],
});
export function modelSnapshot(scene, state) {
  if (scene === 'phases') {
    const held = stepTrack.sample({
      beat: state.beat ?? 0,
      beatP: state.beatP ?? 0,
    });
    const updateCue = state.cues?.['phases-beat-3-focus-1'];
    const progress =
      held.id === 'optimizer-update'
        ? Math.max(0, Math.min(1, updateCue?.progress ?? state.beatP ?? 0))
        : 0;
    const { weights, gradient } = held.snapshot;
    const animatedWeights =
      held.id === 'optimizer-update'
        ? weights.map((row) => row.map((value) => (progress === 0 ? 0 : value * progress)))
        : weights;
    return {
      ...held.snapshot,
      gradient: state.cues?.['phases-written']?.phase === 'before' ? null : gradient,
      weights: animatedWeights,
      cue: held.id,
    };
  }
  if (scene === 'tensors')
    return batchTrack.sample({
      beat: state.beat ?? 0,
      beatP: state.beatP ?? 0,
    }).snapshot;
  if (scene === 'accumulation') {
    if (state.cues?.['buffer-first']) {
      const cleared = finished(state, 'buffer-clear', 1, 0.3);
      const backwardCalls = cleared
        ? Number(finished(state, 'buffer-fresh', 2, 0.1))
        : Number(finished(state, 'buffer-first', 0, firstDerivativeCue)) +
          Number(finished(state, 'buffer-second', 0, secondDerivativeCue));
      return { stored: 2 * backwardCalls, backwardCalls };
    }
    return gradientTrack.sample({
      beat: state.beat ?? 0,
      beatP: state.beatP ?? 0,
    }).snapshot;
  }
  if (scene === 'fit-batch') {
    const beatProgress = (state.beat ?? 0) === 0 ? Math.max(0, Math.min(1, state.beatP ?? 0)) : 1;
    const progress = Math.max(0, Math.min(1, (beatProgress - 0.44) / 0.28));
    const updates = Math.round(120 * progress),
      current = fitHistory[updates];
    return {
      progress,
      updates,
      loss: current.loss,
      accuracy: current.accuracy,
      correct: current.correct,
      predictions: current.predictions,
      weights: current.weights,
      weightNorm: current.weightNorm,
      history: fitHistory.slice(0, updates + 1),
    };
  }
  return null;
}
export const loopCueProgress = (cues, id, fallback) =>
  !cues?.[id]
    ? fallback
    : cues[id].phase === 'before'
      ? 0
      : cues[id].phase === 'after'
        ? 1
        : cues[id].progress;
export const loopCueStarted = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function loopAtomicState(beat, progress, cues) {
  const replaced =
      beat < 2 && (beat > 0 || loopCueStarted(cues, 'loop-file-replace', progress > 0.7)),
    synced = beat === 1 && loopCueStarted(cues, 'loop-directory-sync', progress > 0.15),
    stagedCount =
      beat === 2
        ? 2
        : replaced
          ? 4
          : Math.floor(4 * loopCueProgress(cues, 'atomic-checkpoint-beat-0', progress));
  return {
    live: replaced ? 'new complete bytes' : 'old complete bytes',
    liveCells: Array(4).fill(replaced ? 1 : 0),
    staging: replaced
      ? 'staging name removed'
      : beat === 2
        ? 'controlled write failure'
        : stagedCount === 4
          ? 'complete new cells'
          : 'writing ' + stagedCount + '/4 cells',
    stagedCount,
    stagingNameExists: !replaced,
    stagedCells: replaced
      ? []
      : Array.from(
          {
            length: 4,
          },
          (_, i) => (i < stagedCount ? 1 : '·'),
        ),
    fileSynced: beat < 2 && stagedCount === 4,
    replaced,
    directorySynced: synced,
    powerLossTested: false,
  };
}
export function heldOutUpdate(clearBuffer) {
  const old = clearBuffer
      ? [
          [0, 0],
          [0, 0],
        ]
      : [
          [-1, -1],
          [1, 1],
        ],
    current = oneTrainingStep().gradient,
    stored = old.map((row, i) => row.map((v, j) => v + current[i][j])),
    weights = stored.map((row) => row.map((v) => -LR * v)),
    ticket = [1.5, 1],
    { logits, gap } = scoreTicket(weights, ticket);
  return {
    old,
    current,
    stored,
    weights,
    ticket,
    logits,
    gap,
    probabilities: stableSoftmax(logits),
  };
}
export function loopFreshState(beat, progress, cues) {
  const repaired = beat === 2 && loopCueStarted(cues, 'loop-clear-stale', progress > 0.15),
    sumVisible =
      beat > 1 || (beat === 1 && loopCueStarted(cues, 'loop-stale-sum', progress > 0.05)),
    updateVisible =
      beat === 2
        ? repaired
        : beat === 1 && loopCueStarted(cues, 'loop-stale-update', progress > 0.3),
    probabilityVisible =
      beat === 2
        ? loopCueStarted(cues, 'loop-fixed-route', progress > 0.6)
        : beat === 1 && loopCueStarted(cues, 'loop-bad-route', progress > 0.7);
  return {
    ...heldOutUpdate(repaired),
    repaired,
    sumVisible,
    updateVisible,
    probabilityVisible,
  };
}
