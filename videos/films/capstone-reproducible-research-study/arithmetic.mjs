export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const mean = (a) => sum(a) / a.length;
export const potential = (s) => -(6 - s) / 6;
export const shaping = (s, next) => 0.95 * potential(next) - potential(s);
export function qUpdate(q, reward, nextValue, terminal = false) {
  return q + 0.2 * (reward + (terminal ? 0 : 0.95 * nextValue) - q);
}
export function quantile(values, probability) {
  const sorted = [...values].sort((a, b) => a - b),
    position = probability * (sorted.length - 1),
    left = Math.floor(position);
  return sorted[left] + (sorted[Math.ceil(position)] - sorted[left]) * (position - left);
}
export const rsClamp = (v) => Math.max(0, Math.min(1, v));
