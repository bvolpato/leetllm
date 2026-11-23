import assert from 'node:assert/strict';
import {
  asOf,
  chunks,
  documents,
  permissions,
  publicationInput,
  replacement,
} from '../../../films/sql-databases-data-modeling-ai/fixtures.mjs';
import {
  active,
  authorizedMatches,
  corpus,
  eligibleRows,
  freshSqlPacket,
  joinedRows,
  literalSubstringPattern,
  rlsVisible,
  semanticCandidates,
  sourceCounts,
} from '../../../films/sql-databases-data-modeling-ai/model.mjs';
import {
  createPublicationLedger,
  payloadFingerprint,
  publishOnce,
} from '../../../films/sql-databases-data-modeling-ai/protocols.mjs';
import { cosine, mix } from '../../../films/sql-databases-data-modeling-ai/arithmetic.mjs';
export {
  asOf,
  active,
  authorizedMatches,
  chunks,
  corpus,
  documents,
  joinedRows,
  literalSubstringPattern,
  permissions,
  replacement,
  rlsVisible,
  sourceCounts,
  cosine,
};
export const day = 86400000;
export const date = (s) => Date.parse(s.length === 10 ? s + 'T00:00:00Z' : s);
export const purchase = date('2026-07-25'),
  returned = date('2026-08-12'),
  age = (returned - purchase) / day;
export const deadlineDays = new Map([
  ['Return items within fourteen days.', 14],
  ['Return items within thirty days.', 30],
  ['Return within fourteen days.', 14],
  ['Return within ten days.', 10],
  ['Return within seven days.', 7],
]);
export const oldWindow = deadlineDays.get(chunks[0].text),
  julyWindow = deadlineDays.get(chunks[1].text);
export const locale = (ws) => (ws === 'w01' ? 'Harbor' : 'Birch');
const monthDay = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
export const validityDates = (source) =>
  monthDay.format(date(source.from)) +
  ' / ' +
  (source.to ? monthDay.format(date(source.to)) : 'open');
export const terms = {
  c7a: 'Deadline',
  c7b: 'Receipt',
  c7c: 'Deadline',
  c7d: 'Receipt',
  c7e: 'Clothing tags',
  c9a: 'Staff rule',
  'c7-old': 'Deadline',
  c99: 'Deadline',
};
export const before = authorizedMatches(),
  after = authorizedMatches({ published: true });
export const printedCode = 'policy_10%!',
  passages = [printedCode, 'policyX10aa!', 'archived POLICY_10%! copy'];
export function literalHits(input) {
  const query = input.trim().toLowerCase();
  return query ? passages.map((p) => p.toLowerCase().includes(query)) : [];
}
export const scoreAccepted = (v, required) => (v === null ? !required : v > 0);
export const scanGrants = permissions.map(([id, reader]) => ({ id, reader })),
  orderedGrants = scanGrants
    .slice()
    .sort((a, b) => a.reader.localeCompare(b.reader) || a.id.localeCompare(b.id));
export const candidates = semanticCandidates(),
  exact = candidates.filter((r) => r.allowed).slice(0, 2);
export const graphWalk = ['c99', 'c7-old', 'c9a', 'c7d', 'c7e'].map((id) =>
  candidates.find((r) => r.chunk === id),
);
export const scanResults = (n) =>
  graphWalk
    .slice(0, n)
    .filter((r) => r.allowed)
    .slice(0, 2);
export function recall(results) {
  return results.filter((r) => exact.some((e) => e.chunk === r.chunk)).length / exact.length;
}
export const ledger = createPublicationLedger();
export const first = publishOnce(ledger, 'publish-1'),
  replay = publishOnce(ledger, 'publish-1');
const changed = structuredClone(publicationInput);
changed.chunks[2].text = 'Return clothing with the original swing tag.';
export const amended = publishOnce(ledger, 'publish-1', changed);
export const changedHash = payloadFingerprint(changed);
export const snapshots = [false, true].map((published) =>
  joinedRows(published)
    .filter((row) => row.source.workspace === 'w01' && active(row.source))
    .map((row) => row.id),
);
export const exportSubjects = [...new Set(snapshots.flat().map((id) => terms[id]))];
export const addedSubjects = snapshots[1].filter(
  (id) => !snapshots[0].some((prior) => terms[prior] === terms[id]),
);
export function exportReads(repeatable) {
  const [july, august] = snapshots;
  const later = repeatable ? july : august;
  return [july, later, later];
}
export function freshRequest(time, grant) {
  const rows = freshSqlPacket(grant);
  const allowed = eligibleRows(rows, { time, workspace: 'Harbor', principal: 'Bob' });
  return {
    rows,
    allowed,
    deadline: allowed.find((r) => deadlineDays.has(r.text)),
    receipt: allowed.find((r) => r.id === 'c81'),
  };
}
export const originalVector = [1, 0],
  nextVector = [0, 1];
