import { THRESHOLD, candidateScores, matchedPairs } from './fixtures.mjs';
import { route, wilson } from './arithmetic.mjs';
import { stageTrack, thresholdTrack } from './construction.mjs';
import assert from 'node:assert/strict';
export function candidateRows() {
  return matchedPairs.map((row) => ({
    ...row,
    formal: candidateScores[row.id][0],
    conversational: candidateScores[row.id][1],
  }));
}
export function offsetRows() {
  const conversationalScores = { p1: 0.6, p6: 0.8 };
  return candidateRows().map((row) => ({
    ...row,
    conversational: conversationalScores[row.id] ?? row.conversational,
  }));
}
export function criterionState(beat, beatP) {
  return thresholdTrack.sample({
    beat,
    beatP,
  }).snapshot;
}
export function criterionMetrics(snapshot) {
  const rows = snapshot.variant === 'candidate' ? candidateRows() : matchedPairs;
  const formal = rates('formal', snapshot.threshold, rows);
  const conversational = rates('conversational', snapshot.threshold, rows);
  return {
    rows,
    formal,
    conversational,
    tprGap: Math.abs(formal.tpr - conversational.tpr),
    fprGap: Math.abs(formal.fpr - conversational.fpr),
    pairFlips: flips(snapshot.threshold, rows),
  };
}
export function matchedCondition(beat, progress) {
  const wording = beat === 0 && progress < 0.45 ? 'formal' : 'conversational';
  const pair = matchedPairs.find((row) => row.id === 'p4');
  return {
    wording,
    score: pair[wording],
    route: route(pair[wording]),
  };
}
export function rates(variant, threshold = THRESHOLD, rows = matchedPairs) {
  if (!['formal', 'conversational'].includes(variant)) throw new Error('unknown wording slice');
  const positives = rows.filter((row) => row.ready),
    negatives = rows.filter((row) => !row.ready);
  const score = (row) => row[variant];
  const tp = positives.filter((row) => route(score(row), threshold) === 'auto_serve').length;
  const fp = negatives.filter((row) => route(score(row), threshold) === 'auto_serve').length;
  const selected = rows.filter((row) => route(score(row), threshold) === 'auto_serve').length;
  return {
    tp,
    fn: positives.length - tp,
    fp,
    tn: negatives.length - fp,
    ready: positives.length,
    unclear: negatives.length,
    tpr: tp / positives.length,
    fpr: fp / negatives.length,
    selection: selected / rows.length,
  };
}
export function flips(threshold = THRESHOLD, rows = matchedPairs) {
  return rows
    .filter((row) => route(row.formal, threshold) !== route(row.conversational, threshold))
    .map((row) => row.id);
}
// Both tables contain the same reviewed pairs. Score their deterministic regression contract.
export function fixtureResult(rows) {
  const formal = rates('formal', THRESHOLD, rows);
  const conversational = rates('conversational', THRESHOLD, rows);
  const tprGap = Math.abs(formal.tpr - conversational.tpr);
  const fprGap = Math.abs(formal.fpr - conversational.fpr);
  const pairFlips = flips(THRESHOLD, rows);
  const rateChecksPass =
    tprGap <= 0.1 &&
    fprGap <= 0.1 &&
    Math.min(formal.tpr, conversational.tpr) >= 0.8 &&
    Math.max(formal.fpr, conversational.fpr) <= 0.1;
  return {
    formal,
    conversational,
    tprGap,
    fprGap,
    pairFlips,
    rateChecksPass,
    passed: rateChecksPass && pairFlips.length === 0,
  };
}
export function pairFlipSnapshot(progress) {
  const visibleCount = Math.floor(Math.max(0, Math.min(1, progress)) * matchedPairs.length);
  const rows = matchedPairs.slice(0, visibleCount);
  return {
    threshold: THRESHOLD,
    rows,
    routeFlips: flips(THRESHOLD, rows),
  };
}
export function candidateMetrics(threshold = THRESHOLD) {
  const rows = candidateRows();
  const formal = rates('formal', threshold, rows),
    conversational = rates('conversational', threshold, rows);
  return {
    formal,
    conversational,
    tprGap: Math.abs(formal.tpr - conversational.tpr),
    fprGap: Math.abs(formal.fpr - conversational.fpr),
    pairFlips: flips(threshold, rows),
  };
}
export function validateModel() {
  const formal = rates('formal'),
    conversational = rates('conversational');
  assert.deepEqual([formal.tp, formal.fn, formal.fp, formal.tn], [5, 1, 1, 3]);
  assert.deepEqual(
    [conversational.tp, conversational.fn, conversational.fp, conversational.tn],
    [3, 3, 0, 4],
  );
  assert(Math.abs(formal.tpr - 5 / 6) < 1e-12);
  assert(Math.abs(conversational.tpr - 3 / 6) < 1e-12);
  assert(Math.abs(formal.fpr - 1 / 4) < 1e-12);
  assert(Math.abs(formal.tpr - conversational.tpr - 1 / 3) < 1e-12);
  assert.deepEqual(flips(), ['p4', 'p5', 'n1']);
  assert.equal(flips(0.5).length, 0);
  assert.equal(pairFlipSnapshot(0).threshold, THRESHOLD);
  assert.equal(pairFlipSnapshot(0).rows.length, 0);
  assert.deepEqual(
    pairFlipSnapshot(0.1).rows.map((row) => row.id),
    ['p1'],
  );
  assert.equal(pairFlipSnapshot(0.1).routeFlips.length, 0);
  assert.deepEqual(pairFlipSnapshot(0.5).routeFlips, ['p4', 'p5']);
  assert.deepEqual(pairFlipSnapshot(0.8).routeFlips, ['p4', 'p5', 'n1']);
  assert.deepEqual(pairFlipSnapshot(0.999999).routeFlips, ['p4', 'p5', 'n1']);
  assert.equal(pairFlipSnapshot(1).rows.length, 10);
  assert.equal(rates('formal', 0.5).selection, 1);
  assert.equal(rates('formal', 0.95).selection, 0);
  const lenient = criterionMetrics(criterionState(0, 0.999999));
  assert.equal(lenient.formal.selection, 1);
  assert.equal(lenient.conversational.selection, 1);
  assert.equal(lenient.formal.tpr, 1);
  assert.equal(lenient.formal.fpr, 1);
  const allReview = criterionMetrics(criterionState(1, 0.999999));
  assert.equal(allReview.formal.selection, 0);
  assert.equal(allReview.conversational.selection, 0);
  assert.equal(allReview.tprGap, 0);
  assert.equal(allReview.fprGap, 0);
  const candidateState = criterionState(2, 0.999999);
  const candidateAtRender = criterionMetrics(candidateState);
  assert.equal(candidateState.variant, 'candidate');
  assert.deepEqual([candidateAtRender.formal.tp, candidateAtRender.conversational.tp], [5, 5]);
  assert.deepEqual([candidateAtRender.formal.fp, candidateAtRender.conversational.fp], [0, 0]);
  assert.deepEqual(
    [candidateAtRender.formal.selection, candidateAtRender.conversational.selection],
    [0.5, 0.5],
  );
  assert.equal(candidateAtRender.tprGap, 0);
  assert.equal(candidateAtRender.fprGap, 0);
  assert.deepEqual(candidateAtRender.pairFlips, []);
  assert(Math.abs(wilson(5, 6)[0] - 0.436) < 0.002);
  assert(Math.abs(wilson(3, 6)[1] - 0.812) < 0.002);
  const candidate = candidateMetrics();
  assert.equal(candidate.tprGap, 0);
  assert.equal(candidate.fprGap, 0);
  assert.deepEqual(candidate.pairFlips, []);
  const offset = offsetRows();
  assert.equal(fixtureResult(candidateRows()).passed, true);
  assert.equal(fixtureResult(offset).rateChecksPass, true);
  assert.equal(fixtureResult(offset).passed, false);
  for (const variant of ['formal', 'conversational'])
    assert.deepEqual(rates(variant, THRESHOLD, offset), candidate[variant]);
  assert.deepEqual(flips(THRESHOLD, offset), ['p1', 'p6']);
  assert.equal(route(offset.find((r) => r.id === 'p1').conversational), 'human_review');
  assert.equal(route(offset.find((r) => r.id === 'p6').conversational), 'auto_serve');
  assert.equal(candidate.formal.ready, 6);
  assert.deepEqual(criterionState(0, 0.99), {
    threshold: 0.5,
    variant: 'baseline',
  });
  assert.deepEqual(criterionState(1, 0.99), {
    threshold: 0.95,
    variant: 'baseline',
  });
  assert.deepEqual(criterionState(2, 0.99), {
    threshold: 0.7,
    variant: 'candidate',
  });
  assert.equal(
    stageTrack.sample({
      beat: 2,
      beatP: 0.99,
    }).snapshot.serverGate,
    true,
  );
  assert.deepEqual(matchedCondition(0, 0.12), {
    wording: 'formal',
    score: 0.78,
    route: 'auto_serve',
  });
  assert.deepEqual(matchedCondition(0, 0.5), {
    wording: 'conversational',
    score: 0.67,
    route: 'human_review',
  });
  assert.deepEqual(matchedCondition(1, 0), matchedCondition(0, 0.88));
  return true;
}
