import { clamp } from './arithmetic.mjs';
export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const pairedOutcomeFocusTarget = (r, m) =>
  `model-${m}-${r.a === r.b ? 'shared' : r[m] ? 'only-pass' : 'only-fail'}-${slug(r.task)}`;
export const pairedDifferenceFocusTarget = (r) =>
  `paired-${r.b > r.a ? 'positive' : r.b < r.a ? 'negative' : 'zero'}-difference-${slug(r.task)}`;
export function cueProgress(state, id, beat, a = 0.1, z = 0.82) {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  const c = state.cues?.[id];
  return c
    ? clamp(c.progress ?? (c.phase === 'after' ? 1 : 0))
    : clamp(((state.beatP ?? 0) - a) / (z - a));
}
export const started = (s, id, b) =>
  (s.beat ?? 0) > b ||
  ((s.beat ?? 0) === b && (s.cues?.[id] ? s.cues[id].phase !== 'before' : (s.beatP ?? 0) >= 0.1));
export const COMPLETED_HYPOTHESIS_RESULTS = new Set([
  'intro-receipt',
  'pair-lift',
  'forty-lift',
  'size-receipt',
  'power-receipt',
  'power-large',
  'bootstrap-zero',
  'holdout-count',
  'holdout-lift',
  'release-receipt',
  'tail-result',
  'search-risk',
  'useful-hold',
  'subset-run',
  'subset-count',
  'return-one',
  'hyp-variance-covariance',
  'hyp-target-first',
  'hyp-target-any',
  'hyp-target-unordered',
  'hyp-estimator-result',
  'hyp-estimator-expectation',
  'hyp-macro-mean',
  'hyp-macro-pooling',
  'hyp-macro-interval',
  'hyp-protocol-dedup',
  'hyp-protocol-selector',
]);
export const completedHypothesisResult = (state, id, beat) => cueProgress(state, id, beat) === 1;
export const resultOrOperation = (state, id, beat) =>
  COMPLETED_HYPOTHESIS_RESULTS.has(id)
    ? completedHypothesisResult(state, id, beat)
    : started(state, id, beat);
export function joinTaskResults(a, b) {
  const map = (rows) => {
    const m = new Map();
    for (const r of rows) {
      if (typeof r.id !== 'string' || !r.id || m.has(r.id) || ![0, 1].includes(r.pass))
        throw new TypeError('Unique task IDs and binary outcomes required');
      m.set(r.id, r);
    }
    return m;
  };
  const aa = map(a),
    bb = map(b);
  return {
    rows: [...aa].map(([id, r]) => ({
      id,
      a: r.pass,
      b: bb.get(id)?.pass ?? null,
      difference: bb.has(id) ? bb.get(id).pass - r.pass : null,
    })),
    unmatchedB: [...bb.keys()].filter((id) => !aa.has(id)),
  };
}
