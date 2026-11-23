import {
  attend,
  visionCandidateRanking,
  visionPadding,
  visionPrefixBudget,
  visionPreln,
  visionProject,
  visionRotary,
  visionSiglip,
} from './arithmetic.mjs';
import { ps, tokens } from './fixtures.mjs';
import {
  alignmentSnapshot,
  attentionSnapshot,
  budgetSnapshot,
  contributionSnapshot,
  projectionSnapshot,
  visionFreshState,
} from './construction.mjs';
import { a, clip, embedded, out, sw, weights } from './model.mjs';
import assert from 'node:assert/strict';
import { weightedVectorState, dotProduct } from 'vizmatic';
export function validateModel() {
  validateVisionConstruction();
  assert.equal(contributionSnapshot(1, 4 / 18.17).count, 0);
  assert.equal(contributionSnapshot(1, 5 / 18.17).count, 1);
  assert.equal(contributionSnapshot(1, 7 / 18.17).count, 3);
  assert.deepEqual(contributionSnapshot(1, 7 / 18.17).partial, out);
  assert.equal(alignmentSnapshot(1, 3 / 19.562).mode, 'row');
  assert.equal(alignmentSnapshot(1, 4 / 19.562).mode, 'column');
  assert.equal(alignmentSnapshot(1, 10 / 19.562).lossVisible, false);
  assert.equal(alignmentSnapshot(1, 12 / 19.562).lossVisible, true);
  const columns = alignmentSnapshot(1, 4 / 19.562).values;
  for (let c = 0; c < 3; c++)
    assert(Math.abs(columns.reduce((sum, row) => sum + row[c], 0) - 1) < 1e-12);
  assert.deepEqual(embedded, [
    [2.5, 1],
    [4.5, 1],
    [10.5, 1],
    [12.5, 1],
  ]);
  assert.ok(Math.abs(weights.reduce((a, v) => a + v, 0) - 1) < 1e-12);
  assert.deepEqual(attend(ps), attend([...ps].reverse()));
  assert.ok(Math.abs(a[0] - sw[0]) > 0.4);
  assert.equal(((224 / 8) ** 2 / (224 / 16) ** 2) ** 2, 16);
  assert.equal(budgetSnapshot(0, 0.2).refinement, 0);
  assert.equal(budgetSnapshot(0, 0.99).refinement, 0);
  assert.equal(budgetSnapshot(1, 0.2).refinement, 1);
  assert.equal(budgetSnapshot(1, 0.42).keyGroups, 4);
  assert.equal(budgetSnapshot(1, 0.42).queryGroups, 1);
  assert.equal(budgetSnapshot(1, 0.9).keyGroups * budgetSnapshot(1, 0.9).queryGroups, 16);
  assert.ok(Math.abs(clip - 0.155) < 0.001);
  assert.ok(out.every(Number.isFinite));
  assert.equal(projectionSnapshot(0, 0.99).count, 0);
  assert.deepEqual(projectionSnapshot(1, 0.5).partial, [0.25, 0.5]);
  assert.deepEqual(projectionSnapshot(1, 0.9).partial, embedded[0]);
  assert.deepEqual(attentionSnapshot(2).output, [1, 0]);
  assert.deepEqual(attentionSnapshot(1).output, out);
  return true;
}
export function validateVisionConstruction() {
  assert.equal(dotProduct([1, 2, 3, 4, 10, 20, 30, 40], [1, 2, 3, 4, 5, 6, 7, 8]), 730);
  assert.equal(dotProduct([1, 10, 2, 20, 3, 30, 4, 40], [1, 2, 3, 4, 5, 6, 7, 8]), 650);
  assert.deepEqual(visionProject([0, 1, 4, 5]), [2.5, 1]);
  assert.deepEqual(visionProject([1, 1, 3, 5]), [2.5, 1]);
  assert.deepEqual(visionProject([1, 0, 4, 5]), [2.5, 0]);
  assert.deepEqual(visionProject([2, 3, 6, 7], true), [4.5, 1, -4]);
  assert.deepEqual(visionProject([3, 3, 5, 7], true), [4.5, 1, -2]);
  assert.equal(visionRotary().score, 2);
  assert(Math.abs(visionRotary([0, 0], [1, 0]).score - 1) < 1e-12);
  assert(Math.abs(visionRotary([2, 3], [3, 4]).score) < 1e-12);
  assert(Math.abs(visionRotary([4, 7], [5, 7]).score - 1) < 1e-12);
  const pre = visionPreln();
  assert(Math.abs(pre.output[0] - 2.341343079857511) < 1e-12);
  assert(Math.abs(pre.output[1] - 4.3413230804574905) < 1e-12);
  assert.deepEqual(visionPadding(0).output, visionPadding(4, true).output);
  assert(Math.abs(visionPadding(4, false).output[0] - 0.913) < 0.001);
  assert(Math.abs(visionSiglip().objective - 0.56) < 0.001);
  assert(Math.abs(visionCandidateRanking(false).probabilities[0] - 0.976) < 0.001);
  assert(Math.abs(visionCandidateRanking(true).probabilities[0] - 0.494) < 0.001);
  assert.deepEqual(
    [224, 448, 896].map((s) => visionPrefixBudget(s).mib),
    [96, 192, 576],
  );
  assert.equal(visionFreshState(0, 0.99).reveal, false);
  const terms = tokens.map((v, i) => ({
    id: 'v' + i,
    values: v,
    weight: weights[i],
  }));
  assert.deepEqual(
    weightedVectorState({
      terms,
      progress: 1,
    }).sum,
    out,
  );
  return true;
}
