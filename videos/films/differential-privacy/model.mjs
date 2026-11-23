import {
  clamp01,
  clipVector,
  privacyEventBand,
  sumVectors,
  updateWithNoise,
} from './arithmetic.mjs';
import { PRIVATE_RECORDS } from './fixtures.mjs';
import { cueProgress, cueProgressFromState } from './construction.mjs';
export function userAggregateFixture() {
  const aliceTickets = [0.75, 0.75],
    aliceRaw = aliceTickets.reduce((a, v) => a + v, 0),
    aliceClipped = Math.min(1, aliceRaw),
    bao = 0.25,
    normalizer = 2;
  return {
    aliceTickets,
    aliceRaw,
    aliceClipped,
    bao,
    normalizer,
    full: (aliceClipped + bao) / normalizer,
    withoutAlice: bao / normalizer,
    sensitivity: 1 / normalizer,
  };
}
export function gaussianAccountantFixture(releases) {
  return gaussianReleaseLedger(Array(releases).fill(4));
}

// Each statistic is an unsampled Gaussian release of sensitivity C and SD equal to multiplier × C.
export function gaussianReleaseLedger(multipliers) {
  const delta = 1e-5,
    orders = [2, 4, 8, 16],
    rows = orders.map((alpha) => {
      const charges = multipliers.map(sigma => alpha / (2 * sigma ** 2));
      const rdp = charges.reduce((sum, charge) => sum + charge, 0);
      const conversion = Math.log(1 / delta) / (alpha - 1);
      return { alpha, charges, rdp, conversion, epsilon: rdp + conversion };
    });
  return {
    releases: multipliers.length,
    delta,
    rows,
    best: rows.reduce((best, row) => (row.epsilon < best.epsilon ? row : best)),
  };
}
export function noiseSnapshot(state) {
  const progress = (state.beat ?? 0) > 0 ? 1 : cueProgress(state, 10.925, 15.3375, 21.238);
  return {
    progress,
    aggregate: [1.6, 1.9],
    noisy: [1.6 + 0.2 * progress, 1.9 - 0.3 * progress],
  };
}
export function utilityNoiseScale(state) {
  const beat = state.beat ?? 0;
  if (beat === 0) return 0.1 + 0.4 * cueProgress(state, 3.6125, 17.75, 18.67);
  if (beat === 1) return 0.5;
  return 0.5 + 0.5 * clamp01(((state.beatP ?? 0) - 0.05) / 0.88);
}
export function clippingProgress(beat, progress) {
  // Measured voice: “Scale” at6.75s and “endpoint meets” at9.85–10.625s.
  const start = 6.75 / 15.598,
    end = 10.325 / 15.598;
  return beat < 1 ? 0 : beat > 1 ? 1 : Math.max(0, Math.min(1, (progress - start) / (end - start)));
}
export function introPrivacySnapshot(beat, progress) {
  const seconds = progress * 20.59;
  const removal = beat > 0 ? 1 : clamp01((seconds - 8.7375) / (10.3375 - 8.7375));
  const baseline = beat > 0 ? 1 : clamp01((seconds - 0.25) / 5.5);
  const neighbor = beat > 0 ? 1 : clamp01((seconds - 10.7125) / (12.9 - 10.7125));
  return {
    removal,
    baseline,
    neighbor,
    records: PRIVATE_RECORDS,
    neighborRecords: removal === 1 ? PRIVATE_RECORDS.slice(0, 3) : PRIVATE_RECORDS,
  };
}
export function adjacencySnapshot(beat, progress) {
  const seconds = progress * 12.094;
  const recordRemoval = beat < 1 ? 0 : beat > 1 ? 1 : clamp01((seconds - 3.325) / (4.775 - 3.325));
  const userRemoval = beat < 1 ? 0 : beat > 1 ? 1 : clamp01((seconds - 8.4125) / (9.9375 - 8.4125));
  return {
    recordRemoval,
    userRemoval,
    showRecord: beat >= 1,
    showUser: beat > 1 || (beat === 1 && seconds >= 5.1875),
    original: ['T1', 'T2', 'T3'],
    recordNeighbor: recordRemoval === 1 ? ['T1', 'T2'] : ['T1', 'T2', 'T3'],
    userNeighbor: userRemoval === 1 ? [] : ['T1', 'T2', 'T3'],
  };
}
export function definitionSnapshot(beat, progress) {
  const transition = clamp01((progress - 0.08) / 0.7);
  const epsilon = beat === 0 ? 0.1 : beat === 1 ? 0.1 + 0.9 * transition : 1;
  const delta = beat < 2 ? 0 : 0.0001 * transition;
  return {
    epsilon,
    delta,
    ...privacyEventBand(epsilon, delta),
  };
}
export function releaseTraceSnapshot(state = {}) {
  const beat = state.beat ?? 0,
    progress = clamp01(state.beatP ?? 0);
  const ramp = (start, end) => clamp01((progress - start) / (end - start));
  const clipProgress = cueProgressFromState(state, 'trace-clip', beat === 0 ? ramp(0.46, 0.96) : 0);
  const clipOutcomeProgress = cueProgressFromState(
    state,
    'trace-clip-result',
    beat === 0 ? ramp(0.84, 0.98) : 0,
  );
  const addProgress = cueProgressFromState(state, 'trace-add', beat === 1 ? ramp(0.04, 0.72) : 0);
  const addStarted = state.cues?.['trace-add']
    ? state.cues['trace-add'].phase !== 'before'
    : beat === 1 && progress >= 0.04;
  const recordPhases = ['trace-add-r1', 'trace-add-r2', 'trace-add-r4'].map((id, index) => {
    const cue = state.cues?.[id];
    if (cue) return cue.phase;
    // Storyboards can have only the combined addition cue.
    const position = addProgress * 3 + 1e-9;
    if (!addStarted || position < index) return 'before';
    return position < index + 1 ? 'during' : 'after';
  });
  const completedContributions = recordPhases.filter((phase) => phase === 'after').length;
  const visibleContributions = recordPhases.filter((phase) => phase !== 'before').length;
  const aggregateProgress =
    completedContributions === 3
      ? cueProgressFromState(state, 'trace-aggregate', beat === 1 ? ramp(0.72, 0.86) : 0)
      : 0;
  const noiseProgress =
    aggregateProgress > 0
      ? cueProgressFromState(state, 'trace-noise', beat === 1 ? ramp(0.86, 0.98) : 0)
      : 0;
  const selectionProgress = cueProgressFromState(
    state,
    'select-checkpoint',
    beat === 2 ? ramp(0.12, 0.32) : 0,
  );
  const ledgerProgress =
    selectionProgress > 0
      ? cueProgressFromState(state, 'account-selection', beat === 2 ? ramp(0.34, 0.52) : 0)
      : 0;
  const compositionProgress =
    ledgerProgress > 0
      ? cueProgressFromState(state, 'compose-releases', beat === 2 ? ramp(0.54, 0.68) : 0)
      : 0;
  const accountantProgress =
    compositionProgress > 0
      ? cueProgressFromState(state, 'matching-accountant', beat === 2 ? ramp(0.7, 0.82) : 0)
      : 0;
  const controlsProgress =
    accountantProgress > 0
      ? cueProgressFromState(state, 'other-data-paths', beat === 2 ? ramp(0.84, 0.96) : 0)
      : 0;
  const clipped = clipVector([3, 4], 1).clipped;
  const records = [[0.4, 0.3], [0.6, 0.8], clipped];
  const { aggregate, noisy } = updateWithNoise(records, [0.2, -0.3]);
  return {
    clipProgress,
    clipOutcomeProgress,
    addProgress,
    completedContributions,
    visibleContributions,
    aggregateProgress,
    noiseProgress,
    selectionProgress,
    ledgerProgress,
    compositionProgress,
    accountantProgress,
    controlsProgress,
    clipped,
    records,
    aggregate,
    noise: [0.2, -0.3],
    noisy,
  };
}
export function utilityDiagnostics(noiseMultiplier, bound = 1) {
  if (!Number.isFinite(noiseMultiplier) || noiseMultiplier < 0)
    throw new RangeError('noise multiplier must be finite and nonnegative');
  const records = [
    [0.4, 0.3],
    [0.6, 0.8],
    [3, 4],
    [0.3, 0.4],
  ];
  const clipped = records.map((vector) => clipVector(vector, bound).clipped);
  const signal = sumVectors(clipped).map((value) => value / clipped.length);
  const norm = Math.hypot(...signal);
  const perpendicular = [-signal[1] / norm, signal[0] / norm];
  const noisy = signal.map((value, i) => value + noiseMultiplier * bound * perpendicular[i]);
  const utility =
    signal.reduce((sum, value, i) => sum + value * noisy[i], 0) / (norm * Math.hypot(...noisy));
  const clippedCount = records.reduce(
    (count, vector) => count + Number(clipVector(vector, bound).norm > bound),
    0,
  );
  return {
    records,
    clipped,
    signal,
    noisy,
    clippedCount,
    clippingRate: clippedCount / records.length,
    utility,
  };
}
export function replacementSensitivity(state) {
  const cue = state.cues?.['replace-one'],
    progress = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : clamp01((state.beatP ?? 0) / 0.6);
  const old = [-1, 0],
    replacement = [-1 + 2 * progress, 0],
    difference = replacement.map((v, i) => v - old[i]);
  const pairDistance = Math.hypot(...difference),
    sensitivity = 2,
    batch = 3,
    normalized =
      state.cues?.['public-normalizer']?.phase !== 'before' &&
      Boolean(state.cues?.['public-normalizer']);
  return {
    progress,
    old,
    replacement,
    difference,
    pairDistance,
    sensitivity,
    batch,
    normalized,
    bound: normalized ? sensitivity / batch : sensitivity,
  };
}
