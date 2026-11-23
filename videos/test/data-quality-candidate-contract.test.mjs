import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareCandidate,
  candidateRejectReason,
  referenceRows,
  referenceCandidate,
  referenceBytes,
  referenceDigest,
  pythonFixtureJSONL,
  candidateInvariants,
  bandCandidates,
  idealCandidateProbability,
  minhashCases,
  fixtureNormalize,
  shingleComparison,
} from '../animations/data-quality.mjs';
const row = (ticket_id, conversation_id, text = 'Deploy queued', label = 'standard') => ({
  ticket_id,
  conversation_id,
  text,
  label,
});

test('same-text group checks run before representative selection', () => {
  const cross = prepareCandidate([
    row(31, 'a'),
    row(30, 'a', ' DEPLOY queued '),
    row(32, 'b'),
    row(33, 'c', 'Rollback pending'),
  ]);
  assert.deepEqual(
    cross.kept.map((r) => r.ticket_id),
    [33],
  );
  assert.deepEqual(
    cross.rejected.map((r) => r.reason),
    Array(3).fill('cross_conversation_duplicate'),
  );
  const conflict = prepareCandidate([row(31, 'a'), row(30, 'b', ' DEPLOY queued ', 'escalate')]);
  assert.deepEqual(
    conflict.rejected.map((r) => r.reason),
    ['label_conflict', 'label_conflict'],
  );
  const same = prepareCandidate([row(31, 'a'), row(30, 'a', ' DEPLOY queued ')]);
  assert.deepEqual(
    same.kept.map((r) => r.ticket_id),
    [30],
  );
  assert.deepEqual(same.rejected, [{ ticket_id: 31, reason: 'exact_duplicate' }]);
});

test('strict IDs and duplicate-ID groups preserve rejected accounting', () => {
  assert.equal(candidateRejectReason(row(true, 'a')), 'invalid_ticket_id');
  assert.equal(candidateRejectReason(row('9', 'a')), 'invalid_ticket_id');
  assert.equal(candidateRejectReason({ ...row(9, 'a'), locale: 'en' }), null);
  const result = prepareCandidate([row(9, 'a'), row(9, 'b', 'Different message'), row(10, 'c')]);
  assert.deepEqual(
    result.kept.map((r) => r.ticket_id),
    [10],
  );
  assert.deepEqual(
    result.rejected.map((r) => r.reason),
    ['duplicate_ticket_id', 'duplicate_ticket_id'],
  );
  assert.equal(result.kept.length + result.rejected.length, 3);
});

test('reference serialization reproduces independently executed Python bytes', () => {
  assert.equal(referenceDigest, 'ba384792199e9be7783cf58f4e75c62d96a266fdb5b93f8efc58ebf00ce172bf');
  assert.equal(pythonFixtureJSONL([]), '');
  assert.equal(
    referenceRows.length,
    referenceCandidate.kept.length + referenceCandidate.rejected.length,
  );
});

test('byte,reason-count and copied-group interventions fail distinct invariants', () => {
  const { kept, rejected } = referenceCandidate;
  assert(Object.values(candidateInvariants(kept, rejected)).every(Boolean));
  const trailing = candidateInvariants(kept, rejected, { bytes: referenceBytes + '\n' });
  assert.equal(trailing.bytes, false);
  assert.equal(trailing.groups, true);
  assert.equal(trailing.counts, true);
  const changed = rejected.map((r) =>
    r.reason === 'invalid_label' ? { ...r, reason: 'label_conflict' } : r,
  );
  const reason = candidateInvariants(kept, changed);
  assert.equal(reason.bytes, false);
  assert.equal(reason.counts, false);
  assert.equal(reason.fingerprints, true);
  const copied = candidateInvariants(
    [...kept, { ...kept[0], ticket_id: 999, split: 'test' }],
    rejected,
    { bytes: referenceBytes },
  );
  assert.equal(copied.groups, false);
  assert.equal(copied.unique, false);
  assert.equal(copied.counts, false);
});

test('candidate generation requires a whole band rather than scattered matches', () => {
  const scattered = bandCandidates([1, 2, 3, 4], [1, 9, 3, 8], 2);
  assert.equal(scattered.estimate, 0.5);
  assert.equal(scattered.candidate, false);
  const whole = bandCandidates([1, 2, 3, 4], [1, 2, 9, 8], 2);
  assert.equal(whole.estimate, 0.5);
  assert.equal(whole.candidate, true);
  assert.throws(() => bandCandidates([1, 2, 3], [1, 2, 3], 2), /Complete equal-length bands/);
  assert.equal(idealCandidateProbability(0, 14, 8), 0);
  assert.equal(idealCandidateProbability(1, 14, 8), 1);
});

test('permutation minima and nontransitive pair similarity retain exact identities', () => {
  assert.equal(minhashCases.length, 24);
  assert.equal(minhashCases.filter((c) => c.match).length, 18);
  assert(minhashCases.every((c) => c.a !== 'd' && c.b === c.order[0]));
  const A = ['build has', 'has failed'],
    B = [...A, 'failed again'],
    C = ['has failed', 'failed again'];
  assert.equal(shingleComparison(A, B).score, 2 / 3);
  assert.equal(shingleComparison(B, C).score, 2 / 3);
  assert.equal(shingleComparison(A, C).score, 1 / 3);
  assert.equal(fixtureNormalize(' STRAẞE ﬁ ² Ａ '), 'strasse fi 2 a');
  assert.throws(() => fixtureNormalize('Σ'), /illustrated casefold subset/);
});
