import { GiB, cachePayload, clamp, fullPairs, localPairs } from './arithmetic.mjs';
import { approval, exchanges, limit, output, records, tracks } from './fixtures.mjs';
import { aggregate, pack, placeNeedle, verifyNote } from './model.mjs';
export function prefixReuseState(progress = 0) {
  const q = clamp(progress),
    prefixWork = [48000, 48000 * (1 - q), 48000 * (1 - q)],
    suffixes = [800, 1200, 600];
  return {
    progress: q,
    prefixWork,
    suffixes,
    logicalRequests: 3,
    retainedPrefixTokens: 48000,
    avoidedTokens: 96000 * q,
    newlyPrefillingTokens:
      prefixWork.reduce((a, v) => a + v, 0) + suffixes.reduce((a, v) => a + v, 0),
    decodePrefixReads: [48000, 48000, 48000],
  };
}
export function releaseSliceBars(progress = 0) {
  return {
    baseline: [90, 90, 90],
    candidate: [100, 70, 100],
    candidateOpacity: clamp(progress),
    baselineMean: 90,
    candidateMean: 90,
    middleFloor: 85,
  };
}
export function longContextModel(id, state) {
  const beat = state.beat ?? 0,
    cue = state.cues?.[`${id}-${beat}`],
    p = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : clamp(((state.beatP ?? 0) - 0.12) / 0.72);
  const tokens = 131072,
    one = cachePayload({
      layers: 80,
      heads: 8,
      width: 128,
      tokens,
    }),
    local = cachePayload({
      layers: 40,
      heads: 8,
      width: 256,
      tokens: 1024,
    }),
    global = cachePayload({
      layers: 8,
      heads: 1,
      width: 512,
      tokens,
    });
  const output = {
    id,
    beat,
    p,
    one,
    local,
    global,
    full: fullPairs(10),
    band: localPairs(10, 4),
  };
  if (id === 'cost-length')
    return {
      ...output,
      length: Math.round(4096 + (tokens - 4096) * p),
      leadingRatio: 32 ** 2,
      exactRatio: fullPairs(tokens) / fullPairs(4096),
    };
  if (id === 'cache-shape')
    return {
      ...output,
      sequences: beat === 0 ? 1 : beat === 1 ? 1 + Math.floor(3 * p) : 1,
      heads: beat === 2 ? 8 + Math.floor(56 * p) : 8,
      weightGiB: (70e9 * 2) / GiB,
    };
  if (id === 'mixed-layers')
    return {
      ...output,
      total: local + global,
      wrong: cachePayload({
        layers: 48,
        heads: 8,
        width: 256,
        tokens,
      }),
    };
  if (id === 'position-dials')
    return {
      ...output,
      train: 4096,
      target: 32768,
      position: 16384,
      mapped: (16384 * 4096) / 32768,
      step: [1, 0.45, 0.125],
    };
  if (id === 'basis-consistency') {
    const query = 1,
      key = beat === 0 ? 1 : beat === 1 ? 1 - 0.5 * p : 0.5;
    return {
      ...output,
      query,
      key,
      score: Math.cos(query - key),
      staleScore: 1,
      repairedScore: Math.cos(0.5),
    };
  }
  if (id === 'cache-execution')
    return {
      ...output,
      budget: 64,
      bf: one / GiB,
      quant: one / 2 / GiB,
      uncached: 3 * 48000 + 800 + 1200 + 600,
      reused: 48000 + 800 + 1200 + 600,
    };
  if (id === 'distributed-context')
    return {
      ...output,
      physical: 16,
      ranks: 4,
      logical: 64,
      positions: 1025,
      blocks: Math.ceil(1025 / 64),
      rounded: Math.ceil(1025 / 64) * 64,
      wrong: Math.ceil(1025 / 16) * 16,
    };
  if (id === 'release-slices')
    return {
      ...output,
      baseline: [90, 90, 90],
      candidate: [100, 70, 100],
      floor: 85,
      average: [100, 70, 100].reduce((a, b) => a + b, 0) / 3,
    };
  if (id === 'your-turn')
    return {
      ...output,
      capacity: 40,
      reserve: 12,
      instructions: 6,
      question: 2,
      note: 6,
      recent: 8,
      extra: 9,
      total: 12 + 6 + 2 + 6 + 8,
      attempted: 12 + 6 + 2 + 6 + 8 + 9,
    };
  return output;
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot;
  const p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.12) / 0.6));
  if (id === 'complete-turns') {
    const cue = state.cues?.[['admit-newest', 'middle-exchange', 'oldest-excluded'][step]];
    const progress = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : Math.max(0, Math.min(1, cue.progress))
      : p;
    const completed = step + (progress >= 0.8 ? 1 : 0);
    const considered = exchanges.slice(0, completed),
      previous = pack(exchanges.slice(0, step));
    return {
      step,
      p,
      move: cue ? Math.min(1, progress / 0.8) : Math.max(0, Math.min(1, (p - 0.05) / 0.75)),
      previousTotal: previous.total,
      attemptedTotal: previous.total + exchanges[step].units,
      considered,
      ...pack(considered),
    };
  }
  if (id === 'overflow') {
    let error;
    try {
      pack([], 26);
    } catch (failure) {
      error = failure.message;
    }
    return {
      step,
      p,
      required: 26,
      output,
      total: 34,
      limit,
      error,
    };
  }
  if (id === 'compaction') {
    const corrected = step > 1 || (step === 1 && (state.beatP ?? 0) >= 0.28);
    const note = corrected
      ? {
          ...approval,
        }
      : {
          approved: true,
          source: 'D1',
        };
    return {
      step,
      p,
      note,
      valid: verifyNote(note),
      missing: Object.keys(approval).filter((key) => note[key] !== approval[key]),
      ...pack(
        step === 2
          ? [
              {
                id: 'D1 checked note',
                units: 4,
              },
              exchanges[0],
              exchanges[1],
            ]
          : exchanges,
      ),
    };
  }
  if (id === 'placement') {
    const target = placeNeedle([0, 0.5, 1][step]);
    const from = step === 0 ? target.index : placeNeedle([0, 0.5, 1][step - 1]).index;
    const movement = p * p * (3 - 2 * p);
    return {
      step,
      p,
      ...target,
      displayIndex: from + (target.index - from) * movement,
      settled: step === 0 || p === 1,
    };
  }
  if (id === 'exact-counts') {
    const eligible = records.filter((row) => row.month === 'Mar' && row.type === 'timeout');
    const inspected =
      step === 0 ? 2 : step === 1 ? Math.floor(records.length * p + 1e-9) : records.length;
    const selected =
      step === 0
        ? [...eligible].sort((a, b) => b.score - a.score).slice(0, 2)
        : records
            .slice(0, inspected)
            .filter((row) => row.month === 'Mar' && row.type === 'timeout');
    return {
      step,
      p,
      inspected,
      complete: step !== 1 || inspected === records.length,
      selected,
      ...aggregate(selected),
    };
  }
  const packed =
    id === 'synthesis'
      ? pack([
          {
            id: 'D1 checked note',
            units: 4,
          },
          exchanges[0],
          exchanges[1],
        ])
      : pack([]);
  return {
    step,
    p,
    ...packed,
    instructions: step === 0 && id === 'budget' ? 0 : 4,
    question: step === 0 && id === 'budget' ? 0 : 4,
  };
}
