import {
  clamp,
  coverage,
  motion,
  residency,
  resolve,
  specializationFixture,
} from './arithmetic.mjs';
import { ARTIFACT, tracks } from './fixtures.mjs';
import { publishable } from './model.mjs';
export function compilerIntroFrame(state) {
  const beat = state.beat ?? 0,
    seconds = clamp(state.beatP ?? 0) * (beat === 0 ? 20.138 : 23.474);
  const phase = (from, to) => clamp((seconds - from) / (to - from));
  const x = [0, 0.25, 0.5, 0.75],
    y = [-3, -2, -1, 0];
  const stages =
    beat === 0 ? [1, 0, 0, 0] : [1, phase(4.4, 6.5), phase(6.675, 10.2), phase(10.675, 12.675)];
  return {
    step: beat,
    x,
    y,
    output: x.map((value, i) => value + y[i]),
    stages,
    operation: 'add #17',
    target: 'target A',
    imageTarget: 'target A',
    compatible: true,
    loaded: stages[3] === 1,
    visibleOutputs: beat > 0 ? 4 : Math.min(4, Math.floor(phase(2, 10) * 4.001)),
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      ...compilerIntroFrame(state),
      q,
    };
  if (id === 'artifacts')
    return {
      step,
      q,
      focus: Math.min(3, Math.floor(q * 4)),
      revealed: step === 0 ? Math.min(4, Math.floor(q * 4) + 1) : 4,
    };
  if (id === 'loader') {
    const ptxCue = state.cues?.['loader-ptx-path'],
      active = state.cues ? (state.beat ?? 0) : step,
      native = active === 0 && (ptxCue ? ptxCue.phase === 'before' : q < 0.48),
      ptx = active === 0,
      coldProgress =
        active === 0 && !native ? (state.cues?.['loader-first-request-work']?.progress ?? q) : 0;
    return {
      step,
      q,
      native,
      ptx,
      result: resolve(native, ptx),
      coldProgress,
    };
  }
  if (id === 'registers') {
    const r =
      step === 0
        ? state.cues
          ? state.cues['register-add-one']?.progress === 1
            ? 33
            : 32
          : state.beatP < 0.66
            ? 32
            : 33
        : [33, 41, 65, 129][Math.min(3, Math.floor(q * 4))];
    return {
      step,
      q,
      ...residency(r),
      options: [32, 33, 41, 65, 129].map(residency),
    };
  }
  if (id === 'identity')
    return {
      step,
      q,
      ...specializationFixture(step === 0 ? 1 : 2, step > 0 && q > 0.6),
    };
  if (id === 'publication') {
    const built = step > 0 ? 8 : Math.floor(q * 8),
      candidate = ARTIFACT.slice(0, built),
      published = publishable(candidate);
    return {
      step,
      q,
      built,
      published,
      publicBytes: published ? candidate.length : 0,
      duplicateJobs: step === 0 ? 8 : 1,
    };
  }
  const map = coverage(10, 4),
    visiblePrograms = step > 0 ? 3 : q < 0.25 ? 1 : q < 0.8 ? 2 : 3;
  return {
    step,
    q,
    map,
    visiblePrograms,
    stage: step === 0 ? 'coverage' : 'surfaces',
  };
}
