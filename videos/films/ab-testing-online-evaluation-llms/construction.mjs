import { clamp, mix, motion, sum } from './arithmetic.mjs';
import { assignmentBeatSeconds, observedAt, observedUserRows, outcomes } from './fixtures.mjs';
import {
  experimentRequirements,
  interval,
  rates,
  sampleSize,
  telemetryReadouts,
  tracks,
} from './model.mjs';
export function assignmentSnapshot(beat, progress) {
  const seconds = clamp(progress) * assignmentBeatSeconds[Math.min(1, beat)];
  const users = outcomes.map((row, i) => {
    const raw = beat > 0 ? 1 : clamp((seconds - (6.675 + i * 0.8)) / 0.65),
      travel = raw * raw * (3 - 2 * raw);
    const destination = {
      x: row.assigned === 'C' ? 350 : 1550,
      y: 430 + (i % 3) * 180,
    };
    const leg = (a, z) => {
        const p = clamp((raw - a) / (z - a));
        return p * p * (3 - 2 * p);
      },
      corridor = row.assigned === 'C' ? 700 : 1220;
    const cx =
      raw < 0.3 ? mix(960, corridor, leg(0, 0.3)) : mix(corridor, destination.x, leg(0.7, 1));
    const cy = mix(360 + i * 85, destination.y, leg(0.3, 0.7));
    return {
      ...row,
      travel,
      settled: raw === 1,
      cx,
      cy,
      observed: beat > 0 && seconds >= observedAt[i],
    };
  });
  const mature = users.filter((row) => row.observed),
    complete = mature.length === users.length;
  return {
    seconds,
    users,
    settled: users.every((row) => row.settled),
    mature,
    complete,
    assignedRates: complete ? rates(mature) : null,
    servedOnly: complete ? mature.filter((row) => row.served === 'T') : [],
    filterApplied: beat > 0 && seconds >= 14.6625,
  };
}
export function servedSelectionSnapshot(progress) {
  const users = outcomes
      .filter((row) => row.assigned === 'T')
      .map((row, i) => ({
        ...row,
        drop: i === 0 ? 0 : clamp((progress - (i - 1) * 0.42) / 0.32),
      })),
    selected = users.filter((row) => row.drop < 1),
    success = sum(selected.map((row) => row.y));
  return {
    users,
    n: selected.length,
    success,
    rate: success / selected.length,
  };
}
export function uncertaintySnapshot(beat, progress) {
  const seconds = clamp(progress) * 24.338,
    copies = beat === 0 ? 1 : seconds < 1.5 ? 1 : seconds < 2.95 ? 2 : 3;
  return {
    ...telemetryReadouts[copies - 1],
    example: observedUserRows[16],
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro') {
    const observed = interval();
    return {
      step,
      q,
      a: observed.a,
      b: observed.b,
      lift: observed.d,
      relative: observed.d / observed.a,
      checks: [
        {
          name: 'Safety',
          change: -0.001,
          limit: -0.0005,
          pass: -0.001 >= -0.0005,
        },
        {
          name: 'Latency',
          change: 410,
          limit: 300,
          pass: 410 <= 300,
        },
        {
          name: 'Cost',
          change: 0.018,
          limit: 0.01,
          pass: 0.018 <= 0.01,
        },
      ],
    };
  }
  if (id === 'screen') {
    const results = [1, 1, 1, 1, 0.5],
      visible = step === 0 ? Math.max(1, Math.floor(q * 5)) : 5;
    return {
      step,
      q,
      results,
      visible,
      score: sum(results.slice(0, visible)) / visible,
    };
  }
  if (id === 'assignment')
    return {
      step,
      q,
      ...assignmentSnapshot(state.beat ?? 0, state.beatP ?? 0),
    };
  if (id === 'power')
    return {
      step,
      q,
      rows: [0.05, 0.03, 0.02].map((delta) => ({
        delta,
        n: sampleSize(delta),
      })),
      focus: step === 0 ? 0 : Math.min(2, Math.floor(q * 3)),
    };
  if (id === 'uncertainty')
    return {
      step,
      q,
      ...uncertaintySnapshot(state.beat ?? 0, state.beatP ?? 0),
    };
  if (id === 'ratio') {
    const a = step === 0 ? 5040 : Math.round(mix(5040, 5250, q)),
      b = 10000 - a,
      chi = (a - 5000) ** 2 / 5000 + (b - 5000) ** 2 / 5000;
    return {
      step,
      q,
      a,
      b,
      chi,
      flag: chi > 10.8276,
    };
  }
  if (id === 'looks') {
    const pvalues = [0.23, 0.036, 0.008, 0.02],
      measured = state.cues && step > 0,
      visible = measured
        ? state.cues['looks-third-receipt']?.phase !== 'before'
          ? 3
          : state.cues['looks-second-receipt']?.progress === 1
            ? 2
            : 1
        : step === 0
          ? state.beatP > 0.8
            ? 1
            : 0
          : state.beatP < 0.12
            ? 1
            : state.beatP < 0.3
              ? 2
              : 3,
      threshold = 0.05 / 4,
      first = pvalues.slice(0, visible).findIndex((p) => p <= threshold);
    return {
      step,
      q,
      pvalues,
      visible,
      threshold,
      first: first < 0 ? null : first + 1,
    };
  }
  return {
    step,
    q,
    safety:
      step === 0
        ? {
            low: -0.0012,
            high: 0.0002,
          }
        : null,
    margin: -0.0005,
    eligible: false,
  };
}
export function onlineCueProgress(state, id, beat, start = 0.1, end = 0.85) {
  if (state.cues) {
    const cue = state.cues[id];
    if (!cue) throw new Error('Undeclared online experiment cue ' + id);
    return cue.progress;
  }
  return state.beat > beat
    ? 1
    : state.beat < beat
      ? 0
      : clamp((state.beatP - start) / (end - start));
}
export function freshExperimentSnapshot(state) {
  const p = (suffix, beat) => onlineCueProgress(state, 'oa-fresh-release-' + suffix, beat),
    repair = p('repair', 2),
    base = experimentRequirements(),
    current = experimentRequirements({
      times: [mix(3.2, 2.8, repair), mix(3.2, 2.8, repair)],
    });
  return {
    ...current,
    repair,
    counts: p('counts', 0) === 1,
    safetyInput: p('safety', 0) === 1,
    clockInput: p('clock', 0) === 1,
    hold: p('hold', 1) === 1,
    difference: p('difference', 1) === 1,
    interval: p('interval', 1) === 1,
    safetyReveal: p('safety-pass', 1) === 1,
    verdict: p('eligible', 2) === 1 && repair === 1,
    base,
  };
}
