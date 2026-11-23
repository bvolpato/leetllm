import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { opening, slopes, stability, momentum, convention, rms, rmsDivisors } from './valley.mjs';
import {
  buffers,
  displacement,
  history,
  scale,
  comparison,
  schedule,
  firstMomentStep,
  rawMomentStep,
} from './moments.mjs';
import { accumulation, clipping, decay, zero, loop, clip } from './update.mjs';
import {
  resume,
  memory,
  budget,
  diagnostics,
  transfer,
  finalPractice,
  momentBytes,
  squares,
  TRANSFER,
} from './practice.mjs';
import {
  RUNS,
  UNSAFE,
  PRESCRIBED,
  COLD,
  SCHEDULED,
  ACCUMULATION,
  FRESH_RECIPE,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  EIGHTY,
  DIAGNOSTIC_RUNS,
  HELD_OUT_TRIALS,
  DECAY,
  COUPLED,
  ZERO_DECAY,
} from '../../../films/optimizers/fixtures.mjs';
import { scalarAdamWStep } from '../../../films/optimizers/arithmetic.mjs';

const painters = [
  opening,
  slopes,
  stability,
  momentum,
  convention,
  rms,
  buffers,
  displacement,
  history,
  scale,
  comparison,
  schedule,
  accumulation,
  clipping,
  decay,
  zero,
  loop,
  resume,
  memory,
  budget,
  diagnostics,
  transfer,
  finalPractice,
];
function draw(ctx, clock) {
  painters[clock.beat.chapterIndex](ctx, clock);
}
function close(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' differs from ' + expected);
}
function check() {
  const { sgd, momentum, adam } = RUNS;
  close(sgd.points[1].x, -0.8);
  close(sgd.points[1].y, 0.982);
  close(sgd.points[8].x, (-0.8) ** 8);
  close(UNSAFE.points[8].x, (-1.1) ** 8);
  const fifth = momentum.records[4],
    old = momentum.records[3].update[0],
    fresh = -fifth.eta * fifth.gradient[0];
  close(0.9 * old + 0.1 * fresh, fifth.update[0]);
  assert.ok(fresh > 0 && fifth.update[0] < 0);
  assert.ok(fifth.loss > momentum.records[3].loss && momentum.records[7].update[0] > 0);
  const fourth = PRESCRIBED[3];
  close(PRESCRIBED[1].mean[0], 1);
  close(PRESCRIBED[1].mean[1], 0.188);
  close(PRESCRIBED[1].rms[0], 1540);
  close(PRESCRIBED[1].square[0], 16.39);
  close(fourth.mean[0], 1.11);
  close(fourth.mean[1], 0.33268, 1e-4);
  close(0.018 * fourth.mean[0], (0.0018 * fourth.mean[0]) / 0.1);
  assert.deepEqual(
    PRESCRIBED.map((r) => r.gradient[1]),
    [1, 0.98, 0.96, 0.94],
  );
  for (const j of [0, 1]) {
    const first = PRESCRIBED[0];
    const normalized = first.gradient[j] / (Math.sqrt(first.rms[j]) + 1e-8);
    close(normalized, Math.sqrt(10), 2e-7);
    close(0.01 * normalized, first.rmsUpdate[j]);
    const corrected = fourth.correctedMean[j] / (Math.sqrt(fourth.correctedSquare[j]) + 1e-8);
    close(0.01 * corrected, fourth.adamUpdate[j]);
  }
  close(fourth.adamUpdate[0], 0.00041, 0.000005);
  close(fourth.adamUpdate[1], 0.00997, 0.000005);
  close(PRESCRIBED[0].rmsUpdate[0], PRESCRIBED[0].rmsUpdate[1], 1e-7);
  close(rmsDivisors[0], 1.01e-6, 1e-14);
  close(rmsDivisors[1], 1.00005e-4, 1e-12);
  assert.ok(PRESCRIBED[1].rmsUpdate[0] < 0 && PRESCRIBED[1].adamUpdate[0] > 0);
  close(fourth.adamUpdate[1] / fourth.adamUpdate[0], 24.4, 0.1);
  close(firstMomentStep.mean, 0.4);
  close(firstMomentStep.square, 0.016);
  close(rawMomentStep, 0.03162, 0.000005);
  close(firstMomentStep.dataStep, 0.01);
  for (const r of COLD.records) {
    close(r.next[0], 1);
    close(r.correctedMean[0], 100);
    close(r.correctedSquare[0], 10000);
  }
  close(adam.records[0].next[0], 0.92);
  close(adam.records[0].next[1], 0.92);
  assert.ok(sgd.records[39].loss < momentum.records[39].loss);
  close(adam.points[40].y, 0.04, 0.001);
  close(SCHEDULED.records[0].eta, 0);
  close(SCHEDULED.records[4].eta, 0.08);
  close(SCHEDULED.records.at(-1).eta, 0);
  assert.ok(SCHEDULED.records.at(-1).loss > adam.records.at(-1).loss);
  close(ACCUMULATION.weighted, -2);
  close(ACCUMULATION.wrong, -1);
  assert.deepEqual(clip([300, 400], 5).used, [3, 4]);
  assert.deepEqual(clip([0, 0], 5).used, [0, 0]);
  assert.equal(clip([NaN, 4], 5).valid, false);
  close(DECAY.next[0], 0.912);
  close(-DECAY.shrink[0], DECAY.eta * 0.1 * DECAY.before[0]);
  close(DECAY.before[0] + DECAY.dataUpdate[0], 0.92);
  close(COUPLED.next[0], 0.92);
  close(ZERO_DECAY.cold.weight, 9.99);
  assert.equal(ZERO_DECAY.absent.count, 0);
  assert.equal(ZERO_DECAY.absent.weight, 10);
  const coupled = scalarAdamWStep({ weight: 10, gradient: 0.1, decay: 0 });
  close(coupled.weight, 9.9);
  assert.equal(CPU_LOOP_TRACE.filter((r) => r.preclipNorm > 20).length, 11);
  close(CPU_LOOP_TRACE.at(-1).after[0], 0.03062, 1e-5);
  assert.deepEqual(CPU_RESUME_TRACE.original, CPU_RESUME_TRACE.complete);
  assert.notEqual(
    CPU_RESUME_TRACE.original.at(-1).weights[0],
    CPU_RESUME_TRACE.weightsOnly.at(-1).weights[0],
  );
  assert.equal(momentBytes(7e9) / 4, 14e9);
  assert.equal(momentBytes(2), 16);
  close(EIGHTY.sgd.points[80].y, 0.48436, 1e-5);
  close(EIGHTY.adamw.points[80].x, 0.02158, 1e-5);
  assert.deepEqual(
    squares.map((r) => r.s),
    [8, 4, 6.5],
  );
  assert.deepEqual(
    squares.map((r) => r.max),
    [8, 8, 8],
  );
  assert.ok(DIAGNOSTIC_RUNS.high.records[7].loss > DIAGNOSTIC_RUNS.lower.records[7].loss);
  assert.ok(DIAGNOSTIC_RUNS.high.records[11].loss < DIAGNOSTIC_RUNS.lower.records[11].loss);
  close(DIAGNOSTIC_RUNS.high.records[8].loss, 19.733, 0.0005);
  close(DIAGNOSTIC_RUNS.lower.records[8].loss, 28.801, 0.0005);
  assert.ok(
    HELD_OUT_TRIALS[0].held < HELD_OUT_TRIALS[1].held &&
      HELD_OUT_TRIALS[0].train > HELD_OUT_TRIALS[1].train,
  );
  assert.deepEqual(
    TRANSFER.map((r) => r.next[0] > 0),
    [true, false, false],
  );
  close(TRANSFER[0].gradient[0], -50);
  close(TRANSFER[1].mean[0], -5);
  close(TRANSFER[2].correctedMean[0], -50);
  close(TRANSFER[2].correctedSquare[0], 2500);
  [0.9, 0.09, 0.08].forEach((delta, i) => close(TRANSFER[i].update[0], delta));
  const w = FRESH_RECIPE;
  close(w.weighted, -4);
  close(w.wrong, -10 / 3);
  close(w.counts[0] / w.targets.length, 2 / 5);
  close((w.means[0] + w.means[1]) / 2, w.wrong);
  close(w.update.mean, w.wrongUpdate.mean);
  close(w.update.square, w.wrongUpdate.square);
  assert.equal(w.clipped, w.wrongClipped);
  close(w.clipped, -3);
  close(w.dataEndpoint, 2.05);
  close(w.update.shrink, 0.002);
  close(w.update.weight, 2.048);
  close(w.update.weight, w.wrongUpdate.weight);
  return true;
}
export default { title: 'Account for Every Optimizer Update', preparePicture: prepareCaptions, draw, check };
