import {
  ACTION_MASK,
  SAMPLE_ADVANTAGES,
  SAMPLE_LOGPROBS,
  SENTENCES,
  TARGETS,
} from './fixtures.mjs';
import { ADVANTAGES, clamp01, loraWorksheet, sharedCreditUpdate } from './arithmetic.mjs';
import { weightedVectorState } from 'vizmatic';
export function groupCreditConstruction(state) {
  const seconds = clamp01(state.beatP ?? 0) * 20.184,
    cues = state.cues;
  const tied = cues ? cues['group-credit-tied-rewards']?.phase !== 'before' : seconds >= 12.75;
  const progress = cues
    ? (cues['group-credit-shared-update']?.progress ?? 0)
    : clamp01((seconds - 6.92) / 3.74);
  const advantages = tied ? [0, 0, 0, 0] : ADVANTAGES;
  return {
    tied,
    progress,
    advantages,
    ...sharedCreditUpdate(progress, advantages),
  };
}
export function trajectoryConstruction(state) {
  const b = state.beat ?? 0,
    id = 'trajectory-datum',
    sample = sentence(state, id, 0, 1),
    credit = sentence(state, id, 0, 2);
  const received = b > 0 ? 2 : Math.floor(sample * 2 + 1e-9),
    assigned = b > 0 ? 2 : Math.floor(credit * 2 + 1e-9);
  const tokens = TARGETS.map((value, i) => (i === 0 || i <= received ? value : null)),
    logs = SAMPLE_LOGPROBS.map((value, i) => (i === 0 || i <= received ? value : null));
  const credits = SAMPLE_ADVANTAGES.map((value, i) => (i === 0 || i <= assigned ? value : null)),
    mask = ACTION_MASK.map((value, i) => (i === 0 || i <= assigned ? value : null));
  const focus =
    b === 1
      ? sentence(state, id, 1, 0) < 1
        ? sentence(state, id, 1, 0) < 0.5
          ? 0
          : 1
        : sentence(state, id, 1, 1) < 1
          ? 2
          : sentence(state, id, 1, 2) < 1
            ? 4
            : 3
      : -1;
  return {
    tokens,
    logs,
    credits,
    mask,
    focus,
    receipts: [received >= 1, received >= 2],
    tool: b === 2 && sentence(state, id, 2, 2) === 1,
    validated: b === 2 && sentence(state, id, 2, 3) === 1,
  };
}
export function sentence(state, id, beat, index) {
  if (!Number.isInteger(index) || index < 0 || index >= (SENTENCES[id]?.[beat] ?? 0))
    throw Error(`Unknown Tinker sentence ${id}/${beat}/${index}`);
  const current = state.beat ?? 0;
  if (current < beat) return 0;
  if (current > beat) return 1;
  const cue = `tk-${id}-${beat}-${index}`;
  if (state.cues) {
    if (!state.cues[cue]) throw Error(`Missing declared Tinker cue ${cue}`);
    return state.cues[cue].progress;
  }
  return clamp01((state.beatP ?? 0) * SENTENCES[id][beat] - index);
}
export function tinkerConstruction(id, state) {
  const b = state.beat ?? 0,
    p = (beat, index) => sentence(state, id, beat, index),
    done = (beat, index) => p(beat, index) === 1;
  if (id === 'lora-geometry') {
    const rank = b >= 2 ? 4 : 2,
      full = loraWorksheet(rank),
      previous = loraWorksheet(2);
    const progress = b === 1 ? p(1, 3) : b === 2 ? p(2, 2) : b > 2 ? 1 : 0;
    const accumulation =
      b === 2
        ? weightedVectorState({
            initial: previous.output,
            terms: [
              {
                id: 'added-direction-2',
                weight: 0.5,
                values: [1, 0, 0, 0],
              },
              {
                id: 'added-direction-3',
                weight: -1,
                values: [0, 0, 1, 0],
              },
            ],
            progress,
          })
        : loraWorksheet(rank, progress).accumulation;
    return {
      b,
      rank,
      full,
      accumulation,
      showNarrow: b === 1 ? done(1, 1) : b >= 2 && done(2, 1),
      showExpanded: b === 1 ? done(1, 2) : b >= 2 && done(2, 1),
      showResult: b === 1 ? done(1, 3) : b >= 2 && done(2, 2),
      showCounts: b === 3 && done(3, 1),
    };
  }
  if (id === 'fresh-run')
    return {
      b,
      full: [30, 31, 32, 40, 41, 42],
      inputs: [30, 31, 32, 40, 41],
      targets: [31, 32, 40, 41, 42],
      weights: [0, 0, 1, 1, 1],
      mean: [0, 0, 1 / 3, 1 / 3, 1 / 3],
      showWeights: done(1, 0),
      showMean: done(1, 1),
      showLag: done(1, 3),
      repaired: done(1, 4),
      lag: 3,
    };
  if (id === 'chunk-order')
    return {
      b,
      chunks: b === 0 ? [] : [[0, 1], [2, 3], [4]],
      showChunks: done(1, 1),
      oversized: b >= 1 && p(1, 3) > 0,
      empty: b >= 1 && p(1, 4) > 0,
      emptyComplete: done(1, 4),
    };
  if (id === 'datum-validation')
    return {
      b,
      sourceTokens: [11, 20, 21],
      originalScores: [0, -0.4, -0.8],
      scores: b === 1 ? [0, -0.8, -0.4] : [0, -0.4, -0.8],
      shapePass: b === 1,
      identityPass: false,
      sdkAccepts: b === 2 && done(2, 1),
      localRejects: b === 2 && done(2, 3),
    };
  if (id === 'uniform-groups')
    return {
      b,
      rewards: [
        [1, 1],
        [0, 0],
      ],
      advantages: [
        [0, 0],
        [0, 0],
      ],
      filterEnabled: b === 1 && p(1, 0) > 0,
      retained: b === 1 && done(1, 0) ? 1 : 2,
      auxiliary: done(0, 2),
      filterDefault: false,
    };
  if (id === 'trajectory-branch')
    return {
      b,
      first: [10, 11, 20, 30, 40],
      second: [50, 60],
      firstMask: [0, 0, 1, 0, 1],
      secondMask: [0, 1],
      split: done(0, 2),
      shifted: done(1, 2),
    };
  if (id === 'queue-recovery')
    return {
      b,
      trainer: 12,
      groups: [
        {
          id: 'G1',
          policy: 9,
        },
        {
          id: 'G2',
          policy: 10,
        },
        {
          id: 'G3',
          policy: 11,
        },
      ],
      deadline: done(1, 1),
      reconcile: done(1, 2),
      external: b === 2,
      externalLookup: done(2, 2),
    };
  return {
    b,
    p,
    done,
  };
}
