import assert from 'node:assert/strict';
import { ground } from './studio.mjs';
import { preview, opening, fields, formats, rubric, receipts, policyClaims } from './reading.mjs';
import { swapFrame, swap, reconciliation, blind, probes, humanReview } from './ballots.mjs';
import { paired, prevalence, coverage, bounds, boundState, practiceState } from './measures.mjs';
import { history, historyState, transfer, ending, restoreState } from './service.mjs';
import {
  human,
  judge,
  revise,
  labels,
  structured,
  fieldMatches,
  searchMatches,
  edges,
  countMatches,
  agreement,
  counts,
  binary,
  records,
  extra,
  practice,
  reportFor,
  cleanPairs,
  duplicatePairs,
  escapedPairs,
  readMembers,
  decodedPairs,
  claims,
  stableSwap,
  conflictingSwap,
  receipt,
  aggregateSwaps,
  identity,
  upperAfterZero,
  belowOnePercent,
  restoreVotes,
  restoreTie,
  restoreReplies,
  fileCheck,
  fileMatches,
} from './specimens.mjs';

const scenes = [
  opening,
  fields,
  formats,
  rubric,
  receipts,
  policyClaims,
  swap,
  reconciliation,
  blind,
  probes,
  humanReview,
  paired,
  prevalence,
  coverage,
  history,
  bounds,
  transfer,
  ending,
];

function check() {
  assert.deepEqual(['compact', 'stepwise'].map(preview), [
    'Stop the rollout',
    'Payment-service has crossed',
  ]);
  assert.deepEqual(structured.map(fieldMatches), [true, true]);
  assert.deepEqual(structured.map(searchMatches), [true, true]);
  assert.equal(fieldMatches({ ...structured[0], action: 'continue' }), false);
  assert.equal(edges.length, 15);
  assert.equal(edges.filter(([a]) => a === 0).length * 2, 10);
  assert.equal(readMembers(cleanPairs), 'B');
  for (const pairs of [duplicatePairs, escapedPairs]) {
    assert.equal(Object.fromEntries(decodedPairs(pairs)).verdict, 'B');
    assert.equal(readMembers(pairs), 'duplicate field');
  }
  assert.equal(readMembers([cleanPairs[0], ['evidence', ['  ']]]), 'invalid shape');
  assert.equal(claims.filter(([, a, b]) => a !== b).length, 3);
  assert.deepEqual(stableSwap.map(identity), ['stepwise', 'stepwise']);
  assert.deepEqual(conflictingSwap.map(identity), ['stepwise', 'compact']);
  for (const [pair, expected] of [
    [stableSwap, 'stepwise'],
    [conflictingSwap, 'unresolved'],
    [[receipt('A'), receipt('tie', true)], 'unresolved'],
    [[receipt('tie'), receipt('tie', true)], 'tie'],
    [[receipt('A'), receipt('review', true)], 'review'],
  ])
    assert.equal(aggregateSwaps(...pair), expected);
  for (const second of [
    receipt('A'),
    { ...stableSwap[1], caseId: 'other' },
    { ...stableSwap[1], config: 'other' },
  ]) {
    assert.throws(() => aggregateSwaps(stableSwap[0], second));
  }
  assert.deepEqual(counts(human), [3, 3, 2]);
  assert.deepEqual(counts(judge), [4, 3, 1]);
  assert.deepEqual(agreement, { pairedMatches: 6, expected: 23, observed: 48, total: 64 });
  assert.deepEqual(
    labels.map((v) => human.filter((x) => x === v).length * judge.filter((x) => x === v).length),
    [12, 9, 2],
  );
  const gain = agreement.observed - agreement.expected;
  const possible = agreement.total - agreement.expected;
  assert.equal(gain, 25);
  assert.equal(possible, 41);
  assert.equal((gain / possible).toFixed(4), '0.6098');
  assert.equal(binary(false).filter((r) => !r.human && r.judge).length, 10);
  assert.equal(binary(1).filter((r) => r.human === r.judge).length, 100);
  for (const [items, res, match] of [
    [records, 8, 6],
    [practice, 14, 10],
  ]) {
    for (const values of [items, [...items, extra]]) {
      const r = reportFor(values);
      assert.equal(r.coverage, res / values.length);
      assert.equal(r.agreement, match / res);
    }
  }
  assert.equal(reportFor([extra]).agreement, null);
  assert.equal(reportFor([{ outcome: 'tie' }]).resolved, 1);
  assert.equal(reportFor([{ outcome: 'tie' }]).comparable, 0);
  assert.equal(belowOnePercent, 299);
  assert.ok(upperAfterZero(298) > 0.01 && upperAfterZero(299) < 0.01);
  assert.equal((100 * upperAfterZero(50)).toFixed(2), '5.82');
  assert.equal(countMatches(human, revise), 6);
  assert.equal(revise[5], human[5]);
  assert.notEqual(revise[7], human[7]);
  assert.equal(restoreReplies[aggregateSwaps(...restoreVotes)], 'Run the restore again.');
  assert.equal(aggregateSwaps(restoreVotes[0], restoreTie), 'unresolved');
  assert.ok(fileMatches(fileCheck));
  assert.ok(!fileMatches({ ...fileCheck, restored: 'batch=41\nrows=127' }));
  const clock = (b, values) => ({ beat: { beatIndex: b - 1 }, reveal: (p) => values[p] ?? 0 });
  const baseline = practiceState(clock(2, {
    'and conditional agreement': 1,
    'Each column here represents': 1,
  }));
  assert.deepEqual([baseline.rep.attempted, baseline.showCoverage, baseline.showAgreement], [20, true, true]);
  const extraColumn = practiceState(clock(2, { 'One extra parse failure': 1 }));
  const answer = clock(3, { 'Agreement on the same fourteen': 1 });
  const duringAnswer = practiceState({ ...answer, elapsed: 4, speechDuration: 10 });
  const settled = practiceState({ ...answer, elapsed: 10, speechDuration: 10 });
  for (const state of [extraColumn, duringAnswer, settled]) {
    assert.deepEqual(
      [state.rep.attempted, state.rep.resolved, state.rep.comparable, state.rep.matches],
      [21, 14, 14, 10],
    );
  }
  assert.deepEqual(
    [extraColumn, duringAnswer, settled].map((s) => [s.showCoverage, s.showAgreement]),
    [[false, false], [true, false], [true, true]],
  );
  assert.equal(swapFrame(clock(1, { 'slide the two replies': 0.5 })).swap, 0.5);
  const replay = swapFrame(
    clock(4, { 'Replay just the second receipt': 1, 'this time it says B': 1 }),
  );
  assert.equal(replay.second, 1);
  assert.equal(identity(replay.pair[1]), 'compact');
  assert.equal(replay.result, 0);
  assert.equal(historyState(clock(4, {})).status, 'completed');
  assert.equal(historyState(clock(4, { 'from completed to accepted': 1 })).status, 'accepted');
  assert.equal(boundState(clock(5, { 'two hundred ninety-nine': 1 })), 299);
  assert.deepEqual(restoreState(clock(5, {})), { completed: 1, opening: 0, read: 0, compared: 0 });
  assert.equal(
    restoreState(clock(6, { 'Open manifest': 1, 'The recovered file contains': 1 })).compared,
    0,
  );
}
export default {
  title: 'Measuring the Quality of an Automated Judge',
  draw(ctx, clock) {
    ground(ctx);
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
