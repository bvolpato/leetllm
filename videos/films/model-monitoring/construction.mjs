import {
  current,
  delayedErrorCostLimit,
  driftArrivals,
  parity,
  paritySweep,
  psiTerms,
  reference,
} from './fixtures.mjs';
export function driftBars(opacityForBeat) {
  return reference.map((share, i) => ({
    reference: {
      share,
      height: share * 640,
    },
    current: {
      share: current[i],
      height: current[i] * 640,
      opacity: opacityForBeat(i < 2 ? 0 : 1, ...driftArrivals[i], i),
    },
  }));
}
export function driftSnapshot(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const phase = (index, from, to) => Math.max(0, Math.min(1, (p - from) / (to - from)));
  const compareProgress = Math.max(0, Math.min(1, state.compareProgress ?? p));
  const complete = state.complete ?? beat > 1;
  const opacityForBin = (_pair, from, to, index) => {
    if (complete) return 1;
    if (beat === 0) return index < 2 ? phase(p, from, to) : 0;
    if (beat === 1) {
      if (index < 2) return 1;
      return phase(compareProgress, index === 2 ? 0.02 : 0.25, index === 2 ? 0.22 : 0.49);
    }
    return 1;
  };
  const bins = driftBars((pair, from, to, index) => opacityForBin(pair, from, to, index)),
    indices = bins.flatMap((bin, i) => (bin.current.opacity === 1 ? [i] : []));
  const value = indices.reduce((sum, i) => sum + psiTerms[i], 0),
    previous = indices.slice(0, -1).reduce((sum, i) => sum + psiTerms[i], 0);
  const justAdded =
    beat === 0
      ? driftArrivals.some(([start, end], index) => index < 2 && p >= start && p < end)
      : beat === 1 &&
        ((indices.length === 3 && compareProgress < 0.55) ||
          (indices.length === 4 && compareProgress >= 0.46 && compareProgress < 0.88));
  return {
    bins,
    indices,
    value,
    previous,
    complete: indices.length === bins.length,
    justAdded,
  };
}
export function parityBars(opacityForBeat) {
  return [
    {
      title: 'training replay',
      numerator: 20,
      denominator: 50,
      value: parity.training,
    },
    {
      title: 'online serving',
      numerator: 20,
      denominator: 100,
      value: parity.serving,
    },
  ].map((row, i) => ({
    ...row,
    width: 460 * row.value,
    opacity: opacityForBeat(i),
  }));
}
export function visibleParityCases(progress) {
  const p = Math.max(0, Math.min(1, progress));
  return paritySweep.slice(0, Math.max(1, Math.min(paritySweep.length, Math.ceil(3 * p))));
}
export function releaseReadout(beat, progress, stages = {}) {
  const observed = stages.canaryComplete ?? (beat >= 2 && progress >= 0.26);
  const wider = stages.wider ?? (beat >= 2 && progress >= 0.34);
  const cohortProgress =
    stages.cohortProgress ?? (beat < 2 ? 0 : Math.max(0, Math.min(1, (progress - 0.43) / 0.24)));
  const rows = stages.cohortVisible ? 500 : Math.round(500 * cohortProgress);
  const misses = [125, 375].filter((index) => index <= Math.round(500 * cohortProgress)).length;
  const falseReviews = Array.from(
    {
      length: 10,
    },
    (_, i) => 20 + 45 * i,
  ).filter((index) => index <= Math.round(500 * cohortProgress)).length;
  const cost = 10 * misses + 2 * falseReviews,
    complete = rows === 500 && cohortProgress >= 1;
  const costPer1000 = rows ? (1000 * cost) / rows : null;
  const action =
    complete && (stages.rollbackVisible ?? progress >= 0.85)
      ? costPer1000 > delayedErrorCostLimit
        ? 'rollback'
        : 'promote'
      : null;
  return {
    observed,
    wider,
    rows,
    misses,
    falseReviews,
    cost,
    costPer1000,
    complete,
    action,
  };
}
