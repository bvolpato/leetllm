import { clamp01, head, softmax } from './arithmetic.mjs';
import { GATE_CASES, rows } from './fixtures.mjs';
import { ACTUAL_COMPARISON } from './fixtures/actual-models.mjs';
export const extraReviewCost = 2;
export const missedEscalationCost = 6;
export const costCutoff = extraReviewCost / (extraReviewCost + missedEscalationCost);
export const reviewLoss = (p) => extraReviewCost * (1 - p);
export const guardedLoss = (p) => missedEscalationCost * p;

export function trainHead(n) {
  let z = [2, 1];
  for (let i = 0; i < n; i++) {
    const p = softmax(z);
    z = z.map((v, j) => v - 0.3 * (p[j] - (j === 1 ? 1 : 0)));
  }
  const p = softmax(z);
  return {
    z,
    p,
    loss: -Math.log(p[1]),
  };
}
export function counts(threshold) {
  return rows.reduce(
    (a, r) => {
      a[r.p >= threshold ? (r.y ? 'TP' : 'FP') : r.y ? 'FN' : 'TN']++;
      return a;
    },
    {
      TP: 0,
      FP: 0,
      FN: 0,
      TN: 0,
    },
  );
}
export function fallback(score, tokens = 20, text = 'Example ticket') {
  return typeof text !== 'string' ||
    text.trim().length === 0 ||
    !Number.isInteger(tokens) ||
    tokens <= 0 ||
    tokens > 256 ||
    typeof score !== 'number' ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1
    ? 'Human fallback'
    : score >= 0.35
      ? 'Human review'
      : 'Guarded agent';
}
export function temperature(p, T) {
  return 1 / (1 + Math.exp(-Math.log(p / (1 - p)) / T));
}
export function maskedMean(vectors, mask) {
  if (
    !Array.isArray(vectors) ||
    !vectors.length ||
    mask.length !== vectors.length ||
    mask.some((m) => m !== 0 && m !== 1)
  )
    throw new TypeError('Expected equally sized vectors and binary mask');
  const d = vectors[0].length,
    n = mask.reduce((a, v) => a + v, 0);
  if (!n || !d || vectors.some((r) => r.length !== d || r.some((v) => !Number.isFinite(v))))
    throw new TypeError('Need finite rectangular vectors and at least one live row');
  return Array.from(
    {
      length: d,
    },
    (_, i) => vectors.reduce((sum, r, j) => sum + r[i] * mask[j], 0) / n,
  );
}
export function backpropagationStep({ rate = 0.1, trainEmbeddings = true, progress = 1 } = {}) {
  const original = [
      [0, 0],
      [2, 0],
      [0, 2],
      [-1, 1],
    ],
    w = [
      [1.5, 0.5],
      [0.5, 0.5],
    ],
    b = [0, 0],
    h = maskedMean(original, [0, 1, 1, 0]),
    z = head(h, w, b),
    p = softmax(z),
    dz = p.map((x, j) => x - (j === 1 ? 1 : 0));
  const dw = dz.map((g) => h.map((v) => g * v)),
    dh = h.map((_, i) => w.reduce((sum, r, j) => sum + r[i] * dz[j], 0)),
    de = original.map((r, j) => r.map((_, i) => (j === 1 || j === 2 ? dh[i] / 2 : 0))),
    q = clamp01(progress);
  const afterE = original.map((r, j) =>
      r.map((v, i) => v - (trainEmbeddings ? rate * q * de[j][i] : 0)),
    ),
    afterW = w.map((r, j) => r.map((v, i) => v - rate * q * dw[j][i])),
    afterB = b.map((v, i) => v - rate * q * dz[i]),
    afterH = maskedMean(afterE, [0, 1, 1, 0]),
    afterZ = head(afterH, afterW, afterB);
  return {
    original,
    w,
    b,
    h,
    z,
    p,
    dz,
    dw,
    dh,
    de,
    embeddings: afterE,
    weights: afterW,
    bias: afterB,
    pooled: afterH,
    logits: afterZ,
    probabilities: softmax(afterZ),
  };
}
export function evaluateGate(submitted, threshold = 0.35, maxFP = 1) {
  if (!Array.isArray(submitted))
    return {
      decision: 'hold',
      reason: 'invalid rows',
    };
  const seen = new Set(),
    byId = new Map();
  for (const row of submitted) {
    if (!row || typeof row !== 'object' || Object.keys(row).sort().join(',') !== 'fixture_id,score')
      return {
        decision: 'hold',
        reason: 'submitted fields',
      };
    if (seen.has(row.fixture_id))
      return {
        decision: 'hold',
        reason: 'duplicate',
      };
    seen.add(row.fixture_id);
    if (!GATE_CASES.some((c) => c.id === row.fixture_id))
      return {
        decision: 'hold',
        reason: 'unexpected',
      };
    if (
      typeof row.score !== 'number' ||
      !Number.isFinite(row.score) ||
      row.score < 0 ||
      row.score > 1
    )
      return {
        decision: 'hold',
        reason: 'invalid score',
      };
    byId.set(row.fixture_id, row.score);
  }
  if (GATE_CASES.some((r) => !seen.has(r.id)))
    return {
      decision: 'hold',
      reason: 'missing',
    };
  const data = GATE_CASES.map((r) => ({
      ...r,
      p: byId.get(r.id),
    })),
    counts = thresholdCounts(data, threshold),
    misses = data.filter((r) => r.gold && r.p < threshold).map((r) => r.id);
  return {
    ...counts,
    decision: misses.length || counts.FP > maxFP ? 'hold' : 'eligible_for_shadow',
    reason: misses.length
      ? 'required misses'
      : counts.FP > maxFP
        ? 'review capacity'
        : 'exact arithmetic pass',
    misses,
  };
}
export function thresholdCounts(data, threshold) {
  return data.reduce(
    (a, r) => {
      a[
        (r.p ?? r.score) >= threshold
          ? (r.gold ?? r.y)
            ? 'TP'
            : 'FP'
          : (r.gold ?? r.y)
            ? 'FN'
            : 'TN'
      ]++;
      return a;
    },
    {
      TP: 0,
      FP: 0,
      FN: 0,
      TN: 0,
    },
  );
}
export function actualModelComparison() {
  return ACTUAL_COMPARISON.map((model) => ({
    ...model,
    result: evaluateGate(model.rows),
  }));
}
