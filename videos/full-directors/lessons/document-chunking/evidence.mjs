import assert from 'node:assert/strict';
import { RUNBOOK, LONG_SECTION, REVISED_RULE } from '../../../films/document-chunking/fixtures.mjs';
import {
  fixedWindows,
  balancedChildren,
  topicVector,
  cosine,
  requiredPhrasesPresent,
} from '../../../films/document-chunking/arithmetic.mjs';
import {
  answerabilityFixture,
  releaseComparison,
  lateChunkFixture,
  manifestChecksums,
} from '../../../films/document-chunking/model.mjs';
import { pagingContext, revisedContext } from '../../../films/document-chunking/packing.mjs';

export {
  RUNBOOK,
  LONG_SECTION,
  REVISED_RULE,
  fixedWindows,
  balancedChildren,
  topicVector,
  cosine,
  requiredPhrasesPresent,
  pagingContext,
  revisedContext,
};
export const candidates = answerabilityFixture();
export const choices = releaseComparison();
export const whole = candidates[2].text;
export const body = whole.split(' ');
export const reversed = whole.replace('page on-call', 'do not page on-call');
export const page = RUNBOOK.split(' ');
export const late = lateChunkFixture();
export const digest = manifestChecksums();
export const locator = 'incident-runbook-v3.pdf  ·  p. 7';
export const condition = 'Rollback failure';
export const archive = 'Routine deploy notes';
export const header = ['Condition', 'Window', 'Required evidence'];
export const table = [
  [condition, '15 minutes', 'Deploy ID'],
  [archive, '14 days', 'Release summary'],
];
export const topics = [
  'Rollback failures require deploy IDs.',
  'Page on-call within 15 minutes.',
  'Commander handoff uses the active incident channel.',
  'No action is required.',
];
export const vectors = topics.map(topicVector);
export function boundary(a, b, threshold) {
  const value = cosine(a, b);
  return {
    value,
    dot: a.reduce((sum, x, i) => sum + x * b[i], 0),
    lengths: [Math.hypot(...a), Math.hypot(...b)],
    action: value === null ? 'Review' : value < threshold ? 'Propose a cut' : 'Keep together',
  };
}
export function indexRun(overlap) {
  const hits = fixedWindows(RUNBOOK, 7, overlap);
  return {
    hits,
    occurrences: hits.reduce((n, h) => n + h.words.length, 0),
    facts: hits.filter((h) => h.start <= 5 && h.end >= 10).length,
    rules: hits.filter((h) => h.start === 0 && h.end >= 10).length,
  };
}
export function children(lengths) {
  const matches = [...LONG_SECTION.matchAll(/\S+/g)];
  let cursor = 0;
  return lengths.map((length) => {
    const first = matches[cursor],
      last = matches[cursor + length - 1];
    cursor += length;
    const start = first.index,
      end = last.index + last[0].length;
    return { length, start, end, text: LONG_SECTION.slice(start, end) };
  });
}
export const balanced = balancedChildren();
export const searchWords = 'rollback failure deploy minutes';
function terms(value) {
  return new Set(value.toLowerCase().match(/[a-z0-9]+/g));
}
export function matches(query, passage) {
  const found = terms(passage);
  return [...terms(query)].filter((term) => found.has(term));
}
const corpus = {
  Paging: whole,
  Archive: 'Routine deploy notes: archive within 14 days.',
  Handoff: 'Commander handoff requires the active incident channel.',
};
export const searchResults = [
  whole,
  candidates[0].text,
  body.slice(5).join(' '),
  corpus.Archive,
].map((text) => ({ text, hits: matches(searchWords, text) }));
export const queries = [
  ['rollback failure deploy id', 'Paging', '15 minutes'],
  ['routine deploy archive', 'Archive', '14 days'],
  ['commander incident channel', 'Handoff', 'active incident'],
].map(([query, expected, required]) => {
  const [name, text] = Object.entries(corpus).sort(
    (a, b) => matches(query, b[1]).length - matches(query, a[1]).length,
  )[0];
  return { query, name, required, sourceOK: name === expected, textOK: text.includes(required) };
});

