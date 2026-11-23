import { cosineSimilarity, orderAudit, tailOmission } from './arithmetic.mjs';
import {
  ADMISSION_FIXTURES,
  ADMISSION_GATES,
  CANDIDATES,
  LOG_ANSWERS,
  NOVELTY_EXAMPLE,
  PARAPHRASE,
  RELEASE_SUITES,
  firstPageOnlyClient,
  noRetryClient,
} from './fixtures.mjs';
import { admissionTrace, diversityState, generationState, judgeSnapshot } from './construction.mjs';
import {
  admissionEvidence,
  checkSupportLog,
  passedGateCount,
  runSearchFixture,
  screenCandidates,
  screenTask,
  syntheticRelease,
  verifier,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const copy = screenTask(ADMISSION_FIXTURES.find((row) => row.id === 'C5').text);
  assert.deepEqual(copy.matches[0], {
    span: 'fetch every page with the',
    start: 1,
    referenceStart: 0,
  });
  assert.equal(copy.matches.length, 3);
  assert.deepEqual(screenTask(PARAPHRASE).matches, []);
  const { references, proposals, cutoff } = NOVELTY_EXAMPLE;
  const runPool = (rows) =>
    screenCandidates(rows, references, cutoff).map((row) => row.passedGates);
  assert.deepEqual(runPool(proposals), [5, 3]);
  assert.deepEqual(runPool([{ ...proposals[0], votes: [0.8, 0.7] }, proposals[1]]), [4, 5]);
  assert.equal(orderAudit(0.8, 0.3).stable, true);
  assert.equal(orderAudit(0.5, 0.5).stable, false);
  assert.deepEqual(
    LOG_ANSWERS.map((row) => {
      const { fields, emailRequest, allowed } = checkSupportLog(row);
      return { fields, emailRequest, allowed };
    }),
    [
      { fields: ['request_id'], emailRequest: 'declined', allowed: true },
      { fields: ['customer_email'], emailRequest: 'success', allowed: false },
    ],
  );
  assert.deepEqual(
    LOG_ANSWERS.map((r) => r.answer.split(' ').length),
    [4, 4],
  );
  const measured = Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.count / s.total]));
  const floors = Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.limit / s.total]));
  const rare = RELEASE_SUITES.find((s) => s.id === 'rare');
  assert.equal(rare.limit - rare.count, 2);
  assert.deepEqual(syntheticRelease(measured, floors).passes, [true, false, true]);
  assert.equal(
    syntheticRelease({ ...measured, rare: (rare.count + 2) / rare.total }, floors).release,
    true,
  );
  assert(Math.abs(tailOmission(0.05, 8) - 0.6634204312890623) < 1e-12);
  assert.equal(
    syntheticRelease({
      common: 0.92,
      rare: 0.76,
      unsafe: 0.005,
    }).release,
    false,
  );
  assert.deepEqual(
    syntheticRelease({
      common: 0.92,
      rare: 0.76,
      unsafe: 0.005,
    }).passes,
    [true, false, true],
  );
  assert.throws(() => cosineSimilarity([Infinity, 0], [1, 0]), RangeError);
  assert.equal(generationState(0, 1).rows.length, 3);
  assert.equal(generationState(1, 1).rows.length, 4);
  assert.equal(generationState(2, 1).rows.length, 5);
  for (const beat of [0, 1, 2]) assert.equal(generationState(beat, 1).familyCount, 3);
  assert.equal(diversityState(1, 7.3 / 12.838).review, true);
  assert.equal(diversityState(1, 7.3 / 12.838).novel, null);
  assert.equal(diversityState(2, 1).novelComparison, 1);
  assert.equal(judgeSnapshot(0, 1).comparisonVisible, false);
  assert.equal(judgeSnapshot(1, (4.4875 - 0.001) / 10.534).comparisonVisible, false);
  assert.equal(judgeSnapshot(1, (4.4875 + 0.001) / 10.534).comparisonVisible, true);
  assert.equal(judgeSnapshot(2, 0).comparisonVisible, true);
  const compliant = verifier(CANDIDATES[0]);
  const oversized = verifier(CANDIDATES[1]);
  assert.equal(compliant.accepted, true);
  assert.deepEqual(compliant.result.items, ['Ada', 'Grace', 'Linus']);
  assert.equal(compliant.retryCount, 1);
  assert.deepEqual(
    compliant.requests.map((request) => request.cursor),
    [null, null, 'page-2'],
  );
  assert.deepEqual(
    compliant.requests.map((request) => request.limit),
    [100, 100, 100],
  );
  assert.equal(oversized.accepted, false);
  assert.equal(oversized.checks.pageLimit, false);
  assert.equal(oversized.result.error, 'page limit is 100');
  assert.deepEqual(
    ADMISSION_GATES.map(
      (_gate, index) =>
        ADMISSION_FIXTURES.filter((row) => passedGateCount(row) >= index + 1).length,
    ),
    [5, 4, 3, 2, 1],
  );
  assert.deepEqual(ADMISSION_FIXTURES.map(passedGateCount), [5, 4, 3, 2, 1, 0]);
  assert.equal(admissionEvidence(ADMISSION_FIXTURES[3])[2], false);
  assert.equal(admissionEvidence(ADMISSION_FIXTURES[4])[1], false);
  assert.equal(admissionEvidence(ADMISSION_FIXTURES[5])[0], false);
  assert.deepEqual(
    ADMISSION_FIXTURES.filter((row) => admissionEvidence(row).every(Boolean)).map((row) => row.id),
    ['C1'],
  );
  assert.equal(admissionTrace(0, 0.02).completedGates, 0);
  for (const [beat, span, cue, gate] of [
    [0, 18.022, 7.9375, 1],
    [0, 18.022, 11.3125, 2],
    [1, 16.222, 4.55, 3],
    [1, 16.222, 7.7125, 4],
  ]) {
    assert.equal(admissionTrace(beat, (cue - 0.001) / span).completedGates, gate - 1);
    assert.equal(admissionTrace(beat, (cue + 0.001) / span).completedGates, gate);
  }
  assert.equal(
    admissionTrace(2, (5.025 - 0.001) / 21.582).rows.find((r) => r.id === 'C2').failed,
    false,
  );
  assert.equal(
    admissionTrace(2, (5.025 + 0.001) / 21.582).rows.find((r) => r.id === 'C2').failed,
    true,
  );
  assert.equal(admissionTrace(2, 7 / 21.582).survivors, 1);
  assert.equal(admissionTrace(2, 7 / 21.582).acceptedRows, 0);
  assert.equal(admissionTrace(2, (8.25 + 0.001) / 21.582).acceptedRows, 1);
  assert.equal(admissionTrace(2, 0.98).acceptedRows, 1);
  assert.equal(admissionTrace(2, 0.98).survivors, 1);
  const noRetry = runSearchFixture({
    run: noRetryClient,
  });
  assert.equal(noRetry.accepted, false);
  assert.equal(noRetry.checks.boundedRetry, false);
  assert.equal(noRetry.result.error, 'temporary rate limit');
  const noCursor = runSearchFixture({
    run: firstPageOnlyClient,
  });
  assert.equal(noCursor.accepted, false);
  assert.equal(noCursor.checks.followedCursor, false);
  assert.deepEqual(noCursor.result.items, ['Ada', 'Grace']);
  const near = cosineSimilarity([1, 0], CANDIDATES[1].vector);
  const distinct = cosineSimilarity([1, 0], CANDIDATES[0].vector);
  assert(Math.abs(near - 0.999796) < 1e-5);
  assert(distinct < 0.3);
  const audit = orderAudit(0.8, 0.7);
  assert.equal(audit.remappedA, 0.30000000000000004);
  assert.equal(audit.averageA, 0.55);
  assert.equal(audit.stable, false);
  assert.throws(() => cosineSimilarity([0, 0], [1, 0]), RangeError);
  return true;
}
