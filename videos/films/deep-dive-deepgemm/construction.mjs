import {
  alignExpertRows,
  bounded,
  compressedKeySelection,
  copyLayoutViews,
  expertProjectionFlops,
  expertWeightedReturn,
  gemmTile,
  indexerReference,
  interpolate,
  packSegments,
  phase,
  scaledDot,
  sparseCachePosition,
  sum,
} from './arithmetic.mjs';
import {
  DEEP_GEMM_SENTENCES,
  counts,
  freshRows,
  layerRuns,
  parallel,
  routedReturns,
  serial,
  tracks,
} from './fixtures.mjs';

export function expertPackState(id, state) {
  const b = state.beat ?? 0;
  const g = (beat, line) => deepGemmSentenceProgress(id, state, beat, line);
  const rows = id === 'fresh-contract' ? freshRows : counts;
  let alignment = 128;
  let from = rows;
  let steps;
  const assemble = 1;
  let allocationReady;
  let totalsReady;
  if (id === 'intro') {
    steps = [g(1, 0), g(1, 1), g(1, 3), g(1, 3)];
    allocationReady = g(1, 4) >= 1;
    totalsReady = g(1, 5) >= 1;
  } else if (id === 'packing') {
    alignment = [64, 128, 256][b];
    if (b > 0) from = alignExpertRows(rows, alignment / 2).capacities;
    const move = g(b, b === 0 ? 2 : 1);
    steps = rows.map(() => move);
    allocationReady = move >= 1;
    totalsReady = g(b, b === 2 ? 1 : 2) >= 1;
  } else {
    alignment = b < 2 ? 128 : 256;
    if (b >= 2) from = alignExpertRows(rows, 128).capacities;
    const move = b < 2 ? g(1, 1) : g(2, 1);
    steps = rows.map(() => move);
    allocationReady = move >= 1;
    totalsReady = g(b < 2 ? 1 : 2, 2) >= 1;
  }
  const pack = alignExpertRows(rows, alignment);
  const padded = from.map((n, i) => interpolate(n, pack.capacities[i], steps[i]));
  return {
    ...pack,
    b,
    currentCounts: rows,
    padded,
    segments: packSegments(rows, padded, assemble),
    assemble,
    allocationReady,
    totalsReady,
    utilization: pack.useful / pack.capacity,
    usefulFlops: expertProjectionFlops(pack.useful),
    paddedFlops: expertProjectionFlops(pack.capacity),
  };
}

