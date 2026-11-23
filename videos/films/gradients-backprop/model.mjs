import { BATCH_HISTORY, finiteDifference, hiddenStep, hiddenUnit, latencyExample, precisionProbe } from './arithmetic.mjs';
export function validateModel() {
  const nudges = [0.24, 0.001, 0.00001];
  const slopes = nudges.map(finiteDifference);
  if (slopes.some((slope, i) => Math.abs(slope - (4 + 4 * nudges[i])) > 1e-8)) {
    throw new Error('Finite differences must match the constructed quadratic');
  }
  if (!(
    Math.abs(slopes[2] - 4) < Math.abs(slopes[1] - 4) &&
    Math.abs(slopes[1] - 4) < Math.abs(slopes[0] - 4)
  )) {
    throw new Error('Shrinking h must move the secant slope toward 4');
  }
  const exercise = latencyExample([2, 2], [3, 1], 7);
  const updated = [2, 2].map((weight, i) => weight - 0.05 * exercise.gradient[i]);
  if (
    exercise.prediction !== 8 ||
    exercise.gradient.join(',') !== '6,2' ||
    latencyExample(updated, [3, 1], 7).loss > 1e-20 ||
    Math.abs(latencyExample(updated, [1, 2], 4).prediction - 5.5) > 1e-12
  ) {
    throw new Error('The final challenge must preserve its training and unseen-request arithmetic');
  }
  const single = precisionProbe(true);
  if (
    Math.abs(precisionProbe().slope - 4) > 1e-8 ||
    Math.abs(single.slope - 3.814697265625) > 1e-8 ||
    single.storedSpacing !== 2 ** -19 || single.slopeAtStoredSpacing !== 4
  ) {
    throw new Error('The precision comparison must come from the displayed rounded operands');
  }
  if (
    BATCH_HISTORY[0].loss !== 43.375 || BATCH_HISTORY[0].gradient[0] !== -36 ||
    BATCH_HISTORY[10].loss.toFixed(6) !== '0.003643' || BATCH_HISTORY[100].loss.toFixed(6) !== '0.000709'
  ) {
    throw new Error('The batch readouts must use the mean loss at the displayed completed-update count');
  }
  const previous = hiddenStep(0.05);
  const fresh = hiddenStep(0.05, 1, 2);
  const copied = hiddenUnit(previous.after.weights, fresh.before.input, fresh.before.target);
  if (
    previous.before.loss !== fresh.before.loss || fresh.before.gradient.join(',') !== '-2,-2,-0.5,-1' ||
    Math.abs(copied.prediction - 2.23) > 1e-12 || Math.abs(fresh.after.prediction - 1.9675) > 1e-12 ||
    !(fresh.after.loss < copied.loss && copied.loss < fresh.before.loss)
  ) {
    throw new Error('The copied and recomputed gradients must be scored on the same one-block request');
  }
  return true;
}
