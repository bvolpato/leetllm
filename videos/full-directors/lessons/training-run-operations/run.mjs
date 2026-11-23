import assert from 'node:assert/strict';
import {
  boundary,
  trainingRun,
  drillRun,
  nextDrillGroup,
  canFinish,
} from '../../../films/training-run-operations/boundaries.mjs';
import {
  advance,
  saved,
  baseline,
  lost,
} from '../../../films/training-run-operations/fixtures.mjs';
import {
  firstAdaptiveMovement,
  trainingMemory,
  adamScaleProposal,
} from '../../../films/training-run-operations/arithmetic.mjs';
export { saved, baseline, lost, firstAdaptiveMovement, trainingMemory };
export const job = boundary(trainingRun),
  drill = boundary(drillRun);
export const update = trainingRun.step,
  drillUpdate = drillRun.step;
export const examples = [
  { consumed: 0, sample: 'Birches lean over the stream.' },
  { consumed: job.saved, sample: 'Frost rims the roof.' },
];
export function windowState(rounds, replicas = 4, perReplica = 2) {
  return rounds * replicas * perReplica;
}
export function deadline(warning, finish, save, margin) {
  return {
    warning,
    finish,
    save,
    margin,
    total: finish + save + margin,
    spare: warning - finish - save,
    fit: canFinish(warning, finish, save, margin),
  };
}
export function packet(checked, published) {
  const previous = update,
    snapshot = previous + 1;
  const latest = checked === 4 && published ? snapshot : previous;
  return {
    checked,
    latest,
    snapshot,
    cursor: latest * job.perUpdate,
    hostCursor: snapshot * job.perUpdate,
  };
}
export function owner(index, width) {
  return Math.floor(index / width);
}
export function range(n, width) {
  const lo = owner(n, width) * width;
  return [lo, lo + width];
}
export const hostGB = [70 * 2, 70 * 4, 70 * 4];
export const reader = { source: Array.from({ length: 8 }, (_, i) => i + 8), destination: [10, 11] };
export function meanGradient(rows) {
  const sums = rows.map((r) => r.reduce((a, b) => a + b, 0)),
    count = rows.flat().length,
    d = rows.length;
  const normalized = sums.map((v) => (v * d) / count);
  return {
    sums,
    count,
    d,
    normalized,
    replica: sums.reduce((a, s, i) => a + s / rows[i].length, 0) / d,
    token: normalized.reduce((a, b) => a + b, 0) / d,
  };
}
export const tokenRows = [[10], [-2, -2, -2]],
  gradients = meanGradient(tokenRows);
export function counters(done, signals = [true, false, true], batch = 64) {
  const decisions = signals.slice(0, done),
    updates = decisions.filter(Boolean).length;
  return {
    examples: batch * done,
    updates,
    scheduler: updates,
    scale: 8 * 0.5 ** (done - updates),
  };
}
export function overhead(compute, save = 90) {
  return save / (compute + save);
}
export function sliceResult(consumed) {
  const reference = nextDrillGroup(drill.saved),
    read = nextDrillGroup(consumed);
  return { reference, read, matches: read.filter((v, i) => reference[i] === v).length };
}
export function copyDemo(stepped) {
  const live = { w: 1 },
    dictionary = live,
    independent = { ...live };
  if (stepped) live.w -= 0.1 * (2 * live.w);
  return [live.w, dictionary.w, independent.w];
}
export const batchMultiplier = 2;
export const initialAdam = { rate: 0.002, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 };
export const newAdam = adamScaleProposal(initialAdam, batchMultiplier);
export const linearRate = initialAdam.rate * batchMultiplier;
export function check() {
  assert.deepEqual([job.saved, job.pending, job.live], [117760, 40, 117800]);
  assert.deepEqual(
    examples.map((s) => s.consumed),
    [0, 117760],
  );
  assert.equal(windowState(8), windowState(4, 8));
  assert.equal(windowState(5), 40);
  assert.deepEqual(copyDemo(true), [0.8, 0.8, 1]);
  assert.deepEqual(
    [packet(3, true).latest, packet(4, false).latest, packet(4, true).cursor],
    [1840, 1840, 117824],
  );
  assert.deepEqual([deadline(120, 20, 90, 10).fit, deadline(119, 20, 90, 10).spare], [true, 9]);
  assert.equal(deadline(119, 20, 90, 10).fit, false);
  assert.equal((overhead(300) * 100).toFixed(1), '23.1');
  assert.equal((overhead(1200) * 100).toFixed(1), '7.0');
  assert.deepEqual(advance(saved, 5), baseline[12]);
  assert.equal(lost[5].step, 12);
  assert.deepEqual([baseline[12].w.toFixed(6), lost[5].w.toFixed(6)], ['0.125436', '0.126672']);
  assert.equal(firstAdaptiveMovement(1e-9, 0.002, 1e-8).toFixed(6), '0.000182');
  for (const n of [6, 7]) assert.deepEqual([owner(n, 4), owner(n, 2)], [1, 3]);
  assert.deepEqual(range(19, 4), [16, 20]);
  assert.deepEqual(
    reader.source.filter((i) => i >= 10 && i < 12),
    reader.destination,
  );
  assert.deepEqual(hostGB, [140, 280, 280]);
  assert.equal(6400 / 128, 50);
  assert.equal(linearRate, 0.004);
  assert.deepEqual(
    [newAdam.rate.toFixed(6), newAdam.epsilon.toExponential(2), newAdam.beta1, newAdam.beta2],
    ['0.002828', '7.07e-9', 0.8, 0.998],
  );
  assert.deepEqual([gradients.replica, gradients.token, ...gradients.normalized], [4, 1, 5, -3]);
  assert.deepEqual(counters(2), { examples: 128, updates: 1, scheduler: 1, scale: 4 });
  assert.equal(counters(3).examples, 192);
  assert.equal(trainingMemory(70e9, 4, 24).baseFits, false);
  assert.equal(trainingMemory(70e9, 4, 48).fullTrainingFitKnown, false);
  assert.deepEqual([drill.saved, drill.pending, drill.live], [1752, 12, 1764]);
  assert.equal(deadline(59, 12, 40, 8).fit, false);
  assert.deepEqual(sliceResult(drill.live).read, [55, 28, 70, 16, 82, 39]);
  assert.deepEqual(sliceResult(drill.saved).read, [42, 17, 63, 8, 91, 34]);
  assert.equal(sliceResult(drill.live).matches, 0);
  assert.equal(sliceResult(drill.saved).matches, 6);
  return true;
}
