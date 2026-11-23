import { bf16, fp16 } from './arithmetic.mjs';
export function reductionPrecisionFixture() {
  const values = [256, 1, -256],
    trace = (cast) => {
      let sum = 0;
      return values.map((v) => (sum = cast(sum + v)));
    };
  return {
    values,
    bf16: trace(bf16),
    fp32: trace(Math.fround),
  };
}
export function policyPrecisionFixture() {
  const logits = [1, 1.002],
    rounded = logits.map(bf16),
    probability = (v) => 1 / (1 + Math.exp(v[1] - v[0])),
    uniform = 0.49975;
  const wideProbability = probability(logits),
    roundedProbability = probability(rounded);
  return {
    logits,
    rounded,
    uniform,
    wideProbability,
    roundedProbability,
    wideAction: uniform < wideProbability ? 0 : 1,
    roundedAction: uniform < roundedProbability ? 0 : 1,
  };
}
export function unequalTokenFixture() {
  return {
    sum: 2 - 6,
    count: 4,
    mean: (2 - 6) / 4,
    meanOfMeans: (2 - 2) / 2,
  };
}
export function precisionBoundaryFixture() {
  const gradient = 2 ** -26,
    scale = 256,
    requested = 1 - 1e-4,
    forward = 1 + 1e-4;
  return {
    gradient,
    storedGradient: fp16(gradient),
    recovered: fp16(gradient * scale) / scale,
    requested,
    storedWeight: fp16(requested),
    forward,
    roundedInput: fp16(forward),
    scaledAfterRounding: (fp16(forward) * scale) / scale,
    large: 1e5,
    overflow: fp16(1e5),
    wider: bf16(1e5),
  };
}

export const qualityGates = { format: 0.98, policy: 0.93 };

export function comparisonRuns(policyA = 0.92) {
  return [
    { name: 'A', format: 0.99, policy: policyA, speed: 1500, sameGpu: true, nonfiniteSteps: 0 },
    { name: 'B', format: 0.985, policy: 0.94, speed: 1300, sameGpu: true, nonfiniteSteps: 0 },
  ];
}

export function passesGates(run) {
  return (
    run.sameGpu &&
    run.nonfiniteSteps === 0 &&
    [run.format, run.policy].every((v) => Number.isFinite(v) && v >= 0 && v <= 1) &&
    run.format >= qualityGates.format &&
    run.policy >= qualityGates.policy &&
    Number.isFinite(run.speed) &&
    run.speed > 0
  );
}
