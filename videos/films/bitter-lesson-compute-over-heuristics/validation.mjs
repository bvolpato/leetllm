import { fixedBudgetPlans, lifetimePlans } from './arithmetic.mjs';
import {
  LEARNING_UNKNOWN_REPORT_AT,
  SEARCH_FOUR_CANDIDATES_AT,
  SEARCH_UNSAFE_ACTION_AT,
  baselineCases,
  heldOut,
  historyRows,
  sceneIds,
  trainingCases,
  unsafe,
} from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import {
  exactRoute,
  fitWordCounts,
  learningConstruction,
  learningStates,
  releaseAction,
  releaseGate,
  ruleGrowthState,
  ruleScores,
  scoreWords,
  searchState,
  verifierScore,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(scoreWords('timeout password').route, 'manual_review');
  for (const score of [NaN, Infinity, true, '0.98', -0.1, 1.01])
    assert.equal(
      releaseAction('promote', score, new Set(['eval_report'])),
      'human_review_invalid_score',
    );
  assert.equal(releaseAction('unknown', 0.99, new Set()), 'human_review_unknown_route');
  assert.equal(releaseAction('promote', 0.91, new Set()), 'request_evidence');
  assert.equal(releaseAction('promote', 0.95, new Set(['eval_report'])), 'promote');
  assert.equal(ruleGrowthState(0).score, 3);
  assert.equal(ruleGrowthState(1).score, 6);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const row = ruleGrowthState(p);
    assert.equal(row.rules.length, 3 + Math.ceil(p * 4));
    assert.equal(
      row.score,
      baselineCases.filter((c) => exactRoute(c.text, row.rules) === c.expected).length,
    );
  }
  const scores = ruleScores();
  assert.deepEqual([scores.baseline, scores.oldExpanded, scores.freshExpanded], [3, 6, 0]);
  assert.equal(scores.baselineCases.filter((row) => row.predicted === row.expected).length, 3);
  assert.equal(scores.freshCases.filter((row) => row.predicted === row.expected).length, 0);
  const trained = fitWordCounts();
  assert.equal(trained.quality.citation, 1);
  assert.equal(scoreWords('unsupported citation answer', trained).scores.quality, 3);
  assert.equal(scoreWords('responses take ages', trained).route, 'manual_review');
  assert.equal(learningStates(1).counts.latency.slowly ?? 0, 0);
  assert.equal(learningStates(1).unknown.route, 'manual_review');
  assert.equal(learningStates(2).counts.latency.slowly, 1);
  assert.equal(learningStates(2).after.route, 'latency');
  assert.deepEqual(
    [0.1, 0.25, 0.4].map(
      (beatP) =>
        learningConstruction({
          beat: 1,
          beatP,
        }).scores.quality,
    ),
    [0, 1, 2],
  );
  assert.equal(
    learningConstruction({
      beat: 1,
      beatP: 0.49,
    }).scores.quality,
    3,
  );
  assert.equal(
    learningConstruction({
      beat: 1,
      beatP: 0.6,
    }).route,
    'manual review',
  );
  assert.equal(
    learningConstruction({
      beat: 2,
      beatP: 0.05,
    }).slowlyCount,
    0,
  );
  assert.equal(
    learningConstruction({
      beat: 2,
      beatP: 0.38,
    }).slowlyCount,
    1,
  );
  assert.equal(
    learningConstruction({
      beat: 2,
      beatP: 0.9,
    }).scores.latency,
    4,
  );
  assert.equal(
    learningConstruction({
      beat: 2,
      beatP: 0.9,
    }).route,
    'latency',
  );
  assert.equal(
    learningConstruction({
      beat: 2,
      beatP: 0.43,
    }).route,
    'latency',
  );
  assert.ok(LEARNING_UNKNOWN_REPORT_AT > 0.532 && LEARNING_UNKNOWN_REPORT_AT < 0.533);
  assert.equal(
    sampleModel('learning', {
      beat: 0,
      beatP: 1,
    }).step,
    0,
  );
  const citationBeforeUnknownReport = sampleModel('learning', {
    beat: 1,
    beatP: LEARNING_UNKNOWN_REPORT_AT - 0.001,
  });
  assert.equal(citationBeforeUnknownReport.example.scores.quality, 3);
  assert.equal(citationBeforeUnknownReport.example.route, 'quality');
  assert.equal(
    sampleModel('learning', {
      beat: 1,
      beatP: LEARNING_UNKNOWN_REPORT_AT - 0.0001,
    }).step,
    0,
  );
  assert.equal(
    sampleModel('learning', {
      beat: 1,
      beatP: LEARNING_UNKNOWN_REPORT_AT,
    }).step,
    1,
  );
  assert.equal(
    sampleModel('learning', {
      beat: 1,
      beatP: 0.9,
    }).unknown.route,
    'manual_review',
  );
  assert.equal(
    sampleModel('learning', {
      beat: 1,
      beatP: 1,
    }).step,
    2,
  );
  const corrected = fitWordCounts([
    ...trainingCases,
    {
      text: 'the site loads slowly',
      label: 'latency',
    },
  ]);
  assert.equal(scoreWords('the site loads slowly', corrected).route, 'latency');
  assert.equal(
    heldOut.filter((row) => scoreWords(row.text, trained).route === row.expected).length,
    5,
  );
  assert.deepEqual(
    [1, 2, 4].map((_, step) => searchState(step).budget),
    [1, 2, 4],
  );
  assert.deepEqual(
    [0, 1, 2].map((step) => searchState(step).chosen.action),
    ['Retry later', 'Retry later', 'Block until citation_precision recovers'],
  );
  assert.equal(searchState(2).unsafeScore, 2);
  assert.equal(
    verifierScore({
      ...unsafe,
      evidence: ['run R42', 'run R42', 'unknown'],
    }),
    1,
  );
  const beforeFour = sampleModel('search', {
    beat: 1,
    beatP: SEARCH_FOUR_CANDIDATES_AT - 0.0001,
  });
  assert.equal(beforeFour.budget, 2);
  assert.equal(beforeFour.candidates.length, 2);
  assert.equal(beforeFour.chosen.action, 'Retry later');
  const withFour = sampleModel('search', {
    beat: 1,
    beatP: SEARCH_FOUR_CANDIDATES_AT,
  });
  assert.equal(withFour.budget, 4);
  assert.equal(withFour.candidates.length, 4);
  assert.equal(withFour.chosen.action, 'Block until citation_precision recovers');
  assert.equal(verifierScore(withFour.chosen), 2);
  assert.equal(withFour.unsafeVisible, false);
  assert.equal(
    sampleModel('search', {
      beat: 2,
      beatP: SEARCH_UNSAFE_ACTION_AT - 0.0001,
    }).unsafeVisible,
    false,
  );
  const unsafeCounterexample = sampleModel('search', {
    beat: 2,
    beatP: SEARCH_UNSAFE_ACTION_AT,
  });
  assert.equal(unsafeCounterexample.unsafeVisible, true);
  assert.equal(unsafeCounterexample.unsafeScore, verifierScore(unsafeCounterexample.chosen));
  for (const row of withFour.candidates) assert.equal(row.score, verifierScore(row));
  const fixed = fixedBudgetPlans();
  assert.equal(fixed[0].flops, 5.88e21);
  assert.equal(fixed[0].tokens, 140e9);
  assert.equal(fixed[1].tokens, 70e9);
  const lifetime = lifetimePlans();
  assert.equal(lifetime.large.train, 5.88e21);
  assert.equal(lifetime.small.train, 7.2e21);
  assert.equal(lifetime.savedPerServingToken, 8e9);
  assert.equal(lifetime.breakEven, 165e9);
  for (const beat of [0, 1])
    for (const beatP of [0, 0.5, 0.99])
      assert.equal(
        sampleModel('serving-break-even', {
          beat,
          beatP,
        }).q,
        0,
      );
  const cross = sampleModel('serving-break-even', {
    beat: 2,
    beatP: 0.6,
  });
  assert.equal(cross.q, lifetime.breakEven);
  assert.equal(cross.difference, 0);
  assert(
    sampleModel('serving-break-even', {
      beat: 2,
      beatP: 0.3,
    }).difference > 0,
  );
  assert(
    sampleModel('serving-break-even', {
      beat: 2,
      beatP: 0.99,
    }).difference < 0,
  );
  assert.equal(
    lifetime.large.train + 2 * lifetime.large.parameters * lifetime.breakEven,
    lifetime.small.train + 2 * lifetime.small.parameters * lifetime.breakEven,
  );
  assert.deepEqual(
    [0, 1, 2].map((step) => releaseGate(step).decision),
    ['human review', 'eligible for promotion', 'request report'],
  );
  assert.deepEqual(
    historyRows.map((row) => row.domain),
    ['Chess', 'Vision', 'Speech'],
  );
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.1, 0.5, 0.9, 1]) {
        const sample = sampleModel(id, {
          beat,
          beatP,
        });
        const expectedStep =
          id === 'learning' && (beat === 0 || (beat === 1 && beatP < LEARNING_UNKNOWN_REPORT_AT))
            ? 0
            : id === 'search' && beat === 1 && beatP >= SEARCH_FOUR_CANDIDATES_AT
              ? 2
              : beatP === 1 && beat < 2
                ? beat + 1
                : beat;
        assert.equal(sample.step, expectedStep);
      }
  return true;
}
