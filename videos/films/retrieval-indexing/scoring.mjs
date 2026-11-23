import { DOCS } from './fixtures.mjs';
import { TERMS, TOKENS } from './analysis.mjs';
export const termFrequencyScore = (frequency, length = 10) =>
  (idf('soup') * frequency * 2.2) / (frequency + 1.2 * (0.25 + (0.75 * length) / AVERAGE_LENGTH));
export const DOC_FREQUENCY = Object.freeze(
  Object.fromEntries(
    TERMS.map((term) => [
      term,
      Object.values(TOKENS).filter((tokens) => new Set(tokens).has(term)).length,
    ]),
  ),
);
export const AVERAGE_LENGTH =
  Object.values(TOKENS).reduce((sum, tokens) => sum + tokens.length, 0) / Object.keys(DOCS).length;
export const idf = (term) =>
  Math.log(
    1 + (Object.keys(DOCS).length - DOC_FREQUENCY[term] + 0.5) / (DOC_FREQUENCY[term] + 0.5),
  );
export function bm25(docId, { k1 = 1.2, b = 0.75 } = {}) {
  const counts = new Map();
  for (const token of TOKENS[docId]) counts.set(token, (counts.get(token) ?? 0) + 1);
  const contributions = Object.fromEntries(
    TERMS.map((term) => {
      const frequency = counts.get(term) ?? 0;
      if (!frequency) return [term, 0];
      const lengthFactor = 1 - b + (b * TOKENS[docId].length) / AVERAGE_LENGTH;
      const score = (idf(term) * frequency * (k1 + 1)) / (frequency + k1 * lengthFactor);
      return [term, score];
    }),
  );
  return {
    docId,
    length: TOKENS[docId].length,
    counts: Object.fromEntries(TERMS.map((term) => [term, counts.get(term) ?? 0])),
    contributions,
    score: Object.values(contributions).reduce((sum, value) => sum + value, 0),
  };
}
export const SCORES = Object.freeze(Object.keys(DOCS).map(bm25));
export const RANKING = Object.freeze(
  [...SCORES].sort((a, b) => b.score - a.score || a.docId.localeCompare(b.docId)),
);