export const originalParent = { id: 'p7/rollback', version: 3, text: whole };
export const updatedParent = {
  ...originalParent,
  version: 4,
  text: whole + ' Include the service name.',
};
export function lookup({
  versions = [updatedParent.version, updatedParent.version],
  allowed = true,
  budget = 20,
  ids = [updatedParent.id, updatedParent.id],
} = {}) {
  const hits = ids.map((id, i) => ({ id, version: versions[i] }));
  const unique = [...new Set(ids)];
  const words = updatedParent.text.split(' ').length;
  let decision = 'Return parent';
  if (hits.some((h) => h.id !== updatedParent.id || h.version !== updatedParent.version))
    decision = 'Stale link';
  else if (!allowed) decision = 'Access denied';
  else if (unique.length * words > budget) decision = 'Over budget';
  const accepted = decision === 'Return parent';
  return {
    hits,
    words,
    allowed,
    budget,
    decision,
    copies: accepted ? unique.length : 0,
    returned: accepted ? updatedParent.text : '',
  };
}
export function measure(bodyTokens) {
  const heading = 3,
    special = 2,
    limit = 16,
    total = bodyTokens + heading + special;
  return { bodyTokens, heading, special, limit, total, fits: total <= limit };
}
export function wordRange(words, start, end) {
  return words.slice(start, end).join(' ');
}
export function checkEvidence() {
  assert.deepEqual(
    candidates.map((c) => c.phraseCheck),
    [false, false, true],
  );
  assert.ok(requiredPhrasesPresent(reversed));
  assert.ok(reversed.includes('do not page'));
  assert.deepEqual(
    choices.map((c) => [c.wordCount, c.releasable]),
    [
      [5, false],
      [12, false],
      [10, true],
    ],
  );
  assert.deepEqual(
    [0, 2, 4].map((o) => {
      const r = indexRun(o);
      return [r.hits.length, r.occurrences, r.facts, r.rules];
    }),
    [
      [3, 17, 0, 0],
      [3, 21, 1, 0],
      [5, 33, 1, 0],
    ],
  );
  const fixed = fixedWindows(RUNBOOK, 6, 2);
  assert.deepEqual(
    fixed.map((h) => h.start),
    [0, 4, 8, 12],
  );
  assert.equal(fixed.at(-1).end, 17);
  assert.equal(fixed[0].words.at(-1), '15');
  assert.equal(fixed[1].text, 'within 15 minutes with deploy ID.');
  for (const sizes of [
    [7, 7, 1],
    [7, 8],
    [5, 5, 5],
  ])
    assert.equal(
      children(sizes)
        .map((c) => c.text)
        .join(' '),
      LONG_SECTION,
    );
  assert.deepEqual(
    balanced.map((c) => [c.start, c.end]),
    [
      [0, 30],
      [31, 58],
      [59, 93],
    ],
  );
  assert.equal(2 * 7 < 15 && 3 * 6 > 15, true);
  assert.deepEqual(
    [12, 11].map((n) => [measure(n).total, measure(n).fits]),
    [
      [17, false],
      [16, true],
    ],
  );
  assert.deepEqual(
    searchResults.map((r) => r.hits.length),
    [4, 2, 2, 1],
  );
  assert.ok(queries.every((q) => q.sourceOK && q.textOK));
  for (const [budget, used, complete] of [
    [10, 10, true],
    [9, 5, false],
  ]) {
    const state = pagingContext(budget);
    assert.deepEqual([state.used, state.complete], [used, complete]);
    assert.equal(
      state.returned.map((s) => s.text).join(' '),
      complete ? whole : body.slice(5).join(' '),
    );
  }
  assert.equal(originalParent.text.split(' ').length, 10);
  assert.equal(originalParent.id, updatedParent.id);
  assert.notEqual(originalParent.version, updatedParent.version);
  assert.equal(updatedParent.text, originalParent.text + ' Include the service name.');
  for (const [opts, decision, copies] of [
    [{}, 'Return parent', 1],
    [{ versions: [originalParent.version, updatedParent.version] }, 'Stale link', 0],
    [{ allowed: false }, 'Access denied', 0],
    [{ budget: 10 }, 'Over budget', 0],
  ]) {
    const p = lookup(opts);
    assert.deepEqual(
      [p.decision, p.copies, p.returned.split(' ').filter(Boolean).length],
      [decision, copies, copies * 14],
    );
  }
  assert.deepEqual(vectors, [
    [2, 0],
    [1, 0],
    [0, 3],
    [0, 0],
  ]);
  assert.deepEqual(
    vectors.slice(1).map((v, i) => boundary(vectors[i], v, 0.5).value),
    [1, 0, null],
  );
  assert.equal(boundary([1, 1], [0, 0], 0.8).action, 'Review');
  assert.deepEqual(
    vectors.slice(1).map((v, i) => {
      const pair = boundary(vectors[i], v, 0.5);
      return [pair.dot, pair.lengths, pair.action];
    }),
    [
      [2, [2, 1], 'Keep together'],
      [0, [1, 3], 'Propose a cut'],
      [0, [3, 0], 'Review'],
    ],
  );
  assert.deepEqual(
    late.selected.map((i) => late.tokens[i].text),
    ['page', 'the', 'service', 'owner'],
  );
  assert.equal(late.pooledFeature.toFixed(2), '0.71');
  assert.notEqual(digest.originalHash, digest.editedHash);
  assert.equal(Buffer.byteLength(digest.original), Buffer.byteLength(digest.edited));
  const both = revisedContext(18);
  assert.deepEqual(
    both.ranked.map((h) => [h.start, h.end]),
    [
      [3, 12],
      [0, 9],
    ],
  );
  assert.deepEqual([both.used, both.repeated, both.complete], [18, 6, true]);
  assert.equal(both.words.join(' '), REVISED_RULE);
  assert.deepEqual(both.words.slice(-4), ['deploy', 'ID', 'and', 'service.']);
  assert.equal(wordRange(both.words, 3, 9), 'on-call within 20 minutes with deploy');
  const one = revisedContext(12);
  assert.deepEqual([one.used, one.repeated, one.complete], [9, 0, false]);
  for (const budget of [11, 12]) {
    const parent = revisedContext(budget, { parent: true });
    assert.deepEqual([parent.used, parent.complete], [budget === 12 ? 12 : 0, budget === 12]);
  }
  assert.equal(revisedContext(12, { parent: true, allowed: false }).used, 0);
  assert.equal(revisedContext(12, { parent: true, version: 3 }).used, 0);
}
