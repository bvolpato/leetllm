import { BATCH_FEATURES, BATCH_TARGETS, NONLINEAR_START } from './fixtures.mjs';
export const derivativeLoss = (weight) => (2 * weight - 5) ** 2;
export function latencyExample(weights, features = [2, 1], target = 5) {
  const prediction = weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
  const error = prediction - target;
  return {
    prediction,
    error,
    loss: error ** 2,
    gradient: features.map((feature) => 2 * error * feature),
  };
}
export function precisionProbe(singlePrecision = false) {
  const f = singlePrecision ? Math.fround : (value) => value;
  const epsilon = f(1e-6);
  const loss = (w) => f(f(f(2 * w) - 5) ** 2);
  const upperWeight = f(3 + epsilon), lowerWeight = f(3 - epsilon);
  const plus = loss(upperWeight), minus = loss(lowerWeight);
  const lossDifference = f(plus - minus);
  const storedSpacing = upperWeight - lowerWeight;
  return {
    plus,
    minus,
    epsilon,
    upperWeight,
    lowerWeight,
    lossDifference,
    storedSpacing,
    slope: f(lossDifference / f(2 * epsilon)),
    slopeAtStoredSpacing: lossDifference / storedSpacing,
  };
}
export function finiteDifference(h) {
  if (!Number.isFinite(h) || h <= 0) throw new RangeError('h must be positive');
  return (derivativeLoss(3 + h) - derivativeLoss(3)) / h;
}
export const gradientClamp = (x) => Math.max(0, Math.min(1, x));
export const gradientPhase = (p, a = 0.1, z = 0.85) => gradientClamp((p - a) / (z - a));
export function hiddenUnit(weights = NONLINEAR_START, input = 2, target = 5) {
  const [w1, b1, w2, b2] = weights,
    h = w1 * input + b1,
    z = Math.max(0, h),
    prediction = w2 * z + b2,
    error = prediction - target,
    signal = 2 * error,
    gate = h > 0 ? 1 : 0;
  return {
    weights: [...weights],
    input,
    target,
    h,
    z,
    prediction,
    error,
    loss: error * error,
    signal,
    gate,
    inputGradient: signal * w2 * gate * w1,
    gradient: [signal * w2 * gate * input, signal * w2 * gate, signal * z, signal],
  };
}
export function hiddenStep(rate, input = 2, target = 5) {
  const before = hiddenUnit(NONLINEAR_START, input, target),
    weights = NONLINEAR_START.map((v, i) => v - rate * before.gradient[i]);
  return {
    before,
    after: hiddenUnit(weights, input, target),
    rate,
  };
}
export function batchGradientState(weights = [0, 0]) {
  const rows = BATCH_FEATURES.map((features, i) => ({
    ...latencyExample(weights, features, BATCH_TARGETS[i]),
    features,
    target: BATCH_TARGETS[i],
    id: 'R' + (i + 1),
  }));
  return {
    weights: [...weights],
    rows,
    loss: rows.reduce((s, r) => s + r.loss, 0) / 4,
    gradient: [0, 1].map((i) => rows.reduce((s, r) => s + r.gradient[i], 0) / 4),
  };
}
export const BATCH_HISTORY = (() => {
  let weights = [0, 0];
  const history = [];
  for (let step = 0; step <= 101; step++) {
    const current = batchGradientState(weights);
    history.push({
      step,
      ...current,
    });
    weights = weights.map((v, i) => v - 0.03 * current.gradient[i]);
  }
  return history;
})();
export function reluBranchState(weight = 2) {
  const h = 2 * weight,
    z = Math.max(0, h),
    prediction = z + 2,
    error = prediction - 5,
    signal = 2 * error,
    gate = h > 0 ? 1 : 0;
  return {
    weight,
    h,
    z,
    prediction,
    loss: error * error,
    signal,
    gate,
    promptGradient: signal * gate * 2,
    queueGradient: signal,
  };
}
export function reluCornerDifference(h) {
  if (!(h > 0 && Number.isFinite(h))) throw new RangeError('Positive finite corner probe required');
  const loss = (w) => (Math.max(0, 2 * w) - 3) ** 2;
  return {
    h,
    left: (loss(0) - loss(-h)) / h,
    right: (loss(h) - loss(0)) / h,
    center: (loss(h) - loss(-h)) / (2 * h),
  };
}
