import { coverage, promptCoverage, rawKVBytes } from './arithmetic.mjs';
import {
  PRUNING_CUE,
  PRUNING_MEASURED_TIMELINE,
  answer,
  budgets,
  candidates,
  kvPerToken,
  latency,
  prune,
  quality,
  scored,
} from './fixtures.mjs';
import {
  checkedRevisionLedger,
  pruningSnapshot,
  revisionSnapshot,
  selectorSnapshot,
  testTimeCoreFrame,
} from './construction.mjs';
import { chooseBudget, chooseFeasible, plurality, retainedBranchLedger } from './model.mjs';
import { verifiedChairs } from './seating.mjs';
import assert from 'node:assert/strict';
import { frameState } from '../../lib/lesson.mjs';
export function validateOriginalModel() {
  assert.equal(checkedRevisionLedger(1).best, null);
  for (const count of [2, 3, 4]) {
    const ledger = checkedRevisionLedger(count);
    assert.equal(ledger.best.id, 'D2');
    assert.equal(ledger.best.answer, 44);
    assert(ledger.best.passed);
    assert.equal(ledger.calls, 1 + 2 * (count - 1));
    if (count > 2) {
      assert(!ledger.latest.passed);
      assert(ledger.latest.score > ledger.best.score);
    }
  }
  assert.equal(answer, 44);
  assert.equal(candidates.filter((v) => v === answer).length, 1);
  assert.ok(Math.abs(coverage(4) - 0.68359375) < 1e-12);
  assert.ok(Math.abs(coverage(4) * 0.8 - 0.546875) < 1e-12);
  assert.equal(scored.reduce((a, v) => (v.score > a.score ? v : a)).answer, 48);
  assert.equal(
    prune.reduce((a, v) => a + v, 0),
    14,
  );
  assert.equal(
    budgets[quality.reduce((a, v, i) => (latency[i] <= 1000 && v > quality[a] ? i : a), 0)],
    512,
  );
  assert.equal(kvPerToken, 131072);
  assert.equal(4000 + 8 * 1000, 12000);
  assert.equal(plurality(candidates), 32);
  assert.deepEqual(verifiedChairs(candidates), [44]);
  assert.deepEqual(verifiedChairs([32, 32, 40, 48]), []);
  assert.equal(selectorSnapshot(0, 0.12).rows.length, 1);
  assert.equal(selectorSnapshot(0, 0.5).rows.length, 2);
  assert(selectorSnapshot(0, 0.5).correct);
  assert(!selectorSnapshot(0, 0.88).correct);
  assert.equal(revisionSnapshot(1, 0.12).count, 3);
  assert(!revisionSnapshot(1, 0.12).stopped);
  assert.equal(revisionSnapshot(1, 0.5).count, 4);
  assert(revisionSnapshot(1, 0.5).stopped);
  assert.equal(revisionSnapshot(1, 0.5).calls, 7);
  assert.deepEqual(pruningSnapshot(0, 0.5).rows, [8, 8, 8, 8]);
  assert.equal(pruningSnapshot(0, 0.5).generatedSteps, 32);
  const pruningBeat = PRUNING_MEASURED_TIMELINE.beats[1],
    stateAtElapsed = (elapsed) =>
      frameState(
        PRUNING_MEASURED_TIMELINE,
        pruningBeat.start + elapsed,
        0,
        PRUNING_MEASURED_TIMELINE.beats.length,
      );
  assert.ok(Math.abs(PRUNING_CUE.beatSpan - PRUNING_CUE.audioDuration - PRUNING_CUE.hold) < 1e-9);
  assert.ok(Math.abs(PRUNING_CUE.beatSpan - (pruningBeat.until - pruningBeat.start)) < 1e-9);
  for (const [elapsed, expected] of [
    [2.824, 4],
    [7.249, 13],
    [7.25, 14],
    [7.5, 14],
    [7.825, 14],
    [8.8125, 14],
    [9.9875, 14],
  ]) {
    const state = stateAtElapsed(elapsed);
    assert.equal(state.beat, 1);
    assert.equal(pruningSnapshot(state.beat, state.beatP).generatedSteps, expected);
  }
  let previousSteps = 4;
  const firstNativeFrame = Math.ceil(pruningBeat.start * PRUNING_MEASURED_TIMELINE.fps),
    lastNativeFrame = Math.ceil(pruningBeat.until * PRUNING_MEASURED_TIMELINE.fps) - 1;
  for (let frame = firstNativeFrame; frame <= lastNativeFrame; frame++) {
    const elapsed = frame / PRUNING_MEASURED_TIMELINE.fps - pruningBeat.start,
      state = stateAtElapsed(elapsed),
      current = pruningSnapshot(state.beat, state.beatP);
    assert.equal(state.beat, 1);
    assert.ok(current.generatedSteps >= previousSteps);
    assert.ok(current.generatedSteps <= 14);
    assert.equal(current.generatedSteps === 14, elapsed >= 7.25);
    previousSteps = current.generatedSteps;
  }
  for (const elapsed of [7.25, 7.5, 7.825, 8.8125, 10.45, 11.8]) {
    const state = stateAtElapsed(elapsed),
      current = pruningSnapshot(state.beat, state.beatP);
    assert.deepEqual(current.rows, [8, 2, 3, 1]);
    assert.equal(current.generatedSteps, 14);
  }
  assert.deepEqual(pruningSnapshot(2, 0.12).rows, [8, 2, 3, 1]);
  assert.equal(budgets[chooseBudget()], 512);
  assert.equal(budgets[chooseBudget(400)], 128);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(
    rawKVBytes({
      layers: 32,
      kvHeads: 8,
      width: 128,
      scalarBytes: 2,
      positions: 1,
    }),
    131072,
  );
  assert(Math.abs(promptCoverage([0.8, 0.2], 4).mean - 0.7944) < 1e-12);
  assert(Math.abs(promptCoverage([0.99, 0.05], 4).mean - 0.59274687) < 1e-12);
  const all = retainedBranchLedger(6),
    five = retainedBranchLedger(5),
    kept = retainedBranchLedger(4);
  assert.equal(all.positions, 6000);
  assert.equal(kept.positions, 5000);
  assert(!all.fits);
  assert(!five.fits);
  assert.equal(five.bytes / 2 ** 20, 257.8125);
  assert(kept.fits);
  assert.equal(all.gib, 0.274658203125);
  assert.equal(kept.gib, 0.2288818359375);
  for (const n of [4, 5, 6]) {
    const row = retainedBranchLedger(n);
    assert.equal(row.spentTokens, 3000);
    assert.equal(row.spentScoreCalls, 6);
    assert.equal(row.verifiedAnswer, 6000);
    assert.equal(row.promptOwners, 1);
  }
  assert.equal(
    chooseFeasible([
      {
        id: 'a',
        quality: 0.83,
        latency: 200,
        cost: 0.001,
      },
    ]),
    null,
  );
  assert.equal(testTimeCoreFrame('router-feasible').chosen.id, 'bounded');
  const frontier = testTimeCoreFrame('search-bound');
  assert(frontier.minHistory.at(-1) <= frontier.completed);
  assert(frontier.lastHistory.at(-1) > frontier.completed);
  assert.deepEqual(testTimeCoreFrame('hidden-ttft').totals, [1780, 6580]);
  assert.throws(() => promptCoverage([1.1], 4), RangeError);
  assert.throws(() => retainedBranchLedger(3), RangeError);
  return true;
}
