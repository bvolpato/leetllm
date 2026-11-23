import assert from 'node:assert/strict';
export function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length)
    throw new RangeError('vectors must have equal nonzero dimensions');
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const norms = Math.hypot(...a) * Math.hypot(...b);
  if (
    !a.every(Number.isFinite) ||
    !b.every(Number.isFinite) ||
    !Number.isFinite(norms) ||
    norms === 0
  )
    throw new RangeError('vectors must have finite positive norm');
  return dot / norms;
}
export function orderAudit(forwardA, reversedB) {
  const remappedA = 1 - reversedB;
  return {
    forwardA,
    remappedA,
    averageA: (forwardA + remappedA) / 2,
    stable: (forwardA > 0.5 && remappedA > 0.5) || (forwardA < 0.5 && remappedA < 0.5),
  };
}
export function tailOmission(probability, count) {
  assert(
    Number.isFinite(probability) &&
      probability >= 0 &&
      probability <= 1 &&
      Number.isInteger(count) &&
      count >= 0,
  );
  return (1 - probability) ** count;
}
