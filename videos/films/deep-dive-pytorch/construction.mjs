import {
  adam,
  address,
  beforeFresh,
  clamp01,
  cueProgress,
  freshBad,
  freshGood,
  next,
  phase,
  pipelineSlots,
  product,
  reset,
  saved,
  sum,
} from './arithmetic.mjs';
import { RESIDENCY_CUES, originalIds, tracks } from './fixtures.mjs';
export function residencyState(beat, beatP) {
  const seconds = beatP * (beat === 0 ? RESIDENCY_CUES.gather.span : RESIDENCY_CUES.release.span);
  const gatherStarted = beat > 0 || seconds >= RESIDENCY_CUES.gather.start;
  const gatherProgress =
    beat === 0 ? cueProgress(seconds, RESIDENCY_CUES.gather.start, RESIDENCY_CUES.gather.end) : 1;
  const releaseProgress =
    beat === 2 ? cueProgress(seconds, RESIDENCY_CUES.release.start, RESIDENCY_CUES.release.end) : 0;
  const received =
    beat === 0
      ? Math.floor(8 * gatherProgress + 1e-9)
      : beat === 1
        ? 8
        : beat === 2
          ? 8 - Math.floor(8 * releaseProgress + 1e-9)
          : 0;
  const computeAllocated =
    beat === 0 ? (gatherStarted ? 8 : 0) : beat === 1 ? 8 : beat === 2 ? received : 0;
  const parts = [
    {
      id: 'shard',
      label: 'Owned shard',
      value: 2,
      color: 'blue',
    },
    {
      id: 'compute',
      label: 'Compute parameter',
      value: computeAllocated,
      color: 'pink',
    },
  ];
  const retainedParts = [
    {
      id: 'shard',
      label: 'Owned shard',
      value: 2,
      color: 'blue',
    },
    {
      id: 'retained',
      label: 'Retained full parameter',
      value: 8,
      color: 'pink',
    },
  ];
  return {
    gatherStarted,
    gatherProgress,
    releaseProgress,
    received,
    computeAllocated,
    parameter: Array.from(
      {
        length: received,
      },
      (_, index) => index + 1,
    ),
    retainedVisible: beat === 2 && seconds >= RESIDENCY_CUES.retain,
    parts,
    live: sum(parts.map((part) => part.value)),
    retainedParts,
    retainedLive: sum(retainedParts.map((part) => part.value)),
  };
}
export function gatheredCount(beat, progress) {
  return residencyState(beat, progress).received;
}
export function autogradTrace(beat, progress) {
  const seconds = progress * [19.368, 20.088, 20.928][beat],
    q = progress,
    alias = beat === 1 && seconds >= 2.4,
    write = beat === 1 ? seconds >= 2.8 : beat === 2 && seconds >= 3.6,
    checked = seconds >= [16, 14.6, 7.8][beat];
  return {
    q,
    alias,
    write,
    checked,
    storage: beat === 1 && write ? 4 : 3,
    version: beat === 1 && write ? 1 : 0,
    clone: beat === 2 && seconds >= 1.3 ? (write ? 4 : 3) : null,
    valid: !(beat === 1 && write),
  };
}
export function attentionConstruction(beat, progress, cues) {
  const seconds = clamp01(progress) * [19.032, 20.76, 21.216][beat];
  const maskChanged = beat === 1 && seconds >= 6.4125;
  const cachedCue = cues?.['attention-cached-position'];
  const cachedPosition =
    beat === 2 && (cachedCue ? cachedCue.phase !== 'before' : seconds >= 11.6875);
  const masked = beat === 1 ? seconds >= 8.45 : beat === 2 && !cachedPosition;
  const scores = [1 / Math.sqrt(2), 0];
  const allowed = masked ? [true, false] : [true, true];
  const weights = scores.map((score, i) => (allowed[i] ? Math.exp(score - scores[0]) : 0));
  const p = weights.map((weight) => weight / sum(weights));
  return {
    seconds,
    masked,
    maskChanged,
    cachedPosition,
    scores,
    allowed,
    p,
    scoresVisible: beat > 0 || seconds >= 4.525,
    scaledVisible: beat > 0 || seconds >= 6.4375,
    probabilitiesVisible: beat > 0 || seconds >= 7.7875,
    outputVisible:
      beat === 0 ? seconds >= 10.7625 : !(beat === 1 && seconds >= 6.4125 && seconds < 10.4),
    output: [p[0] * 10, p[1] * 20],
    maskPending: maskChanged && seconds < 8.45,
    focusProgress:
      beat === 0
        ? cueProgress(seconds, 7.7875, 9.2875)
        : beat === 1
          ? cueProgress(seconds, 8.45, 10)
          : cueProgress(seconds, 11.6875, 13.1875),
  };
}
export function recoveryConstruction(beat, progress) {
  const seconds = clamp01(progress) * [18.768, 20.016, 24.344][beat];
  return {
    seconds,
    saved,
    next,
    restored: adam(
      {
        ...saved,
      },
      -0.25,
    ),
    reset,
    weightSaved: beat > 0 || seconds >= 9.075,
    momentsSaved: beat > 0 || seconds >= 9.9625,
    stepSaved: beat > 0 || seconds >= 10.6875,
    gradientVisible: beat > 0 || seconds >= 13.5875,
    liveVisible: beat > 0 || seconds >= 14.475,
    restoreVisible: beat > 0 || seconds >= 16.825,
    matched: beat > 1 || (beat === 1 && seconds >= 1.0625),
    resetVisible: beat > 1 || (beat === 1 && seconds >= 3.5),
    historyReset: beat > 1 || (beat === 1 && seconds >= 5.675),
    diverged: beat > 1 || (beat === 1 && seconds >= 9.5625),
    gap: Math.abs(next.w - reset.w),
  };
}
export function sampleOriginalModel(id, state) {
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro' || id === 'strides') {
    const storage = [0, 1, 2, b === 2 ? 30 : 3, 4, 5],
      original = Array.from(
        {
          length: 2,
        },
        (_, i) =>
          Array.from(
            {
              length: 3,
            },
            (_, j) => storage[address([i, j], [3, 1])],
          ),
      ),
      transposed = Array.from(
        {
          length: 3,
        },
        (_, i) =>
          Array.from(
            {
              length: 2,
            },
            (_, j) => storage[address([i, j], [1, 3])],
          ),
      );
    return {
      ...base,
      storage,
      original,
      transposed,
      copied: [0, 3, 1, 4, 2, 5],
      aliasAddress: address([0, 1], [1, 3]),
      bytes: 48,
    };
  }
  if (id === 'autograd') {
    const mutated = b === 1,
      currentVersion = mutated ? 1 : 0,
      x = mutated ? 4 : 3;
    return {
      ...base,
      x,
      savedX: 3,
      loss: 9,
      savedVersion: 0,
      currentVersion,
      valid: currentVersion === 0,
      gradient: currentVersion === 0 ? 6 : null,
      clone: b === 2 ? 4 : null,
      numerical: ((3 + 1e-4) ** 2 - (3 - 1e-4) ** 2) / 2e-4,
    };
  }
  if (id === 'attention') {
    const scores = [1 / Math.sqrt(2), 0],
      allowed = b === 1 ? [true, false] : [true, true],
      weights = scores.map((v, i) => (allowed[i] ? Math.exp(v - scores[0]) : 0)),
      mass = sum(weights),
      p = weights.map((v) => v / mass);
    return {
      ...base,
      scores,
      allowed,
      p,
      output: [p[0] * 10, p[1] * 20],
      upperLeft: [10, 0],
    };
  }
  if (id === 'compile') {
    const count = b === 0 ? 1 : b === 1 && q < 0.35 ? 2 : 3,
      calls = [2, 2, 3].slice(0, count),
      cache = new Map(),
      events = calls.map((scale) => {
        const key = `float64:2:stride1:scale${scale}`,
          captured = !cache.has(key);
        if (captured) cache.set(key, cache.size + 1);
        return {
          scale,
          graph: cache.get(key),
          captured,
          output: [1, 2].map((v) => v * v * scale),
        };
      });
    return {
      ...base,
      calls,
      events,
      graphs: cache.size,
      current: events.at(-1),
    };
  }
  if (id === 'placement') {
    const partials = [
        [1, 2],
        [10, 20],
      ],
      reduced = partials[0].map((v, i) => v + partials[1][i]);
    return {
      ...base,
      partials,
      reduced,
      local: b === 0 ? partials : b === 1 ? [reduced, reduced] : reduced.map((v) => [v]),
    };
  }
  if (id === 'residency')
    return {
      ...base,
      ...residencyState(b, state.beatP),
    };
  return {
    ...base,
    saved,
    next,
    restored: adam(
      {
        ...saved,
      },
      -0.25,
    ),
    reset,
    gap: Math.abs(next.w - reset.w),
  };
}
export const partOf = (state, id, fallback = phase(state.beatP ?? 0)) => {
  const q = state.cues?.['pt-' + id];
  return q ? (q.phase === 'after' ? 1 : q.phase === 'before' ? 0 : clamp01(q.progress)) : fallback;
};
export const complete = (state, id, fallback = (state.beatP ?? 0) >= 1) => {
  const q = state.cues?.['pt-' + id];
  return q ? q.phase === 'after' : fallback;
};
export const op = (id, state) => partOf(state, id + '-' + state.beat);
export function sampleModel(id, state) {
  const b = state.beat ?? 0,
    p = op(id, state),
    q = phase(state.beatP ?? 0),
    done = (n) => complete(state, n),
    part = (n) => partOf(state, n),
    base = {
      b,
      p,
      q,
    };
  if (originalIds.has(id))
    return {
      ...sampleOriginalModel(id, state),
      p,
    };
  if (id === 'tensor-contract')
    return {
      ...base,
      cell: address([1, 0], [3, 1]),
      byte: address([1, 0], [3, 1]) * 8,
      copyCount: Math.min(6, Math.floor(p * 6 + 1e-9)),
      copy: [0, 3, 1, 4, 2, 5],
    };
  if (id === 'tape-lifecycle')
    return {
      ...base,
      x: 3,
      y: 6,
      loss: 36,
      dy: 12,
      dx: done('tape-gradient') ? 24 : null,
    };
  if (id === 'attention-selector')
    return {
      ...base,
      cells: product([1, 2, 8192, 8192]),
      showCount: done('score-count'),
      count: Math.floor(p * 64),
    };
  if (id === 'mask-modes')
    return {
      ...base,
      values: [4, 8, 1000],
      padding: [false, false, true],
      allowed:
        b === 0 ? (p < 0.5 ? [false, false, true] : [true, true, false]) : [true, true, false],
      wrongMean: 1000,
      rightMean: 6,
      dropout: b === 1 && p < 0.6 ? 0.2 : 0,
    };
  if (id === 'mesh-shapes')
    return {
      ...base,
      dp: 2,
      tp: 4,
      global: [4096, 16384],
      local: [4096, 4096],
      showLocal: done('mesh-local'),
    };
  if (id === 'tensor-split')
    return {
      ...base,
      weight: Array.from(
        {
          length: 8,
        },
        (_, r) =>
          Array.from(
            {
              length: 4,
            },
            () => r + 1,
          ),
      ),
      local: [4, 4],
      showLocal: done('stored-slice'),
    };
  if (id === 'pipeline-schedule')
    return {
      ...base,
      ...pipelineSlots(b === 2 ? 4 : 2),
    };
  if (id === 'pipeline-scaling') {
    const sumP = part('micro-sum'),
      count =
        b > 1
          ? 4
          : b === 1
            ? Math.min(4, Math.floor(sumP * 4 + 1e-8))
            : Math.min(4, Math.floor(p * 4 + 1e-8)),
      values = [2, 4, 6, 8],
      subtotal = sum(values.slice(0, count));
    return {
      ...base,
      values,
      count,
      subtotal,
      showSum: b > 1 || done('micro-sum'),
      showMean: b > 1 || done('micro-mean'),
      showDouble: b > 1 || done('micro-double'),
      mean: 5,
      double: 1.25,
    };
  }
  if (id === 'live-peak') {
    const values = [4, 16, 8, 12],
      count =
        b === 1
          ? Math.min(4, Math.floor(part('live-total') * 4 + 1e-8))
          : b > 1
            ? 4
            : Math.min(4, Math.floor(p * 4 + 1e-8));
    return {
      ...base,
      values,
      count,
      subtotal: sum(values.slice(0, count)),
      total: 40,
      showTotal: b > 1 || done('live-total'),
    };
  }
  if (id === 'optimizer-counter')
    return {
      ...base,
      saved,
      rateSaved: done('rate-saved'),
      rateReset: done('rate-reset'),
      w1: 2 - 0.01 * 0.5,
      w2: 2 - 0.02 * 0.5,
    };
  if (id === 'fresh-counter') {
    const restore = b === 2 ? part('fresh-restored') : 0;
    return {
      ...base,
      saved: beforeFresh,
      good: freshGood,
      bad: freshBad,
      restore,
      goodVisible: b > 1 || done('fresh-correct'),
      badVisible: b > 1 || done('fresh-wrong'),
      badNow: {
        ...freshBad,
        w: freshBad.w + (freshGood.w - freshBad.w) * restore,
        step: restore > 0 ? 3 : 1,
      },
      restored: b === 2 && done('fresh-restored'),
    };
  }
  return base;
}