export function chunkScheduleState(state) {
  const b = state.beat ?? 0;
  const g = (line) => deepGemmSentenceProgress('overlap', state, b, line);
  const events = b === 0 || b === 3 ? serial : parallel;
  const end = Math.max(...events.map((e) => e.end));
  // Stop the replay where the communication lane first becomes free.
  const time = [
    () => end * g(2),
    () => g(1),
    () => 1 + 2 * g(0) + 2 * g(1) + g(2),
    () => 1 + 3 * g(1) + 4 * g(2),
  ][b]();
  const owners = ['A', 'B'].map((chunk) => {
    if (chunk === 'B' && (b === 1 || (b === 2 && g(0) === 0))) return null;
    const start = events.find((e) => e.id === chunk + ' dispatch').start;
    const release = events.find((e) => e.id === chunk + ' combine').end;
    return time >= start && time < release ? chunk : null;
  });
  return { b, events, end, time, owners };
}
export function scaleTrace(beat, progress) {
  const model = scaledDot(),
    seconds = progress * [17.38, 17.932, 18.648][beat],
    q = Math.max(0, Math.min(1, (seconds - 9.3) / 2.5)),
    applied = beat === 0 ? 0 : beat === 1 ? Math.max(0, Math.min(1, (seconds - 0.74) / 3.2)) : 1;
  const contributions = model.raw.map((value, i) => value + (model.partial[i] - value) * applied);
  return {
    ...model,
    applied,
    contributions,
    sumReady: beat !== 1 || seconds >= 6.38,
    currentSum: sum(contributions),
    visibleGroups: beat > 0 ? 2 : Math.min(2, Math.floor(q * 3)),
  };
}
export function sampleModel(id, state) {
  if (id === 'intro' || id === 'packing') return expertPackState(id, state);
  if (id === 'overlap') return chunkScheduleState(state);
  if (!tracks[id]) return sampleDeepGemmChapter(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'dot') {
    const tile = gemmTile(q);
    const a = b === 0 ? [1, 2] : [0, -1],
      z = [3, 4],
      count = b < 2 ? Math.floor(q * 2 + 1e-9) : 2,
      products = a.map((v, i) => v * z[i]);
    return {
      ...base,
      tile,
      a,
      z,
      count,
      products,
      total: sum(products.slice(0, count)),
    };
  }
  if (id === 'scales')
    return {
      ...base,
      ...scaledDot(),
      applied: b > 0,
    };
  if (id === 'movement') {
    const progress = (beat, line) => deepGemmSentenceProgress(id, state, beat, line);
    const load = progress(0, 1);
    const scale = progress(1, 0);
    const releaseProgress = progress(2, 0);
    return {
      ...base,
      load,
      scale,
      operands: load >= 1,
      scalesShared: load >= 1,
      scalesTensor: scale >= 1,
      ready: load >= 1 && scale >= 1,
      complete: releaseProgress > 0,
      releaseProgress,
      outputReleased: releaseProgress === 1,
      layouts: copyLayoutViews(),
    };
  }
  if (id === 'indexer')
    return {
      ...base,
      ...indexerReference(),
      row: [0.2, 0.9, 99],
      valid: 2,
      selectedColumn: b === 1 ? 2 : 1,
      selectedToken: b === 1 ? null : 41,
    };
  throw new Error(`Unknown DeepGEMM model ${id}`);
}
export function sampleDeepGemmVisual(id, state) {
  const s = sampleModel(id, state),
    b = s.b,
    g = (beat, index) => deepGemmSentenceProgress(id, state, beat, index);
  if (id === 'dot') {
    const q = g(b, b === 0 ? 2 : b === 1 ? 0 : 1),
      count = Math.min(2, Math.floor(q * 2 + 1e-9));
    return {
      ...s,
      q,
      count,
      total: sum(s.products.slice(0, count)),
      tile: gemmTile(q),
    };
  }
  if (id === 'scales') {
    const model = scaledDot(),
      applied = b === 0 ? 0 : b === 1 ? g(1, 0) : 1;
    const factors = model.products.map((v) => interpolate(1, v, applied)),
      contributions = model.raw.map((v, i) => v * factors[i]);
    return {
      ...s,
      ...model,
      applied,
      factors,
      contributions,
      visibleGroups: b ? 2 : Math.min(2, Math.floor(g(0, 2) * 2 + 1e-9)),
      sumReady: b > 1 || (b === 1 && g(1, 2) >= 1),
      currentSum: sum(contributions),
    };
  }
  if (id === 'indexer')
    return {
      ...s,
      dotsReady: b > 0 || g(0, 1) >= 1,
      reluReady: b > 0 || g(0, 2) >= 0.5,
      scoreReady: b > 0 || g(0, 2) >= 1,
      selectionReady: b === 1 ? g(1, 3) >= 1 : b === 2 ? g(2, 0) >= 1 : false,
    };
  return s;
}
export function deepGemmSentenceProgress(id, state, beat, index) {
  const count = DEEP_GEMM_SENTENCES[id]?.[beat];
  if (!Number.isInteger(index) || index < 0 || index >= count)
    throw new Error(`Unknown DeepGEMM sentence ${id}/${beat}/${index}`);
  const key = `dg-${id}-${beat}-${index}`;
  if (state.cues) {
    const cue = state.cues[key];
    if (!cue) throw new Error(`Unknown narration cue ${key}`);
    return bounded(cue.progress ?? (cue.phase === 'after' ? 1 : 0));
  }
  return state.beat > beat
    ? 1
    : state.beat < beat
      ? 0
      : bounded((state.beatP ?? 0) * count - index);
}
export function sampleDeepGemmChapter(id, state) {
  if (!DEEP_GEMM_SENTENCES[id]) throw new Error(`Unknown DeepGEMM scene ${id}`);
  const b = state.beat ?? 0,
    g = (beat, index) => deepGemmSentenceProgress(id, state, beat, index),
    p = bounded(state.beatP ?? 0),
    model = {
      id,
      b,
      p,
      g,
    };
  if (id === 'fresh-contract')
    return {
      ...model,
      first: alignExpertRows(freshRows, 128),
      second: alignExpertRows(freshRows, 256),
    };
  if (id === 'stage-lifetime')
    return {
      ...model,
      shape: [3, 4],
      strides: [8, 2],
      coordinate: [1, 3],
      offset: 14,
      wrongOffset: 7,
    };
  if (id === 'sparse-position-map')
    return {
      ...model,
      ...sparseCachePosition([3, 7], 4, 5),
    };
  if (id === 'moe-graph')
    return {
      ...model,
      ...expertWeightedReturn(routedReturns[0].values, routedReturns[0].weights),
    };
  if (id === 'routed-denominators')
    return {
      ...model,
      sourcePerRank: 512,
      ranks: 8,
      topk: 6,
      experts: 256,
      source: 4096,
      assignments: 24576,
      balanced: 3072,
      localExperts: 32,
    };
  if (id === 'indexer-contract')
    return {
      ...model,
      values: [0.2, 0.9, 99],
      start: 40,
      end: b === 1 ? 40 : 42,
      selected: compressedKeySelection([0.2, 0.9, 99], 40, b === 1 ? 40 : 42),
    };
  if (id === 'benchmark-receipt')
    return {
      ...model,
      candidate: 56.5,
      speedup: 1.96,
      baseline: 56.5 * 1.96,
      timeReduction: 1 - 1 / 1.96,
      work: 6 * 3072 * 4096 * 2048,
      seconds: 146.5e-6,
    };
  if (id === 'profile-the-layer')
    return {
      ...model,
      old: [layerRuns[0].prep, layerRuns[0].kernel],
      candidate: [layerRuns[1].prep, layerRuns[1].kernel],
      oldTotal: layerRuns[0].prep + layerRuns[0].kernel,
      newTotal: layerRuns[1].prep + layerRuns[1].kernel,
    };
  if (id === 'determinism')
    return {
      ...model,
      a: 2 ** 24,
      first: Math.fround(Math.fround(Math.fround(2 ** 24) + 1) - 2 ** 24),
      second: Math.fround(Math.fround(2 ** 24 - 2 ** 24) + 1),
    };
  return model;
}
