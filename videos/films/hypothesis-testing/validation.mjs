import {
  estimatorFactors,
  exactRightTail,
  exactSignPower,
  jointDifferenceMoments,
  passAtK,
  usefulLiftDecision,
} from './arithmetic.mjs';
import {
  candidateSubsets,
  developmentBootstrap,
  holdoutBootstrap,
  holdoutRows,
  studies,
  macroTaskInterval,
  macroTaskResamples,
  taskRows,
} from './fixtures.mjs';
import { holdoutFrame } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateHypothesisConstructions() {
  const v = jointDifferenceMoments();
  assert(Math.abs(v.cov - 0.2) < 1e-12);
  assert(Math.abs(v.paired - 0.0025) < 1e-12);
  assert.equal(macroTaskResamples.length, 256);
  assert(Math.abs(macroTaskInterval[0] - 7 / 36) < 1e-12);
  assert(Math.abs(macroTaskInterval[1] - 221 / 252) < 1e-12);
  assert(Math.abs(estimatorFactors(2, 10, 5).success - 7 / 9) < 1e-12);
  assert(usefulLiftDecision([0.02, 0.14]) === 'positive-size-unestablished');
  return true;
}
export function validateModel() {
  validateHypothesisConstructions();
  assert.equal(taskRows.length, 40);
  assert.equal(taskRows.filter((r) => r.difference > 0).length, 8);
  assert.equal(taskRows.filter((r) => r.difference < 0).length, 5);
  assert.equal(taskRows.reduce((a, r) => a + r.difference, 0) / 40, 0.075);
  assert.equal(exactRightTail(8, 13), 2380 / 8192);
  assert.equal(exactSignPower(13).critical, 10);
  assert.equal(exactSignPower(13, 0.65, 0.05 / 20).critical, 12);
  assert.deepEqual(developmentBootstrap.interval, [-0.1, 0.25]);
  assert.equal(studies.null[0].wins, 5);
  assert.deepEqual(holdoutBootstrap.interval, [0.0625, 0.1375]);
  assert.equal(holdoutRows.filter((row) => row.difference > 0).length, 52);
  assert.equal(holdoutRows.filter((row) => row.difference < 0).length, 12);
  assert.equal(candidateSubsets.filter((s) => !s.passes).length, 56);
  assert(Math.abs(passAtK(2, 10, 3) - 64 / 120) < 1e-12);
  assert(
    !holdoutFrame({
      beat: 1,
      beatP: 1,
    }).release,
  );
  return true;
}
