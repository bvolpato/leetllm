import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function wilsonLower(success, n) {
  assert(Number.isInteger(success) && Number.isInteger(n) && n > 0 && success >= 0 && success <= n);
  const z = 1.96,
    p = success / n;
  return (
    (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) /
    (1 + (z * z) / n)
  );
}
export function population(hits) {
  const rows = Array.from(
    {
      length: 10,
    },
    (_, i) => ({
      id: `R${i + 1}`,
      hit: i < hits,
      latency: i < hits ? 20 : 1020,
    }),
  );
  const sorted = [...rows].sort((a, b) => a.latency - b.latency);
  return {
    rows,
    sorted,
    hits,
    generations: rows.filter((row) => !row.hit).length,
    mean: rows.reduce((sum, row) => sum + row.latency, 0) / rows.length,
    p95: sorted[Math.ceil(0.95 * rows.length) - 1].latency,
    cost: rows.length * 0.00008 + rows.filter((row) => !row.hit).length * 0.004,
    baseline: rows.length * 0.004,
  };
}
export function canonicalPythonJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalPythonJson).join(', ') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ': ' + canonicalPythonJson(value[key]))
        .join(', ') +
      '}'
    );
  return JSON.stringify(value);
}
export function scaledCosine(left, right) {
  if (!left.length || left.length !== right.length)
    throw Error('vectors must have the same nonzero dimension');
  if (![...left, ...right].every((v) => typeof v === 'number' && Number.isFinite(v)))
    throw Error('vector coordinates must be finite numbers');
  const a = Math.max(...left.map(Math.abs)),
    b = Math.max(...right.map(Math.abs));
  if (!a || !b) throw Error('cosine is undefined for a zero vector');
  const l = left.map((v) => v / a),
    r = right.map((v) => v / b),
    ln = Math.hypot(...l),
    rn = Math.hypot(...r);
  return Math.max(
    -1,
    Math.min(
      1,
      l.reduce((sum, v, i) => sum + ((v / ln) * r[i]) / rn, 0),
    ),
  );
}
export function servingWindow(
  n,
  hits,
  { lookupMs = 20, generationMs = 1000, lookupCost = 0.00008, generationCost = 0.004 } = {},
) {
  assert(Number.isInteger(n) && n > 0 && Number.isInteger(hits) && hits >= 0 && hits <= n);
  const generations = n - hits,
    rank = Math.ceil(0.95 * n),
    mean = (hits * lookupMs + generations * (lookupMs + generationMs)) / n,
    cost = n * lookupCost + generations * generationCost;
  return {
    n,
    hits,
    generations,
    rank,
    mean,
    p95: rank <= hits ? lookupMs : lookupMs + generationMs,
    cost,
    baseline: n * generationCost,
    saving: n * generationCost - cost,
    shadowGenerations: n,
    shadowCost: n * (lookupCost + generationCost),
    breakEven: lookupCost / generationCost,
  };
}
export const cueFinished = (state, id, fallback = 0.7) =>
  state.cues ? state.cues[id]?.phase === 'after' : (state.beatP ?? 0) >= fallback;

export function cueProgress(state, beat, id, start = 0.15, end = 0.7) {
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat ? 1 : 0;
  if (state.cues) {
    const cue = state.cues[id];
    if (!cue || cue.phase === 'before') return 0;
    return cue.phase === 'after' ? 1 : cue.progress;
  }
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}
