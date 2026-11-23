import { calls, hostKernelFixtures, tracks } from './fixtures.mjs';
import { clamp, dispatch, executeHostKernelCase, mix, motion, rms, sum } from './arithmetic.mjs';
import { sceneClock } from './worksheet.mjs';

export function introConstruction(beat, progress, cues, beatCount) {
  const values = [3, 4], weights = [1, 2], epsilon = 1e-5;
  const reference = { values, weights, epsilon, ...rms(values, weights, epsilon) };
  if (cues || beatCount > 2 || beat >= 2) {
    const clock = sceneClock({ beat, beatP: progress, cues });
    const square = clock.progress('kg-intro-square', 1, 0, 0.12);
    const mean = clock.progress('kg-intro-mean', 1, 0.12, 0.21);
    const addedEpsilon = clock.progress('kg-intro-epsilon', 1, 0.21, 0.29);
    const scale = clock.progress('kg-intro-scale', 1, 0.39, 0.48);
    const normalize = clock.progress('kg-intro-normalize', 1, 0.48, 0.62);
    const weight = clock.progress('kg-intro-weight', 2, 0.17, 0.49);
    return {
      stage:
        beat === 0
          ? 0
          : weight === 1
            ? 8
            : weight > 0
              ? 6
              : normalize > 0
                ? 5
                : scale === 1
                  ? 4
                  : addedEpsilon === 1
                    ? 3
                    : mean === 1
                      ? 2
                      : square > 0
                        ? 1
                        : 0,
      ...reference,
      squareCount: beat === 0 ? 0 : Math.ceil(square * 2),
      normalizedProgress: beat === 0 ? 0 : normalize,
      outputCount: beat === 0 ? 0 : Math.floor(weight * 2),
      weightProgress: weight,
    };
  }
  const elapsed = clamp(progress) * 23.498;
  const phase = (start, end) => {
    const q = clamp((elapsed - start) / (end - start));
    return q * q * (3 - 2 * q);
  };
  const thresholds = [0.1, 1.675, 3.15, 4.875, 6.8375, 9.375, 10.3875, 12.8875];
  return {
    ...reference,
    elapsed,
    stage: beat === 0 ? 0 : thresholds.filter((at) => elapsed >= at).length,
    squareCount: beat === 0 ? 0 : [0.75, 1.425].filter((at) => elapsed >= at).length,
    normalizedProgress: beat === 0 ? 0 : phase(6.8375, 8.9),
    weightProgress: beat === 0 ? 0 : phase(9.375, 12.4625),
    outputCount: beat === 0 ? 0 : [11.05, 12.4625].filter((at) => elapsed >= at).length,
  };
}
export function hiddenCaseSnapshot(beat, beatP) {
  const progress = clamp(beatP),
    executions = hostKernelFixtures.map(executeHostKernelCase);
  const cycle =
    beat === 0 ? motion(progress) * 4 : progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
  const caseIndex = beat === 0 ? Math.min(3, Math.floor(cycle)) : progress < 0.5 ? 4 : 5;
  const local = beat === 0 ? (cycle >= 4 ? 1 : cycle - caseIndex) : cycle;
  const current = executions[caseIndex],
    width = current.fixture.shape[1];
  const readCount = Math.min(width, Math.floor(clamp(local / 0.65) * (width + 1)));
  const loadedValues = current.rows[0].values.slice(0, readCount),
    loadedAddresses = current.rows[0].addresses.slice(0, readCount);
  const visible = beat === 0 ? 4 : 6,
    results = executions.map((result) => result.matches);
  return {
    executions,
    current,
    caseIndex,
    readCount,
    loadedValues,
    loadedAddresses,
    partialSquareSum: sum(loadedValues.map((value) => value * value)),
    results,
    visible,
    pass: results.slice(0, visible).every(Boolean),
  };
}
export function sampleModel(id, state, scene) {
  const step = state.beat ?? tracks[id].sample(state).snapshot.step,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      ...introConstruction(step, state.beatP, state.cues, scene?.beats?.length),
    };
  if (id === 'tail') {
    const values = [1, 2, 3, 4, 5],
      wrong = state.cues?.['kg-tail-wrong']?.progress ?? (step === 0 ? 1 : 1),
      repair = state.cues?.['kg-tail-repair']?.progress ?? (step > 0 ? 1 : 0),
      count = Math.floor(clamp(step === 0 ? wrong : repair) * 3 + 1e-9),
      padding = Array.from(
        {
          length: 3,
        },
        (_, i) => (step === 0 ? Number(i < count) : Number(i >= count)),
      ),
      terms = [...values.map((x) => x * x), ...padding],
      numerator = sum(terms),
      mean = numerator / 5;
    return {
      step,
      q,
      terms,
      numerator,
      mean,
      scale: 1 / Math.sqrt(mean + 1e-5),
      correct: sum(values.map((x) => x * x)) / 5,
    };
  }
  if (id === 'dispatch')
    return {
      step,
      q,
      calls: calls.map((r) => ({
        ...r,
        fast: dispatch(r),
      })),
      visible: step === 0 ? 1 : 5,
    };
  if (id === 'hidden')
    return {
      step,
      q,
      ...hiddenCaseSnapshot(step, state.beatP),
    };
  if (id === 'epsilon') {
    if (step === 2) {
      const reset = state.cues?.['kg-epsilon-base']?.progress ?? clamp(q / 0.18),
        negative = state.cues?.['kg-epsilon-negative']?.progress ?? clamp((q - 0.18) / 0.22),
        zero = state.cues?.['kg-epsilon-zero']?.progress ?? clamp((q - 0.6) / 0.2),
        a = zero === 1 ? 0 : negative === 1 ? -4 : reset === 1 ? 1 : 100,
        eps = Number((1e-5 * a * a).toExponential(6)),
        x = 0.001 * a;
      return {
        step,
        q,
        a,
        eps,
        value: a === 0 ? null : x / Math.sqrt(x * x + eps),
        reference: 0.001 / Math.sqrt(0.001 ** 2 + 1e-5),
        epsilonProgress: 1,
        invalid: a === 0,
      };
    }
    const cue = state.cues?.['epsilon-beat-2-focus-1'],
      progress = cue ? clamp(cue.progress) : q,
      epsilonProgress = progress * progress * (3 - 2 * progress),
      a = step === 0 ? Math.round(mix(1, 100, q) * 10) / 10 : 100,
      eps = step === 0 ? 1e-5 : Number(mix(1e-5, 1e-5 * a * a, epsilonProgress).toExponential(6)),
      x = 0.001 * a,
      value = x / Math.sqrt(x * x + eps),
      reference = 0.001 / Math.sqrt(0.001 ** 2 + 1e-5);
    return {
      step,
      q,
      a,
      eps,
      value,
      reference,
      epsilonProgress,
    };
  }
  if (id === 'traffic')
    return {
      step,
      q,
      us: 12,
      logical: 6 * 10400 * 1000,
      hbm: 30000000,
      logicalRate: (6 * 10400 * 1000) / 12e-6 / 1e12,
      hbmRate: 30000000 / 12e-6 / 1e12,
    };
  const failed = step > 0 && q > 0.2,
    replaced = failed && q > 0.65;
  return {
    step,
    q,
    failed,
    replaced,
    routing: failed ? 'REFERENCE' : 'CANDIDATE',
    worker: failed ? 'UNHEALTHY' : 'HEALTHY',
  };
}
export function kernelChapterFrame(id, state) {
  const b = state.beat ?? 0,
    progress = state.cues?.[`kg-${id}-voice-${b}`]?.progress ?? clamp(state.beatP ?? 0),
    at = (key, beat) =>
      b > beat ||
      (b === beat && (state.cues?.[`kg-${id}-${key}`]?.progress ?? clamp(state.beatP ?? 0)) >= 1);
  return {
    b,
    p: progress,
    at,
  };
}
