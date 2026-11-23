import { createHash } from 'node:crypto';
export {
  corpus,
  extractionFixture,
  BPE_RULES,
  PACKED_WORDS,
  PROXY_RESULTS,
  releaseEvaluation,
  releaseBatch,
  DOCUMENT_DRAWS,
} from '../../../films/pretraining-data/fixtures.mjs';
export {
  documentSample,
  bpeReplay,
  packRecords,
  independentObjective,
  restoreRecords,
  share,
} from '../../../films/pretraining-data/arithmetic.mjs';
export { preparationBranch } from '../../../films/pretraining-data/model.mjs';
export const docs = [
  'The key policy says stale accounts need security review.',
  'The key policy says stale accounts require security review.',
  'Audit logs record deployment rollback events.',
];
export const words = (s) => s.toLowerCase().match(/[a-z0-9]+/g);
export function ngrams(text, n) {
  const tokens = words(text);
  return [...new Set(tokens.slice(0, 1 - n).map((_, i) => tokens.slice(i, i + n).join(' ')))];
}
export function overlap(a, b) {
  const shared = a.filter((v) => b.includes(v));
  const union = [...new Set([...a, ...b])];
  return { shared, union, ratio: shared.length / union.length };
}
export const claimSets = [
  [1, 2, 3, 4],
  [1, 2, 3, 4, 5, 6],
  [3, 4, 5, 6],
];
export const candidate = (s, r, b) => 1 - (1 - s ** r) ** b;
export const scored = [
  ['Proof', 120, 0.98],
  ['API docs', 160, 0.92],
  ['Forum', 200, 0.79],
  ['News', 240, 0.63],
  ['Scrape', 280, 0.31],
].map(([id, tokens, score]) => ({ id, tokens, score }));
export const trainingLines = [
  'rotate stale keys after review',
  'rotate stale keys after audit',
  'rollback deployment after review',
];
export const input = [11, 12, 99, 21, 99],
  segments = [0, 0, 0, 1, 1];
export const order = [0, 5, 1, 2, 3, 4];
export const procedure =
  'The key-rotation runbook explains how stale service-account keys are reviewed. Operators verify the audit signal, check the owning service, and create a rotation task when the account is eligible. This document contains specific procedural details, normal punctuation, and enough natural language context to be useful for model training. It avoids repeated boilerplate and gives on-call engineers a clear workflow. Every operational step is recorded in the central compliance ledger for auditing.';
export const examples = [
  procedure,
  'Rotation tasks are available.',
  Array(80).fill('sale').join(' '),
  Array.from({ length: 25 }, (_, i) => '#rule-' + i + ' { width: ' + i + 'px; }').join(' '),
];
export function prose(text) {
  const w = text.split(/\s+/),
    count = w.length;
  const avg = w.join('').length / count;
  const stops = ['the', 'be', 'to', 'of', 'and', 'that', 'have', 'with'].filter((v) =>
    words(text).includes(v),
  );
  const hashes = (text.match(/#/g) || []).length;
  const ellipses = (text.match(/\.\.\./g) || []).length;
  const alpha = w.filter((v) => /\p{L}/u.test(v)).length / count;
  return {
    count,
    stops,
    hashes,
    pass:
      count >= 50 &&
      count <= 100000 &&
      avg >= 3 &&
      avg <= 10 &&
      Math.max(hashes, ellipses) / count <= 0.1 &&
      alpha >= 0.8 &&
      stops.length >= 2,
  };
}
export const digest = (t) => createHash('sha256').update(t).digest('hex');
export const shardBytes = '0 5 1 2 3 4\n';
export const matrixBytes = (rows, width, bytes) => 2 * rows * width * bytes;
// Measured with tiktoken 0.12.0, cl100k_base.encode_ordinary, on record C's second line.
export const codeTokens = [
  { id: 262, text: '   ' },
  { id: 471, text: ' return' },
  { id: 264, text: ' a' },
  { id: 489, text: ' +' },
  { id: 293, text: ' b' },
];
export const englishCompression = [3.17, 3.94];
export const lengths = [7, 6, 5, 5, 3, 2];
export const cooldown = { baseline: [0.88, 0.84], candidate: [0.92, 0.77], floor: 0.8 };
export const releaseKept = (batch, code, other) =>
  batch.filter((r) => r.score >= (r.id === 'Code' ? code : other));
export const codeLines = ['def decide(flag):', '    if flag:', '        return 1', '    return 2'];
export const nestedLines = [...codeLines.slice(0, -1), '        return 2'];
import minima from './minima.json' with { type: 'json' };
export { minima };
export function matchingBands(left, right, rows = 4) {
  return Array.from({ length: left.length / rows }, (_, band) => band).filter((band) =>
    left
      .slice(band * rows, (band + 1) * rows)
      .every(([hash], i) => hash === right[band * rows + i][0]),
  );
}
