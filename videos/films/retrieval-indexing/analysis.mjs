import { DOCS, QUERY } from './fixtures.mjs';
export const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'do',
  'for',
  'how',
  'i',
  'in',
  'it',
  'the',
  'then',
  'to',
  'your',
]);
export const tokenize = (text) =>
  (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((term) => !STOPWORDS.has(term));
export const TOKENS = Object.freeze(
  Object.fromEntries(Object.entries(DOCS).map(([id, text]) => [id, tokenize(text)])),
);
export const TERMS = Object.freeze(tokenize(QUERY));
export const SOUP_POSITIONS = TOKENS.d4.flatMap((token, i) => (token === 'soup' ? [i + 1] : []));
export const POSTINGS = Object.freeze(
  Object.fromEntries(
    TERMS.map((term) => [term, Object.keys(DOCS).filter((id) => TOKENS[id].includes(term))]),
  ),
);
export const QUERY_INTERSECTION = Object.freeze(
  POSTINGS[TERMS[0]].filter((id) => POSTINGS[TERMS[1]].includes(id)),
);
export const countsGrid = Object.freeze(
  Object.keys(DOCS).map((docId) =>
    TERMS.map((term) => TOKENS[docId].filter((token) => token === term).length),
  ),
);
