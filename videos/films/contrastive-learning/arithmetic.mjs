import { ANGLES, MINING_FIXTURE, NESTED_D, NESTED_Q, START, TAU } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, dotProduct } from 'vizmatic';
export function formatValue(v, n = 3) {
  return Number(v).toFixed(n);
}
export const vector = (angle) => [Math.cos(angle), Math.sin(angle)];
export function evaluate(angle = START, ids = [0, 1, 2]) {
  const q = vector(angle),
    scores = ids.map((i) => dotProduct(q, vector(ANGLES[i]))),
    probs = stableSoftmax(scores, TAU),
    target = ids.indexOf(0),
    loss = -Math.log(probs[target]),
    gradient = ids.reduce(
      (s, id, k) => s + ((probs[k] - (id === 0 ? 1 : 0)) * -Math.sin(angle - ANGLES[id])) / TAU,
      0,
    );
  return {
    scores,
    probs,
    loss,
    gradient,
  };
}
export function steps(n = 30) {
  let angle = START;
  const out = [angle];
  for (let i = 0; i < n; i++) {
    angle -= 0.03 * evaluate(angle).gradient;
    out.push(angle);
  }
  return out;
}
export const clip = (value) => Math.max(0, Math.min(1, value));
export function finiteUnit(v) {
  assert(v.length && v.every(Number.isFinite), 'finite nonempty vector');
  const scale = Math.max(...v.map(Math.abs));
  assert(scale > 0, 'nonzero vector');
  const a = v.map((x) => x / scale),
    n = Math.hypot(...a);
  return a.map((x) => x / n);
}
export function comparisonRow(scores, tau = 0.2, positive = 0, allowed = scores.map(() => true)) {
  assert(tau > 0 && Number.isFinite(tau));
  assert(scores.length && scores.length === allowed.length && scores.every(Number.isFinite));
  assert(
    Number.isInteger(positive) && positive >= 0 && positive < scores.length && allowed[positive],
  );
  const logits = scores.map((x) => x / tau);
  assert(logits.every(Number.isFinite), 'finite logits after division');
  const peak = Math.max(...logits.filter((_, i) => allowed[i])),
    masses = logits.map((v, i) => (allowed[i] ? Math.exp(v - peak) : 0)),
    sum = masses.reduce((a, b) => a + b, 0),
    probs = masses.map((v) => v / sum);
  return {
    logits,
    centered: logits.map((v) => v - peak),
    masses,
    sum,
    probs,
    loss: Math.log(sum) + (peak - logits[positive]),
    gradients: probs.map((v, i) => (allowed[i] ? (v - Number(i === positive)) / tau : 0)),
  };
}
export function maskedMean(states, mask) {
  assert(states.length === mask.length && states.length);
  const d = states[0].length;
  assert(d && states.every((v) => v.length === d && v.every(Number.isFinite)));
  assert(mask.every((x) => x === 0 || x === 1));
  const n = mask.reduce((a, b) => a + b, 0);
  assert(n > 0, 'nonempty valid-token set');
  return Array.from(
    {
      length: d,
    },
    (_, j) => states.reduce((s, v, i) => s + v[j] * mask[i], 0) / n,
  );
}
export function tokenMaxSim(rows) {
  assert(
    rows.length &&
      rows.every((r) => r.length === rows[0].length && r.length && r.every(Number.isFinite)),
  );
  const winners = rows.map((r) => r.indexOf(Math.max(...r)));
  return {
    winners,
    values: rows.map((r, i) => r[winners[i]]),
    sum: rows.reduce((s, r, i) => s + r[winners[i]], 0),
  };
}
export function nestedLoss(width) {
  const q = NESTED_Q.map((r) => finiteUnit(r.slice(0, width))),
    d = NESTED_D.map((r) => finiteUnit(r.slice(0, width)));
  return (
    q.reduce(
      (s, v, i) =>
        s +
        comparisonRow(
          d.map((w) => dotProduct(v, w)),
          0.2,
          i,
        ).loss,
      0,
    ) / q.length
  );
}
export function shortlistMetrics(ranking, relevant, k) {
  const found = ranking.slice(0, k).filter((id) => relevant.includes(id)),
    rank = ranking.slice(0, k).findIndex((id) => relevant.includes(id));
  return {
    recall: found.length / relevant.length,
    rr: rank < 0 ? 0 : 1 / (rank + 1),
  };
}
export function miningCandidates(query, rows = MINING_FIXTURE) {
  const tokens = (s) =>
      new Set(s.split(/\s+/).map((v) => v.replace(/^[?.!,]+|[?.!,]+$/g, '').toLowerCase())),
    q = tokens(query);
  assert(rows.every((r) => typeof r.relevant === 'boolean'));
  return rows
    .map((r) => ({
      ...r,
      overlap: [...tokens(r.text)].filter((t) => q.has(t)).length,
    }))
    .filter((r) => !r.relevant && r.overlap > 0)
    .sort((a, b) => b.teacher - a.teacher);
}
