import {
  beamResult,
  beamWidthAt,
  branchFixture,
  checkExpression,
  chooseReasoningStrategy,
  frontierControlFixture,
  initialItems,
  introductoryMove,
  reasoningDecision,
  reasoningRecordScore,
  searchValues,
  successorStates,
  voteFixture,
} from './arithmetic.mjs';
import {
  FRESH_FRACTION_TREE,
  LINEAR_STATES,
  STRATEGY_RECEIPTS,
  VOTING_CASES,
} from './fixtures.mjs';
import {
  canonicalAction,
  canonicalVote,
  freshFractionTrace,
  frontierSnapshot,
  occurrenceExpressionCheck,
  pruningSnapshot,
} from './construction.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const LINEAR_TRACK = createCueTrack({
  initial: {
    id: 'linear-initial',
    snapshot: LINEAR_STATES[0],
  },
  cues: LINEAR_STATES.slice(1).map((snapshot, index) => ({
    id: `linear-step-${index + 1}`,
    beat: index,
    at: 0.34,
    snapshot,
  })),
});
export function validateModel() {
  assert.deepEqual(introductoryMove(0, 0.99).remaining, [4, 5, 6, 7]);
  assert.equal(introductoryMove(1, 0.5).consumed, false);
  assert.deepEqual(introductoryMove(1, 0.88).remaining, [24, 5, 7]);
  assert.equal(introductoryMove(2, 0).check.reachesGoal, true);
  assert.equal(introductoryMove(2, 0).check.allInputsUsed, false);
  const states = [
    LINEAR_TRACK.sample({
      beat: 0,
      beatP: 0.33,
    }),
    LINEAR_TRACK.sample({
      beat: 0,
      beatP: 0.34,
    }),
    LINEAR_TRACK.sample({
      beat: 1,
      beatP: 0.34,
    }),
    LINEAR_TRACK.sample({
      beat: 2,
      beatP: 0.34,
    }),
  ];
  assert.deepEqual(
    states.map((item) => item.snapshot.remaining),
    [[4, 5, 6, 7], [2, 5, 7], [2, 12], [24]],
  );
  assert.equal(states[1].id, 'linear-step-1');
  const solution = searchValues([4, 5, 6, 7]);
  assert.equal(solution.status, 'solved');
  assert(checkExpression(solution.solution.tree).valid);
  assert.equal(searchValues([24, 5, 7]).status, 'no-solution');
  const capped = searchValues([4, 5, 6, 7], 1);
  assert.equal(capped.status, 'budget-exhausted');
  assert.equal(capped.visited, 1);
  assert(capped.frontier.length > 0);
  const exhaustedDeadEnd = searchValues([24, 5, 7]);
  assert.equal(exhaustedDeadEnd.status, 'no-solution');
  assert.equal(exhaustedDeadEnd.frontier.length, 0);
  assert.equal(beamWidthAt(1, 0.99), 1);
  assert.equal(beamWidthAt(2, 0.49), 1);
  assert.equal(beamWidthAt(2, 0.5), 2);
  const branches = branchFixture();
  assert.equal(branches.branchA.completion, 'no-solution');
  assert.equal(branches.branchB.completion, 'solved');
  assert.equal(beamResult(1).result, 'no-solution-in-retained-frontier');
  assert.equal(beamResult(2).result, 'solved');
  assert(pruningSnapshot(0, 0.67).aTrace.queued > 0);
  assert(pruningSnapshot(0, 0.69).aExhausted);
  assert(pruningSnapshot(2, 0.45).bPruned);
  assert(!pruningSnapshot(2, 0.45).bRetained);
  assert(pruningSnapshot(2, 0.7).bRetained);
  assert(pruningSnapshot(2, 0.99).completionValid);
  const frontier = frontierControlFixture();
  assert.equal(frontier.generatedCount, successorStates(initialItems([4, 5, 6, 7])).length);
  assert.deepEqual(frontier.queue, frontier.children);
  assert.deepEqual(frontier.stack, [...frontier.children].reverse());
  assert.equal(frontierSnapshot(false, 0.8).expanded.label, frontier.children[0].label);
  assert.equal(frontierSnapshot(true, 0.8).expanded.label, frontier.children[1].label);
  assert.equal(frontierSnapshot(false, 0.1).pending.length, 0);
  const vote = voteFixture();
  assert.equal(vote.winner, '24');
  assert.equal(vote.votes, 3);
  assert(
    vote.checked.every((result) => !result.valid && result.reachesGoal && !result.allInputsUsed),
  );
  validateReasoningUpgrade();
}
export function validateReasoningUpgrade() {
  assert.deepEqual(
    reasoningRecordScore({
      checks: {
        tests_passed: true,
      },
      final_action: 'manual_review',
    }),
    {
      coverage: 1 / 3,
      valuesMatch: false,
      actionMatches: false,
    },
  );
  assert.deepEqual(
    reasoningRecordScore({
      checks: {
        tests_passed: true,
        security_scan_clear: false,
        reviewer_approved: true,
      },
      final_action: 'merge_release',
    }),
    {
      coverage: 1,
      valuesMatch: false,
      actionMatches: true,
    },
  );
  assert.throws(
    () =>
      reasoningDecision({
        tests_passed: true,
        security_scan_clear: 'false',
        reviewer_approved: true,
      }),
    /actual booleans/,
  );
  const five = [
    'Merge release',
    'merge_release',
    'Auto merge approved change',
    'manual_review',
    'force',
  ];
  assert.equal(canonicalVote(five).share, 0.6);
  assert.equal(canonicalVote(five).decision, 'merge_release');
  assert.equal(canonicalVote(five, 0.8).decision, 'abstain');
  assert.equal(canonicalVote([]).decision, 'abstain');
  assert.equal(VOTING_CASES.filter((c) => canonicalAction(c.samples[0]) === c.expected).length, 2);
  assert.equal(
    VOTING_CASES.filter((c) => canonicalVote(c.samples).decision === c.expected).length,
    3,
  );
  assert.equal(chooseReasoningStrategy(STRATEGY_RECEIPTS).strategy, 'vote_5');
  assert.equal(chooseReasoningStrategy(STRATEGY_RECEIPTS, 0.9, 100), null);
  assert.equal(
    chooseReasoningStrategy([
      {
        strategy: 'bad',
        accuracy: Infinity,
        p95_ms: -1,
        calls: 1,
      },
    ]),
    null,
  );
  assert.equal(freshFractionTrace(3).check.valid, true);
  assert.equal(freshFractionTrace(3).check.result, '24');
  assert.equal(freshFractionTrace(0).wrong.result, '25');
  assert.equal(freshFractionTrace(0).wrong.allInputsUsed, true);
  assert.equal(freshFractionTrace(0).wrong.valid, false);
  const stolen = structuredClone(FRESH_FRACTION_TREE);
  stolen.left.occurrence = '8a';
  assert.equal(occurrenceExpressionCheck(stolen).valid, false);
  assert.equal(searchValues([3, 3, 8, 8], 1).status, 'budget-exhausted');
  return true;
}
