import assert from 'node:assert/strict';
import {
  sunday,
  evidence,
  atomic,
  support,
  footnote,
  omission,
  aggregation,
  transfer,
} from './library.mjs';
import { replay, integrity, rank, ledger, key, finalReplay } from './policy.mjs';
import { abstain, defects, suite, judges } from './release.mjs';
import {
  receiptDay,
  dayNames,
  libraryScore,
  sourceCount,
  reviewedAnswers,
  average,
  june,
  july,
  POLICY_ID,
  drill,
  exposed,
  altered,
  admissiblePolicy,
  recordDigest,
  variants,
  evaluated,
  answers,
  paraphrases,
  classify,
  abstentions,
  abstentionOutcome,
  compareJudge,
  grades,
  sliceGate,
  report,
  SLICE_OUTCOMES,
  policyEvaluation,
  readerCall,
  missingWorkflow,
} from './specimens.mjs';
import { rankPrecision } from '../../../films/rag-evaluation/arithmetic.mjs';

const scenes = [
  sunday,
  evidence,
  atomic,
  support,
  footnote,
  omission,
  aggregation,
  transfer,
  replay,
  integrity,
  rank,
  ledger,
  key,
  abstain,
  defects,
  suite,
  judges,
  finalReplay,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(1.5, 1.5);
  scenes[clock.beat.chapterIndex](ctx, clock);
  ctx.restore();
}
function check() {
  assert.equal(dayNames[receiptDay], 'Monday');
  assert.deepEqual(sourceCount(['A', 'C'], ['A', 'B']), { hits: 1, needed: 2, selected: 2 });
  assert.deepEqual(sourceCount(['A', 'B', 'C'], ['A', 'B']), { hits: 2, needed: 2, selected: 3 });
  assert.deepEqual(sourceCount(['A'], ['B']), { hits: 0, needed: 1, selected: 1 });
  const bad = libraryScore(['box', 'instant', 'delivery']);
  assert.deepEqual([bad.supported, bad.emitted], [1, 3]);
  for (const [id, n] of [
    ['A', 1],
    ['B', 0],
  ]) {
    const m = libraryScore(['closed'], [id]);
    assert.deepEqual([m.supported, m.present, m.cited], [1, 1, n]);
  }
  for (const [ids, expected] of [
    [
      ['closed', 'box'],
      [2, 2, 2],
    ],
    [['next'], [1, 1, 1]],
  ]) {
    const m = libraryScore(ids);
    assert.deepEqual([m.supported, m.emitted, m.points.size], expected);
  }
  const votes = average(reviewedAnswers);
  assert.deepEqual(
    [votes.count, votes.n, votes.rates, votes.pooled, votes.mean],
    [9, 10, [1, 0], 0.9, 0.5],
  );
  assert.throws(() => average([[]]), /empty/);
  assert.equal(june.trace.candidates.indexOf(POLICY_ID), 2);
  assert.equal(june.trace.reranked[0], POLICY_ID);
  assert.deepEqual(june.trace.selected, [POLICY_ID]);
  assert.equal(admissiblePolicy(june.trace, june), true);
  assert.equal(admissiblePolicy(exposed, june), false);
  assert.equal(altered.records[POLICY_ID].version, june.records[POLICY_ID].version);
  assert.notEqual(recordDigest(altered.records[POLICY_ID]), recordDigest(june.records[POLICY_ID]));
  assert.equal(admissiblePolicy(altered.trace, altered), false);
  assert.equal(rankPrecision([false, false, true]), 1 / 3);
  assert.equal(rankPrecision([true, false, false]), 1);
  for (const [name, counts] of Object.entries({
    unsafe: ['1/2', '1/2', '1/3'],
    partial: ['2/2', '2/2', '2/3'],
    duplicate: ['3/3', '3/3', '2/3'],
    complete: ['3/3', '3/3', '3/3'],
    miscited: ['3/3', '0/3', '3/3'],
    blank: ['3/3', '0/3', '3/3'],
  }))
    assert.deepEqual(evaluated(june, answers[name]).counts, counts);
  assert.deepEqual(evaluated(june, answers.duplicate).mapped, [
    'freeze-scope',
    'approval',
    'approval',
  ]);
  assert.deepEqual(evaluated(june, answers.complete).mapped, june.required);
  assert.deepEqual(paraphrases.map(classify), ['approval', null, null]);
  const blank = evaluated(june, answers.blank).result;
  assert.equal(blank.citationCoverage, 2 / 3);
  assert.equal(blank.stages.at(-1).status, 'unscored');
  assert.equal(
    answers.miscited.every((r) => r.citation === drill),
    true,
  );
  assert.deepEqual(
    abstentions.map(([a, b, r]) => Object.values(abstentionOutcome(a, b, r))),
    [
      [true, true, true],
      [true, true, true],
      [true, false, false],
      [true, true, false],
    ],
  );
  assert.deepEqual(
    variants.map((v) => v.result.firstFailure),
    variants.map((v) => v.expected),
  );
  const mixed = policyEvaluation(variants[6].trace, answers.unsafe, june);
  assert.deepEqual([mixed.firstFailure, mixed.faithfulness], ['candidate retrieval', 0]);
  assert.equal(
    mixed.stages.slice(2).every((s) => s.status === 'unscored'),
    true,
  );
  assert.deepEqual(
    report.slices.map((s) => [s.k, s.n, s.pass]),
    [
      [1, 2, false],
      [2, 2, true],
      [0, 1, false],
    ],
  );
  assert.equal(report.overall, 3 / 5);
  assert.equal(report.pass, false);
  assert.equal(sliceGate(SLICE_OUTCOMES.filter((v) => v.slice === 'hotfix')).pass, false);
  assert.deepEqual(
    missingWorkflow.slices.map((s) => [s.k, s.n, s.pass]),
    [
      [19, 20, true],
      [39, 40, true],
      [0, 0, false],
    ],
  );
  assert.equal(readerCall(2).out, 'faithfulness 1.00, citations 1.00, completeness 0.67: stop');
  assert.equal(readerCall(3).out, 'faithfulness 1.00, citations 1.00, completeness 1.00: pass');
  assert.equal(readerCall(3, true).out, 'faithfulness 1.00, citations 0.00: stop');
  assert.deepEqual(grades.map(compareJudge), ['Agrees', 'False accept', 'False reject']);
  assert.equal(compareJudge({ supported: true }), 'Format failure');
  const julyPartial = evaluated(july, july.complete.slice(0, 3));
  assert.deepEqual(julyPartial.counts, ['3/3', '3/3', '3/4']);
  assert.equal(julyPartial.result.firstFailure, 'answer completeness');
  assert.deepEqual(julyPartial.mapped, june.required);
  assert.deepEqual(evaluated(july, july.complete).counts, ['4/4', '4/4', '4/4']);
  assert.equal(evaluated(july, july.complete).result.release, true);
  return true;
}
export default { title: 'Checking an Answer Against Its Evidence', draw, check };
