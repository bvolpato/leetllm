import { FRESH_PROBABILITIES, freshPieces } from './fixtures.mjs';
export function corpusLoss(rows) {
  const count = rows.reduce((n, r) => n + r.count, 0),
    sum = rows.reduce((n, r) => n + r.loss * r.count, 0);
  if (!Number.isInteger(count) || count <= 0)
    throw new RangeError('positive target count required');
  return {
    count,
    sum,
    mean: sum / count,
    perplexity: Math.exp(sum / count),
  };
}
export const shiftedTargetCount = (rows) =>
  rows.reduce((n, row) => n + row.slice(1).filter((v) => v !== -100).length, 0);
export const answerChecks = (row, contract) =>
  ['status', 'source', 'automatic'].map((k) => row[k] === contract[k]);
export function freshReport() {
  const losses = FRESH_PROBABILITIES.map((p) => -Math.log(p)),
    sum = losses.reduce((n, x) => n + x, 0);
  const count = losses.length;
  const bytes = Buffer.byteLength(freshPieces.join(''), 'utf8');
  return {
    losses,
    sum,
    count,
    mean: sum / count,
    ppl: Math.exp(sum / count),
    bytes,
    bpb: sum / (bytes * Math.LN2),
  };
}
