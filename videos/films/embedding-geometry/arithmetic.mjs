export const dot = (left, right) =>
  left.reduce((sum, value, index) => sum + value * right[index], 0);
export const norm = (vector) => Math.sqrt(dot(vector, vector));
export const cosine = (left, right) => dot(left, right) / (norm(left) * norm(right));
export const l2 = (left, right) =>
  Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0));
export const normalized = (vector) => vector.map((value) => value / norm(vector));
export const quantize = (vector, step) => vector.map((value) => Math.round(value / step) * step);
export const clip = (value) => Math.max(0, Math.min(1, value));
export function robustUnit(vector) {
  if (!vector.length || vector.some((v) => !Number.isFinite(v)))
    throw new RangeError('finite nonempty vector required');
  const scale = Math.max(...vector.map(Math.abs));
  if (!scale) throw new RangeError('zero vector has no direction');
  const scaled = vector.map((v) => v / scale),
    length = Math.hypot(...scaled);
  return scaled.map((v) => v / length);
}
export function scalarEncode(value, bound) {
  return Math.max(-127, Math.min(127, Math.round(value / (bound / 127))));
}
export function signCode(v) {
  if (!v.length || v.some((x) => !Number.isFinite(x)))
    throw new RangeError('finite nonempty vector required');
  return v.reduce((code, x, i) => code | (x > 0 ? 1 << i : 0), 0);
}
export const completedCue = (state, id) =>
  state.cues?.[id]?.phase === 'after' || (state.cues?.[id]?.progress ?? 0) >= 1;
