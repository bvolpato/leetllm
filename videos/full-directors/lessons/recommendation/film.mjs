import assert from 'node:assert/strict';
import {
  documents,
  queryVector,
  itemVectors,
  TOWER_OBSERVED,
} from '../../../films/recommendation/fixtures.mjs';
import {
  ranked,
  retrievalOrder,
  candidateRecall,
} from '../../../films/recommendation/construction.mjs';
import {
  dot,
  lambdaPairLedger,
  rankScore,
  crossVectorState,
  crossMatrixState,
  reciprocalPrecision,
  listDistributionStep,
  examinationState,
  eventIntegrity,
  developerAggregation,
} from '../../../films/recommendation/arithmetic.mjs';
import {
  judgedListState,
  sourceSlate,
  preferredPairs,
} from '../../../films/recommendation/model.mjs';
import { ids } from './art.mjs';
import {
  opening,
  openingState,
  eligibility,
  judgments,
  poolStages,
  poolHeight,
  shortlist,
  scoring,
  gain,
  gainState,
  discountedSlot,
  universe,
  universeState,
  precision,
  prefixCases,
} from './retrieval.mjs';
import {
  vectors,
  catalog,
  cross,
  permutation,
  permutationState,
  feed,
  preferences,
  pairUpdate,
  pairState,
  ordinary,
  reverse,
  lambdas,
  swaps,
  weighted,
  distribution,
} from './models.mjs';
import {
  clickTrace,
  clickState,
  anchors,
  anchorState,
  support,
  logJoin,
  eventState,
  impressions,
  events,
  attribution,
} from './exposure.mjs';
import { slate, selection, gate, gateState, experiment } from './policy.mjs';

