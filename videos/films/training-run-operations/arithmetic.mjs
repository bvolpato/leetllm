import assert from 'node:assert/strict';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const motion = (p) => {
  const q = clamp((p - 0.12) / 0.7);
  return q * q * (3 - 2 * q);
};
export function firstAdaptiveMovement(gradient, rate, epsilon) {
  assert(
    Number.isFinite(gradient) &&
      Number.isFinite(rate) &&
      rate >= 0 &&
      Number.isFinite(epsilon) &&
      epsilon > 0,
  );
  return (rate * gradient) / (Math.abs(gradient) + epsilon);
}
export function trainingMemory(parameters, bits, capacityGiB) {
  assert(parameters > 0 && bits > 0 && capacityGiB > 0);
  const baseGiB = (parameters * bits) / 8 / 2 ** 30;
  return {
    baseGiB,
    capacityGiB,
    remainderGiB: capacityGiB - baseGiB,
    baseFits: baseGiB <= capacityGiB,
    fullTrainingFitKnown: false,
  };
}
export function consumedCursorPlan(consumed, prefetched) {
  assert(
    Number.isInteger(consumed) &&
      consumed >= 0 &&
      Number.isInteger(prefetched) &&
      prefetched >= consumed,
  );
  return {
    consumed,
    prefetched,
    resume: consumed,
    ahead: prefetched - consumed,
  };
}
export function adamScaleProposal({ rate, beta1, beta2, epsilon }, kappa) {
  assert(Number.isFinite(kappa) && kappa > 0);
  const proposal = {
    rate: rate * Math.sqrt(kappa),
    beta1: 1 - kappa * (1 - beta1),
    beta2: 1 - kappa * (1 - beta2),
    epsilon: epsilon / Math.sqrt(kappa),
  };
  assert(
    proposal.beta1 >= 0 && proposal.beta1 < 1 && proposal.beta2 >= 0 && proposal.beta2 < 1,
    'scaled Adam coefficients must remain valid',
  );
  return proposal;
}
