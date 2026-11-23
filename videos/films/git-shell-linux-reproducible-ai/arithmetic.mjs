import assert from 'node:assert/strict';
export const jsonl = (values) => values.map((row) => JSON.stringify(row)).join('\n') + '\n';
export function score(values) {
  const correct = values.filter(
    (row) =>
      row.expected.trim().toLowerCase() === (row.prediction ?? row.predicted).trim().toLowerCase(),
  ).length;
  return {
    correct,
    matches: correct,
    total: values.length,
    fraction: values.length ? correct / values.length : 0,
    passes: values.length > 0 && correct * 3 >= values.length * 2,
  };
}
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const mix = (a, b, p) => a + (b - a) * p;
export const smooth = (p) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};
export const phase = (p, a, z) => clamp((p - a) / (z - a));
export const sameProcess = (a, b) =>
  ['owner', 'pid', 'started', 'command'].every((key) => a[key] === b[key]);
export const newlineCount = (value) => Array.from(value).filter((c) => c === '\n').length;
export function pipelineStatus(statuses, pipefail = false) {
  return pipefail ? (statuses.findLast((status) => status !== 0) ?? 0) : (statuses.at(-1) ?? 0);
}
export function deviceEnumeration(physical, mask) {
  const chosen = mask === null ? physical : mask === '' ? [] : mask.split(',').map(Number);
  assert(
    chosen.every((d) => Number.isInteger(d) && physical.includes(d)) &&
      new Set(chosen).size === chosen.length,
    'supplied enumeration requires distinct available physical IDs',
  );
  return chosen.map((physical, logical) => ({
    logical,
    physical,
  }));
}