const title = 'How a System Builds a Useful Ranked List';
const painters = [
  opening,
  eligibility,
  judgments,
  shortlist,
  scoring,
  gain,
  universe,
  precision,
  vectors,
  catalog,
  cross,
  cross,
  permutation,
  feed,
  preferences,
  pairUpdate,
  lambdas,
  distribution,
  clickTrace,
  anchors,
  support,
  logJoin,
  slate,
  slate,
  gate,
  experiment,
  attribution,
  slate,
];
const draw = (ctx, clock) => painters[clock.beat.chapterIndex](ctx, clock);
function check() {
  const [g, r, s, b, l, p] = ids;
  const near = (actual, expected, tolerance = 1e-8) =>
    assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
  const snap = (chapter, beat, words = []) => ({
    beat: { chapterId: 'c' + String(chapter).padStart(2, '0'), beatIndex: beat - 1 },
    reveal: (phrase) => Number(words.includes(phrase)),
    wordCue: () => ({ start: 0, end: 1 }),
  });
  assert.equal(painters.length, 28);
  assert.equal(openingState(snap(1, 2)).open, 0);
  assert.equal(openingState(snap(1, 3, ['Open the runbook'])).open, 1);
  assert.deepEqual(
    documents.filter((d) => d.current && d.permitted).map((d) => d.id),
    [g, b, l, r, s],
  );
  assert.equal(documents.find((d) => d.id === p).retrieval, 0.99);
  const stageCounts = poolStages.map((stage) => stage.count);
  assert.deepEqual(stageCounts, [1000000, 1000, 100, 10]);
  assert.equal(stageCounts[0] / stageCounts[1], 1000);
  assert.equal(poolHeight(1), 0);
  assert.deepEqual(stageCounts.map((n) => poolHeight(n) / poolHeight(10)), [6, 3, 2, 1]);
  assert.deepEqual(
    ranked.map((d) => Number(rankScore(d).toFixed(3))),
    [2.488, 2.428, 2.296, 1.282, 0.894],
  );
  assert.deepEqual([3, 4, 5].map(candidateRecall), [1 / 3, 2 / 3, 1]);
  const ledger = lambdaPairLedger();
  assert.equal(ledger.pairs.length, 8);
  near(
    ledger.total.reduce((sum, v) => sum + v, 0),
    0,
  );
  const five = gainState(snap(6, 2, ['Look at slot four']));
  assert.equal(five.report.rows[five.example.rank - 1].id, r);
  assert.equal(five.example.rank, 4);
  assert.equal(five.example.gain, 3);
  assert.equal(five.example.contribution.toFixed(3), '1.292');
  for (const [state, returned, ideal, scores] of [
    [five, [3, 0, 0, 2, 2], [3, 2, 2, 0, 0], ['9.453', '10.393', '0.910']],
    [gainState(snap(6, 3, ['Now cut retrieval'])), [3, 0, 0], [3, 0, 0], ['7.000', '7.000', '1.000']],
    [gainState(snap(6, 4)), [3, 0, 0], [3, 2, 2], ['7.000', '10.393', '0.674']],
  ]) {
    assert.deepEqual(state.report.grades, returned);
    assert.deepEqual(state.idealGrades, ideal);
    assert.deepEqual([state.report.dcg, state.idealTotal, state.ratio].map((n) => n.toFixed(3)), scores);
    near(state.returnedSlots.reduce((sum, slot) => sum + slot.contribution, 0), state.report.dcg);
    near(state.idealSlots.reduce((sum, slot) => sum + slot.contribution, 0), state.idealTotal);
    if (state.cut === 3) assert.equal(state.example, undefined);
  }
  const beforeFiveRatio = snap(6, 3);
  assert.equal(gainState(beforeFiveRatio).ratioKnown, 0);
  assert.equal(gainState(snap(6, 3, ['Position accounts for the gap'])).ratioKnown, 1);
  const localCut = snap(6, 3, ['Now cut retrieval']);
  assert.equal(gainState({ ...localCut, elapsed: 9.99, speechDuration: 10 }).ratioKnown, false);
  assert.equal(gainState({ ...localCut, elapsed: 10, speechDuration: 10 }).ratioKnown, true);
  assert.equal(gainState(snap(6, 4)).ratioKnown, 0);
  assert.equal(gainState(snap(6, 4, ['The missing runbook'])).ratioKnown, 1);
  const prediction = universeState(snap(7, 4, ['Give retrieval one more candidate']));
  assert.deepEqual(prediction.pool, [g, b, l, r]);
  assert.deepEqual(prediction.order, [g, b, l]);
  assert.equal(prediction.reorder, 0);
  assert.deepEqual(
    universeState(snap(7, 5, ['The SDK example stays outside'])).order,
    prediction.order,
  );
  const landing = universeState(snap(7, 5, ['The ranker moves the runbook']));
  assert.deepEqual(landing.order.slice(0, 3), [g, r, b]);
  assert.equal(landing.reorder, 1);
  assert.deepEqual(landing.report.ideal, prediction.report.ideal);
  near(landing.report.idcg, prediction.report.idcg);
  for (const [beat, cut, score] of [
    [1, 3, 0.674],
    [6, 4, 0.856],
  ]) {
    const u = universeState(snap(7, beat));
    assert.equal(u.pool.length, cut);
    near(u.report.system, score, 0.0005);
    near(u.report.local, 1);
  }
  const metrics = prefixCases.map((grades) =>
    reciprocalPrecision(grades, { cutoff: 3, totalRelevant: 2 }),
  );
  assert.deepEqual(
    metrics.map((x) => x.rr),
    [0.5, 0],
  );
  assert.deepEqual(
    metrics.map((x) => x.ap),
    [0.25, 0.5],
  );
  near(reciprocalPrecision(retrievalOrder.map((d) => d.relevance)).ap, 0.7);
  assert.deepEqual(
    itemVectors.map((d) => dot(queryVector, d.vector)),
    [0.9, 0.8, 0.2],
  );
  for (const d of TOWER_OBSERVED.selected) near(dot(TOWER_OBSERVED.query, d.embedding), d.score);
  assert.deepEqual(crossVectorState().result, [15.5, 23]);
  assert.deepEqual(crossMatrixState().result, [16, 31]);
  for (const [q, end] of [
    [
      [0, 1],
      [2.25, 4.5],
    ],
    [
      [1, 0],
      [2.5, 5],
    ],
  ]) {
    const a = [...q, 1, 2];
    assert.deepEqual(
      crossVectorState(a, a, [0.5, 0.25, 0.5, 0.25], [0, 0, 0, 0]).result.slice(2),
      end,
    );
  }
  assert.equal(permutationState([g, g, s, b, l]).valid, false);
  assert.equal(permutationState([g, p, s, b, l]).valid, false);
  near(permutationState([r, g, s, b, l]).report.system, 0.858, 0.001);
  assert.equal(preferredPairs().length, 8);
  near(ordinary.nextGap, 0.10125);
  near(ordinary.next[0], 0.1575);
  near(ordinary.next[1], -0.0225);
  const updated = pairState(snap(16, 4, ['Both weights move']));
  assert.deepEqual(updated.weights, ordinary.next);
  near(updated.gap, 0.10125);
  const reset = pairState(snap(16, 5, ['Reset both weights']));
  near(reset.gap, 0);
  assert.deepEqual(reset.weights, [0, 0]);
  const reversed = pairState(snap(16, 6, ['Take the same half-size step']));
  near(reversed.gap, -0.10125);
  assert.deepEqual(reversed.weights, reverse.next);
  near(swaps[0].delta / swaps[1].delta, 26.6, 0.1);
  near(weighted.nextGap, ordinary.nextGap * swaps[0].delta);
  const d = listDistributionStep();
  near(d.gradient[0], -0.2);
  near(d.next[1], -0.1);
  near(listDistributionStep(d.target, d.next).predicted[0], 0.549834, 0.00001);
  const clicks = clickState(snap(19, 3, ['point four']));
  assert.deepEqual(
    clicks.map((r) => [r.position, r.impressions, r.clicks, r.propensity, r.estimate]),
    [
      [1, 100, 40, 1, 0.4],
      [2, 100, 20, 0.5, 0.4],
    ],
  );
  assert.deepEqual(
    anchorState(snap(20, 3, ['If the first slot'])).map((x) => x.corrected),
    [0.5, 0.5],
  );
  near(examinationState({ probability: 0.02, cap: 10, relevance: 0.5 }).expected, 0.1);
  assert.ok(eventIntegrity(impressions, events).join);
  assert.equal(eventState(snap(22, 3, ['one outcome for a page'])).integrity.join, false);
  const dup = eventState(
    snap(22, 3, ['one outcome for a page', 'Remove that orphan', 'Now log the same click']),
  );
  assert.equal(dup.integrity.unique, false);
  assert.equal(dup.integrity.join, true);
  assert.deepEqual(sourceSlate({ onlySource: 'platform' }).selected, [g, r]);
  const beforeCap = selection(snap(23, 1));
  const afterCap = selection(snap(23, 3, ['The blog takes']));
  assert.deepEqual([beforeCap.rows[2], afterCap.rows[2]], [s, b]);
  for (const [slate, expected] of [[beforeCap, 1.5], [afterCap, 0]]) {
    const report = judgedListState(slate.rows);
    assert.equal(discountedSlot(report.grades[2], 3).contribution, expected);
  }
  near(judgedListState(beforeCap.rows).dcg - judgedListState(afterCap.rows).dcg, 1.5);
  for (const [beat, words, denied, expected] of [
    [1, [], null, [g, r, b]],
    [2, [], g, [null, r, b]],
    [3, ['Take the runbook first'], g, [r, null, b]],
    [4, [], g, [r, s, b]],
    [6, ['Restore the original', 'revoke only the blog'], b, [g, r, null]],
    [8, [], b, [g, r, l]],
  ]) {
    const state = selection(snap(28, beat, words));
    assert.equal(state.revoked, denied);
    assert.deepEqual(state.rows, expected);
    assert.deepEqual(
      state.reserve,
      ranked.map((d) => d.id),
    );
    assert.equal(state.rows.filter(Boolean).includes(denied), false);
  }
  near(judgedListState([r, s, b], { revoked: [g] }).system, 1);
  near(judgedListState([g, r, l], { revoked: [b] }).system, 0.856, 0.001);
  const old = gateState(snap(25, 2)),
    next = gateState(snap(25, 4));
  assert.ok(old.pass);
  assert.equal(next.pass, false);
  assert.equal(next.p95, 18);
  near(developerAggregation().mean, 5 / 9);
  near(developerAggregation().pooled, 0.2);
}
export default { title, draw, check };
