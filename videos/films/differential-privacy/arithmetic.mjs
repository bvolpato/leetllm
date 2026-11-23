import assert from 'node:assert/strict';
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export function clipVector(vector, bound = 1) {
  if (!Number.isFinite(bound) || bound <= 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new RangeError('vector and clipping bound must be finite; bound must be positive');
  }
  const norm = Math.hypot(...vector);
  const scale = norm > bound ? bound / norm : 1;
  return {
    norm,
    scale,
    clipped: vector.map((value) => value * scale),
  };
}
export function sumVectors(vectors) {
  if (vectors.length === 0 || vectors.some((vector) => vector.length !== vectors[0].length)) {
    throw new RangeError('vectors must be nonempty and have equal dimensions');
  }
  return vectors[0].map((_, i) => vectors.reduce((sum, vector) => sum + vector[i], 0));
}
export function eventUpperBound(probability, epsilon, delta = 0) {
  return Math.exp(epsilon) * probability + delta;
}
export function probabilityWidths(probability, epsilon, delta, pixelsPerProbability = 400000) {
  return {
    reference: probability * pixelsPerProbability,
    multiplicative: eventUpperBound(probability, epsilon) * pixelsPerProbability,
    slack: delta * pixelsPerProbability,
  };
}
export function privacyEventBand(epsilon, delta, neighborProbability = 0.001) {
  assert(
    Number.isFinite(epsilon) && epsilon >= 0 && Number.isFinite(delta) && delta >= 0 && delta <= 1,
  );
  assert(
    Number.isFinite(neighborProbability) && neighborProbability >= 0 && neighborProbability <= 1,
  );
  return {
    lower: Math.max(0, (neighborProbability - delta) * Math.exp(-epsilon)),
    upper: Math.min(1, Math.exp(epsilon) * neighborProbability + delta),
    neighborProbability,
  };
}
export function updateWithNoise(vectors, noise) {
  const aggregate = sumVectors(vectors);
  if (aggregate.length !== noise.length)
    throw new RangeError('noise dimension must match aggregate');
  return {
    aggregate,
    noisy: aggregate.map((value, i) => value + noise[i]),
  };
}
