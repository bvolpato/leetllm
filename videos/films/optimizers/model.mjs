import {
  ACCUMULATION,
  COLD,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  DIAGNOSTIC_RUNS,
  EIGHTY,
  FRESH_RECIPE,
  HELD_OUT_TRIALS,
  PRESCRIBED,
  RUNS,
  SCHEDULED,
  UNSAFE,
} from './fixtures.mjs';
import { gradient, loss } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function adamState(step) {
  return {
    ...RUNS.adam.records[step - 1],
    step,
  };
}
export function validateModel() {
  assert.deepEqual(gradient([1, 1]), [100, 1]);
  assert(Math.abs(RUNS.sgd.records[0].next[0] + 0.8) < 1e-12);
  assert(Math.abs(RUNS.sgd.records[0].next[1] - 0.982) < 1e-12);
  assert(UNSAFE.records.at(-1).loss > loss([1, 1]));
  const r = RUNS.momentum.records[4];
  assert(r.gradient[0] < 0 && r.mean[0] > 0 && r.update[0] < 0 && r.loss > loss(r.before));
  for (const run of [
    ...Object.values(RUNS),
    SCHEDULED,
    COLD,
    ...Object.values(EIGHTY),
    ...Object.values(DIAGNOSTIC_RUNS),
  ])
    for (const r of run.records) {
      assert(r.next.every(Number.isFinite));
      assert.deepEqual(r.gradient, gradient(r.before));
      r.next.forEach((x, j) => assert(Math.abs(x - r.before[j] - r.update[j]) < 1e-12));
    }
  assert(COLD.records.every((r) => r.next[0] === 1 && r.next[1] === 1));
  assert(SCHEDULED.records.at(-1).loss > RUNS.adam.records.at(-1).loss);
  assert(PRESCRIBED[1].rmsUpdate[0] < 0 && PRESCRIBED[1].adamUpdate[0] > 0);
  assert(Math.abs(EIGHTY.sgd.records.at(-1).loss - 0.11730161152690877) < 1e-10);
  assert(Math.abs(EIGHTY.adamw.records.at(-1).loss - 0.023508846755599614) < 1e-10);
  assert.equal(CPU_LOOP_TRACE.length, 60);
  for (const [i, r] of CPU_LOOP_TRACE.entries()) {
    assert.equal(r.step, i + 1);
    assert(r.after.every(Number.isFinite));
    assert(Math.abs(loss(r.after) - r.loss) < 1e-5);
  }
  assert.equal(CPU_LOOP_TRACE.filter((r) => r.preclipNorm > 20).length, 11);
  assert.deepEqual(CPU_RESUME_TRACE.original, CPU_RESUME_TRACE.complete);
  assert.notDeepEqual(CPU_RESUME_TRACE.original, CPU_RESUME_TRACE.weightsOnly);
  assert.deepEqual(ACCUMULATION.gradients, [2, -2, -6]);
  assert.deepEqual([ACCUMULATION.wrong, ACCUMULATION.weighted], [-1, -2]);
  assert.deepEqual(ACCUMULATION.means, [2, -4]);
  assert.equal(ACCUMULATION.start - 0.1 * ACCUMULATION.wrong, 1.1);
  assert.equal(ACCUMULATION.start - 0.1 * ACCUMULATION.weighted, 1.2);
  assert(HELD_OUT_TRIALS[0].train > HELD_OUT_TRIALS[1].train);
  assert(HELD_OUT_TRIALS[0].held < HELD_OUT_TRIALS[1].held);
  assert(DIAGNOSTIC_RUNS.high.records[7].loss > DIAGNOSTIC_RUNS.lower.records[7].loss);
  assert(DIAGNOSTIC_RUNS.high.records[11].loss < DIAGNOSTIC_RUNS.lower.records[11].loss);
  assert.equal(FRESH_RECIPE.wrong, -10 / 3);
  assert.notEqual(FRESH_RECIPE.weighted, FRESH_RECIPE.wrong);
  assert.equal(FRESH_RECIPE.clipped, FRESH_RECIPE.wrongClipped);
  assert.deepEqual(FRESH_RECIPE.update, FRESH_RECIPE.wrongUpdate);
  assert.equal(FRESH_RECIPE.update.count, 1);
  assert.equal(FRESH_RECIPE.update.shrink, 0.002);
  assert.equal(FRESH_RECIPE.weighted, FRESH_RECIPE.gradients.reduce((a, b) => a + b, 0) / 5);
  assert.equal(FRESH_RECIPE.clipped, -3);
  assert(Math.abs(FRESH_RECIPE.update.weight - 2.048) < 1e-12);
  return true;
}
