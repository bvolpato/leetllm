import { ramp } from './arithmetic.mjs';
import {
  bias,
  budgetCandidates,
  equipmentPassages,
  passageIds,
  scores,
  states,
  weights,
} from './fixtures.mjs';
import { createHash } from 'node:crypto';
export function rerank(ids) {
  return [...ids].sort((a, b) => scores[b] - scores[a] || a - b);
}
export function scoringConstruction(beat, p) {
  const terms = beat > 0 ? 2 : p < 0.4 ? 0 : p < 0.48 ? 1 : 2,
    biasAmount = beat > 0 ? 1 : ramp(p, 0.54, 0.58);
  return {
    terms,
    biasAmount,
    complete: terms === 2 && biasAmount === 1,
    sigmoidVisible: beat > 1 || (beat === 1 && p >= 0.61),
    ranksVisible: beat > 1 || (beat === 1 && p >= 0.55),
    activeCoordinate: beat > 0 || p < 0.35 || p >= 0.5 ? null : p < 0.43 ? 0 : 1,
    rows: states.map((h, i) => {
      const products = h.map((v, j) => v * weights[j]),
        sum = products.slice(0, terms).reduce((a, b) => a + b, 0),
        value = sum + bias * biasAmount;
      return {
        id: passageIds[i],
        h,
        products,
        sum,
        value,
        sigmoid: 1 / (1 + Math.exp(-value)),
        rank: rerank([0, 1, 2]).indexOf(i) + 1,
      };
    }),
  };
}
export function budgetPredictionState(beat, p) {
  const depth = beat === 0 ? 0 : beat > 1 ? 3 : p < 0.12 ? 0 : p < 0.4 ? 1 : p < 0.68 ? 2 : 3,
    admitted = budgetCandidates.slice(0, depth),
    ranked = [...admitted].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return {
    depth,
    admitted,
    result: ranked[0] ?? null,
    targetAdmitted: admitted.some((row) => row.id === 'return-box'),
  };
}
export function policyScore(day = 10, audit = true) {
  return 2 + 1 + (day <= 14 && day >= 0 ? 2 : 0) + (audit ? 2 : 0);
}
export function marginSelection(values, margin) {
  return values
    .map((v, i) => (v >= Math.max(...values) - margin ? i : null))
    .filter((i) => i !== null);
}
export function maxSimMatrix() {
  return [
    [0.9, 0.6, -0.8],
    [Math.sqrt(0.19), 0.8, -0.6],
  ];
}
export function packedEvidence(depth, budget) {
  const candidates = equipmentPassages.slice(0, depth);
  const included = candidates.filter((p) => p.required);
  const eligible = candidates
    .filter((p) => p.score >= 5)
    .sort((a, b) => b.score - a.score || a.rank - b.rank);
  const packed = [];
  let used = 0;
  for (const passage of eligible) {
    if (packed.length < 2 && used + passage.tokens <= budget) {
      packed.push(passage);
      used += passage.tokens;
    }
  }
  return {
    included,
    eligible,
    packed,
    used,
    total: included.reduce((a, r) => a + r.tokens, 0),
    complete: equipmentPassages.filter((p) => p.required).every((p) => packed.includes(p)),
  };
}
export function teachingScoreKey({
  textRevision = 'A',
  tenant = 'alpha',
  list = ['P', 'Q', 'R'],
} = {}) {
  const payload = {
    grant: 'permitted7',
    input: {
      list: [...list],
      textRevision,
    },
    model: 'fixture-model1',
    settings: {
      aggregation: 'declared',
      template: 'fixture-v1',
      truncation: 'refuse',
    },
    tenant,
    tokenizer: 'fixture-tokenizer1',
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