export const savedHit = {
  chunk: 'c7c',
  embedding: 'emb-17',
  query: [1, 0],
  score: cosine([1, 0], originalVector),
};
export function replayHit(overwrite, versioned) {
  const embeddings = new Map([[savedHit.embedding, overwrite ? nextVector : originalVector]]);
  if (versioned) embeddings.set('emb-18', nextVector);
  const stored = embeddings.get(savedHit.embedding);
  return { stored, score: cosine(savedHit.query, stored), newer: embeddings.get('emb-18') };
}
export const labels = [['c7c'], ['c7e']];
export const hit = (result, relevant) => Number(relevant.includes(result));
export function turnVector(t) {
  return [mix(1, 0, t), mix(0, 2, t)];
}
export function check() {
  assert.equal(age, 18);
  assert.equal(age - julyWindow, 4);
  assert.equal(oldWindow, 30);
  assert.deepEqual(before, ['c7a', 'c7b']);
  assert.deepEqual(documents.slice(0, 2).map(validityDates), ['Jan 1 / Jul 1', 'Jul 1 / open']);
  assert.deepEqual(after, ['c7c', 'c7d', 'c7e']);
  assert.equal(active(documents[0], '2026-07-01T00:00:00Z'), false);
  assert.equal(active(documents[1], '2026-07-01T00:00:00Z'), true);
  assert.deepEqual(literalHits(printedCode), [true, false, true]);
  assert.deepEqual(literalHits('   '), []);
  assert.equal(literalSubstringPattern(printedCode), '%policy!_10!%!!%');
  assert.equal(literalSubstringPattern('document_id'), '%document!_id%');
  assert.equal(literalSubstringPattern('10%'), '%10!%%');
  assert.deepEqual(
    [0, null, 2].map((v) => scoreAccepted(v, false)),
    [false, true, true],
  );
  assert.deepEqual(
    [0, null, 2].map((v) => scoreAccepted(v, true)),
    [false, false, true],
  );
  assert.equal(rlsVisible({ role: 'owner', force: true }), false);
  assert.deepEqual(
    sourceCounts(false, { includeEmpty: true }).map((r) => [r.id, r.count]),
    [
      ['d-empty', 0],
      ['d7', 2],
      ['d9', 1],
    ].sort((a, b) => a[0].localeCompare(b[0])),
  );
  assert.deepEqual(
    snapshots.map((rows) => rows.length),
    [3, 4],
  );
  assert.deepEqual(addedSubjects, ['c7e']);
  assert.deepEqual(
    exportSubjects.map((subject) =>
      snapshots.map((ids) => ids.find((id) => terms[id] === subject)),
    ),
    [['c7a', 'c7c'], ['c7b', 'c7d'], ['c9a', 'c9a'], [undefined, 'c7e']],
  );
  assert.deepEqual(
    [false, true].map((repeatable) => exportReads(repeatable).map((rows) => rows.length)),
    [
      [3, 4, 4],
      [3, 3, 3],
    ],
  );
  assert.equal(replay.status, 'reused');
  assert.equal(ledger.requests.size, 1);
  assert.equal(amended.status, 'changed input rejected');
  assert.notEqual(amended.fingerprint, first.fingerprint);
  const broken = structuredClone(publicationInput);
  broken.chunks[1].document = 'missing';
  const trial = createPublicationLedger();
  assert.equal(publishOnce(trial, 'bad', broken).status, 'foreign key or identity rejected');
  assert.deepEqual(trial.data, corpus());
  assert.equal(scanGrants.length, 7);
  assert.equal(orderedGrants.filter((r) => r.reader === 'Bob').length, 4);
  assert.deepEqual(
    exact.map((r) => r.chunk),
    ['c7c', 'c7d'],
  );
  assert.deepEqual(scanResults(3), []);
  assert.equal(recall(scanResults(5)), 0.5);
  const turned = cosine(turnVector(1), candidates.find((r) => r.chunk === 'c7e').vector);
  assert.equal(turned.toFixed(3), '0.949');
  assert.equal((1 - turned).toFixed(3), '0.051');
  assert.equal(savedHit.score, 1);
  assert.deepEqual(replayHit(true, false), { stored: [0, 1], score: 0, newer: undefined });
  assert.deepEqual(replayHit(false, true), { stored: [1, 0], score: 1, newer: [0, 1] });
  assert.deepEqual(
    labels.map((l) => hit('c7c', l)),
    [1, 0],
  );
  assert.equal(deadlineDays.get(freshRequest('2026-08-31', false).deadline.text), 14);
  assert.equal(freshRequest('2026-09-01', false).deadline, undefined);
  assert.deepEqual(
    freshRequest('2026-09-01', true).allowed.map((r) => r.id),
    ['c80', 'c81'],
  );
  assert.deepEqual(freshRequest('2026-09-01', true).deadline.grants, ['Cara', 'Bob']);
}
