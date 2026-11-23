import { bf16, fp16 } from './arithmetic.mjs';
import {
  comparisonRuns,
  passesGates,
  policyPrecisionFixture,
  precisionBoundaryFixture,
  reductionPrecisionFixture,
  unequalTokenFixture,
} from './fixtures.mjs';
import { below, weightAfter, weightHistory } from './weight-ruler.mjs';
import assert from 'node:assert/strict';
export function memoryInventory(progress) {
  const baseline = [0.4, 0.4, 0.8, 3.2],
    current = [0.4, 0.4, 0.8, 3.2 - 1.6 * progress];
  const total = current.reduce((a, v) => a + v, 0),
    original = baseline.reduce((a, v) => a + v, 0);
  return {
    baseline,
    current,
    total,
    original,
    saved: original - total,
    fraction: (original - total) / original,
  };
}
export function underflowState(beat, progress = 1) {
  const gradient = 2 ** -26,
    scale = beat === 0 ? 1 : 256,
    stored = fp16(gradient * scale);
  const recovered = beat === 2 && progress >= 0.55 ? stored / scale : null;
  return {
    gradient,
    scale,
    stored,
    recovered,
  };
}
export const cueProgressFromState = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, cue.progress))
    : Math.max(0, Math.min(1, fallback));
};
export function underflowTraceSnapshot(state = {}) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const ramp = (start, end) => Math.max(0, Math.min(1, (p - start) / (end - start)));
  const zeroProgress =
    beat > 0 ? 1 : cueProgressFromState(state, 'tiny-gradient', ramp(0.72, 0.94));
  const scaleProgress =
    beat < 1 ? 0 : beat > 1 ? 1 : cueProgressFromState(state, 'scale-gradient', ramp(0.04, 0.5));
  const storedProgress =
    beat > 1 ? 1 : beat === 1 ? cueProgressFromState(state, 'scaled-storage', ramp(0.52, 0.7)) : 0;
  const unscaleProgress =
    beat < 2 ? 0 : cueProgressFromState(state, 'unscale-gradient', ramp(0.02, 0.32));
  const recoveredProgress =
    beat === 2 ? cueProgressFromState(state, 'recovered-gradient', ramp(0.27, 0.5)) : 0;
  const forwardProgress =
    beat === 2 ? cueProgressFromState(state, 'forward-rounding', ramp(0.67, 0.9)) : 0;
  const gradient = 2 ** -26,
    scaled = gradient * 256;
  return {
    gradient,
    scale: 256,
    scaled,
    stored: fp16(scaled),
    recovered: fp16(scaled) / 256,
    zeroProgress,
    scaleProgress,
    scaledExponent: -26 + 8 * scaleProgress,
    storedProgress,
    unscaleProgress,
    recoveredProgress,
    forwardProgress,
    forwardInput: 1.0001,
    forwardStored: fp16(1.0001),
  };
}
export function overflowControllerState(beat, progress) {
  const seconds = progress * [17.232, 15.84, 18.176][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const scale = beat === 0 ? 1 + 255 * ramp(2.9875, 5.9375) : 256,
    gradient = 300,
    scaled = gradient * scale;
  const castVisible = beat > 0 || seconds >= 16.25,
    checked = beat > 1 || (beat === 1 && seconds >= 6.4875),
    backoff = beat > 1 || (beat === 1 && seconds >= 11.5875),
    wrong = beat === 2 && seconds >= 6.95;
  return {
    seconds,
    gradient,
    scale,
    scaled,
    castVisible,
    stored: castVisible ? fp16(scaled) : null,
    checked,
    backoff,
    nextScale: backoff ? 64 : 256,
    weight: 1,
    moment: 0.2,
    variance: 0.04,
    wrongMoment: wrong ? Infinity : 0.2,
    wrongVariance: wrong ? Infinity : 0.04,
    showCounterfactual: beat === 2 && seconds >= 4.725,
  };
}
export function accumulationState(beat, progress, cues) {
  const seconds = progress * [17.4, 17.352, 17.936][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const scale = 256,
    contributions = [
      [0.5, 0],
      [0, 0.25],
      [0.25, 0.25],
    ],
    completed =
      beat === 1 && cues
        ? ['first-batch', 'second-batch', 'third-batch'].filter((id) => cues[id]?.phase === 'after')
            .length
        : beat === 1
          ? Math.min(3, Math.floor(ramp(5.45, 9.175) * 3 + 1e-9))
          : beat > 1
            ? 3
            : 0;
  const finished = (id, fallback) => (cues ? cues[id]?.phase === 'after' : fallback);
  const scaled = contributions
    .slice(0, completed)
    .reduce((sum, g) => sum.map((v, i) => v + g[i] * scale), [0, 0]);
  return {
    seconds,
    scale,
    contributions,
    completed,
    scaled,
    unscaled: scaled.map((v) => v / scale),
    unscaleVisible: beat > 1 || (beat === 1 && finished('window-unscale', seconds >= 12.1375)),
    finiteVisible: beat > 1 || (beat === 1 && finished('window-finite', seconds >= 14.05)),
    stepVisible: beat > 1 || (beat === 1 && finished('window-step', seconds >= 16.3875)),
    normalize:
      beat === 2 ? cueProgressFromState({ cues }, 'ordering-b3-1', ramp(6.2875, 9.1375)) : 0,
    amplify:
      beat === 2 ? cueProgressFromState({ cues }, 'ordering-b3-2', ramp(9.5625, 12.2875)) : 0,
  };
}
export function validateModel() {
  const weights = weightHistory(6);
  assert(weights.every(({ direct }) => direct === 1));
  assert.equal(weights[1].master.toFixed(8), '0.99989998');
  assert.deepEqual(
    weights.map(({ copy }) => copy),
    [1, 1, 1, below, below, below, below],
  );
  assert.equal(weightAfter(1, -0.0003, fp16), below);
  assert.equal(weightAfter(1, 0.0003, fp16), 1);
  assert.equal(fp16(1.2e-8), 0);
  assert(bf16(1.2e-8) > 0);
  assert.equal(bf16(100000), 99840);
  const winners = (policy) =>
    comparisonRuns(policy)
      .filter(passesGates)
      .sort((a, b) => b.speed - a.speed);
  assert.deepEqual(
    winners(0.92).map((run) => run.name),
    ['B'],
  );
  assert.deepEqual(
    winners(0.93).map((run) => run.name),
    ['A', 'B'],
  );
  assert.equal(fp16(Infinity), Infinity);
  assert(Number.isNaN(fp16(NaN)));
  const reduce = reductionPrecisionFixture();
  assert.deepEqual(reduce.bf16, [256, 256, 0]);
  assert.deepEqual(reduce.fp32, [256, 257, 1]);
  const policy = policyPrecisionFixture();
  assert(policy.wideProbability < policy.uniform && policy.roundedProbability > policy.uniform);
  assert.deepEqual([policy.wideAction, policy.roundedAction], [1, 0]);
  assert.deepEqual(unequalTokenFixture(), {
    sum: -4,
    count: 4,
    mean: -1,
    meanOfMeans: 0,
  });
  const boundary = precisionBoundaryFixture();
  assert.equal(boundary.storedGradient, 0);
  assert.equal(boundary.recovered, boundary.gradient);
  assert.equal(boundary.storedWeight, 1);
  assert.equal(boundary.scaledAfterRounding, 1);
  assert.notEqual(boundary.forward, boundary.scaledAfterRounding);
  assert.equal(boundary.overflow, Infinity);
  assert(Number.isFinite(boundary.wider));
  assert.equal(overflowControllerState(0, 15 / 17.232).stored, null);
  assert.equal(overflowControllerState(0, 1).stored, Infinity);
  assert.equal(overflowControllerState(1, 1).nextScale, 64);
  assert.equal(overflowControllerState(2, 1).wrongMoment, Infinity);
  assert.deepEqual(accumulationState(1, 1).scaled, [192, 128]);
  assert.deepEqual(accumulationState(1, 1).unscaled, [0.75, 0.5]);
  assert.equal(accumulationState(1, 9.2 / 17.352).completed, 3);
  assert.equal(accumulationState(1, 12 / 17.352).unscaleVisible, false);
  assert.equal(fp16(2 ** -26), 0);
  assert.equal(fp16(2 ** -26 * 256) / 256, 2 ** -26);
  assert.equal(
    underflowTraceSnapshot({
      beat: 0,
      cues: {
        'tiny-gradient': {
          phase: 'before',
          progress: 0,
        },
      },
    }).zeroProgress,
    0,
  );
  assert.equal(
    underflowTraceSnapshot({
      beat: 0,
      cues: {
        'tiny-gradient': {
          phase: 'after',
          progress: 1,
        },
      },
    }).zeroProgress,
    1,
  );
  assert.equal(
    underflowTraceSnapshot({
      beat: 1,
      cues: {
        'scale-gradient': {
          phase: 'during',
          progress: 0.5,
        },
      },
    }).scaledExponent,
    -22,
  );
  assert.equal(
    underflowTraceSnapshot({
      beat: 1,
      cues: {
        'scaled-storage': {
          phase: 'after',
          progress: 1,
        },
      },
    }).stored,
    2 ** -18,
  );
  const restored = underflowTraceSnapshot({
    beat: 2,
    cues: {
      'unscale-gradient': {
        phase: 'after',
        progress: 1,
      },
      'recovered-gradient': {
        phase: 'after',
        progress: 1,
      },
      'forward-rounding': {
        phase: 'after',
        progress: 1,
      },
    },
  });
  assert.equal(restored.recovered, 2 ** -26);
  assert.equal(restored.forwardStored, 1);
  assert.equal(restored.forwardInput, 1.0001);
  assert.deepEqual(underflowState(0), {
    gradient: 2 ** -26,
    scale: 1,
    stored: 0,
    recovered: null,
  });
  assert.deepEqual(underflowState(1), {
    gradient: 2 ** -26,
    scale: 256,
    stored: 2 ** -18,
    recovered: null,
  });
  assert.equal(underflowState(2, 0.54).recovered, null);
  assert.equal(underflowState(2, 0.55).recovered, 2 ** -26);
  assert.equal(fp16(1 + 0.0001), 1);
  assert.equal(fp16(1 - 0.0003), 1 - 2 ** -11);
  assert.equal(fp16(65504), 65504);
  assert.equal(fp16(1e5), Infinity);
  assert(Number.isFinite(bf16(1e5)));
  assert.equal(fp16(1 + 2 ** -11), 1);
  assert.equal(fp16(1 + 3 * 2 ** -11), 1 + 2 ** -9);
  assert.equal((4.8e9 - 3.2e9) / 4.8e9, 1 / 3);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const m = memoryInventory(p);
    assert(Math.abs(m.saved - 1.6 * p) < 1e-12);
    assert(Math.abs(m.fraction - m.saved / m.original) < 1e-12);
  }
  return true;
}
