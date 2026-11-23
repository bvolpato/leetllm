import { jaccard, lshProbability } from './arithmetic.mjs';
import {
  changedDigest,
  conflictGroups,
  conflictIds,
  crossConversationReviewGroups,
  deduplicatedIds,
  editedPassage,
  excludedReleaseIds,
  fingerprint,
  freshRows,
  grouped,
  normalize,
  partitionRows,
  quarantineIds,
  records,
  referencePassage,
  releasedArtifact,
  releasedDigest,
  sameConversationDuplicateGroups,
  splitHash,
  splitSeed,
  valid,
} from './fixtures.mjs';
import {
  bandCandidates,
  candidateInvariants,
  contaminationTrace,
  fixtureNormalize,
  idealCandidateProbability,
  leakageComparison,
  leakageSceneSnapshot,
  minhashCases,
  normalizationStates,
  prepareCandidate,
  referenceCandidate,
  referenceDigest,
  releaseTrace,
} from './model.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function validateOriginalModel() {
  assert.notEqual(changedDigest, releasedDigest);
  assert.deepEqual(excludedReleaseIds, [102, 104, 201, 202, 203]);
  assert.equal(leakageComparison(true).correct, 2);
  assert.equal(leakageComparison(false).correct, 1);
  assert.equal(leakageComparison(true).answers[0].matchedId, 101);
  assert.equal(leakageComparison(false).answers[0].matchedId, null);
  assert.deepEqual(
    leakageComparison(true).answers.map((row) => row.id),
    leakageComparison(false).answers.map((row) => row.id),
  );
  assert.deepEqual(normalizationStates(records[1].text), [
    '  BUILD is still failing  ',
    '  BUILD is still failing  ',
    '  build is still failing  ',
    'build is still failing',
  ]);
  assert.equal(normalizationStates('ﬁle')[1], 'file');
  assert.equal(leakageSceneSnapshot(1, 2.438 / 18.626).clean, true);
  assert.equal(leakageSceneSnapshot(1, 8.5374 / 18.626).showResult, false);
  assert.equal(leakageSceneSnapshot(1, 8.5376 / 18.626).comparison.correct, 1);
  assert.deepEqual(
    [0, 0.26, 0.51, 1].map((p) => releaseTrace(p).retained.length),
    [8, 7, 4, 3],
  );
  assert.equal(normalize(referencePassage).split(' ').length, 13);
  assert.equal(contaminationTrace(1, 0.25).matches.length, 1);
  assert.equal(contaminationTrace(1, 0.8).detected, false);
  assert.equal(contaminationTrace(2, 0).candidate, editedPassage);
  assert.equal(records.filter(valid).length, 7);
  assert.equal(records.length - records.filter(valid).length, 1);
  assert.equal(fingerprint(records[0].text), fingerprint(records[1].text));
  assert.notEqual(fingerprint(records[0].text), fingerprint(records[4].text));
  assert.equal(records.find((row) => normalize(row.text) === 'build is not failing')?.id, 107);
  assert.deepEqual(
    crossConversationReviewGroups.map((group) => group.map((row) => row.id)),
    [[201, 202, 203]],
  );
  assert.deepEqual(
    conflictGroups.map((group) => group.map((row) => row.id)),
    [[201, 202, 203]],
  );
  assert.deepEqual(
    [...conflictIds].sort((a, b) => a - b),
    [201, 202, 203],
  );
  assert.deepEqual(
    [...quarantineIds].sort((a, b) => a - b),
    [201, 202, 203],
  );
  assert.deepEqual(
    sameConversationDuplicateGroups.map((group) => group.map((row) => row.id)),
    [[101, 102]],
  );
  assert.deepEqual([...deduplicatedIds], [102]);
  assert.deepEqual(
    releasedArtifact.rows.map((row) => row.id),
    [101, 103, 107],
  );
  assert.equal(
    releasedArtifact.rows.some((row) => quarantineIds.has(row.id)),
    false,
  );
  assert.equal(
    releasedArtifact.rows.some((row) => deduplicatedIds.has(row.id)),
    false,
  );
  assert.deepEqual(
    releasedArtifact.rows.map((row) => row.conversation),
    ['c-51', 'c-52', 'c-54'],
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(partitionRows).map(([name, rows]) => [name, rows.length])),
    {
      train: 1,
      validation: 1,
      test: 1,
    },
  );
  assert.deepEqual(
    releasedArtifact.rows.map((row) => row.split),
    ['validation', 'train', 'test'],
  );
  assert.deepEqual(
    ['c-51', 'c-52', 'c-54'].map((key) => {
      const trace = splitHash(key);
      assert.equal(trace.input, `${splitSeed}:${key}`);
      assert.equal(trace.bucket, Number(BigInt(`0x${trace.prefix}`) % 100n));
      assert.notEqual(trace.bucket, Number(BigInt(`0x${trace.digest}`) % 100n));
      return [trace.prefix, trace.bucket];
    }),
    [
      ['3cd57ade', 82],
      ['fad9b7f5', 5],
      ['51e5681c', 92],
    ],
  );
  assert.equal(releasedDigest.length, 64);
  assert.equal(
    releasedDigest,
    createHash('sha256').update(JSON.stringify(releasedArtifact)).digest('hex'),
  );
  const splits = grouped(records);
  const sameConversation = records
    .filter((row) => row.conversation === 'c-51')
    .map((row) => splits.get(row.conversation));
  assert.equal(new Set(sameConversation).size, 1);
  assert.equal(jaccard('build has not passed', 'my build has not passed'), 0.75);
  assert.ok(Math.abs(lshProbability(0.75) - 0.772) < 0.002);
  assert.ok(records.every((row) => splits.has(row.conversation)));
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.deepEqual(
    referenceCandidate.kept.map((r) => r.ticket_id),
    [401, 403, 405, 406, 407, 408],
  );
  assert.equal(referenceDigest, 'ba384792199e9be7783cf58f4e75c62d96a266fdb5b93f8efc58ebf00ce172bf');
  assert(
    Object.values(candidateInvariants(referenceCandidate.kept, referenceCandidate.rejected)).every(
      Boolean,
    ),
  );
  assert.deepEqual(
    prepareCandidate(freshRows).kept.map((r) => [r.ticket_id, r.split]),
    [
      [701, 'train'],
      [703, 'train'],
    ],
  );
  assert.equal(minhashCases.length, 24);
  assert.equal(minhashCases.filter((c) => c.match).length, 18);
  assert.equal(bandCandidates([1, 4, 2, 8], [1, 4, 3, 7], 2).candidate, true);
  assert.equal(idealCandidateProbability(0.5, 2, 2), 0.4375);
  assert.equal(fixtureNormalize('  STRAẞE ﬁ ² Ａ '), 'strasse fi 2 a');
  return true;
}
