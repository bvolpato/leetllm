import { bounded, packedAttention, targetLoss } from './arithmetic.mjs';
import { MASK, REPLY_PROBS, SFT_CHECKPOINTS, TOKENS } from './fixtures.mjs';
import { cueProgress, motion, spoken } from './construction.mjs';
import assert from 'node:assert/strict';
export function maskSnapshot(beat, progress, cues) {
  const applied = motion({ beat, beatP: progress, cues }, 'mask-context', 0, 0.45, 0.8);
  const labels = TOKENS.map((token, i) =>
    !MASK[i] && i < Math.ceil(5 * applied) ? '−100' : token,
  );
  return { labels, count: MASK.filter(Boolean).length, applied };
}
export function packingSnapshot(beat, progress) {
  const seconds = bounded(progress) * [17.112, 19.368, 16.832][beat],
    perturbed = beat === 2 && seconds >= 8.1125,
    values = perturbed ? [101, 102, 103, 10, 20, 30] : [1, 2, 3, 10, 20, 30],
    packProgress = beat > 0 ? 1 : bounded((seconds - 6.4875) / 1.2);
  return {
    seconds,
    values,
    perturbed,
    packProgress,
    packed: packProgress === 1,
    boundaryMasked: beat === 2 && seconds >= 3.5875,
    bOutput: packedAttention(values, 4),
    wrongOutput: packedAttention(values, 4, false),
    aOutput: packedAttention(values, 1),
    mask: Array.from(
      {
        length: 6,
      },
      (_, i) =>
        Array.from(
          {
            length: 6,
          },
          (_, j) => Number(j <= i && Math.floor(i / 3) === Math.floor(j / 3)),
        ),
    ),
  };
}
export function lossTrace(beat, progress, cues) {
  const state = { beat, beatP: progress, cues };
  const scores = REPLY_PROBS.map(targetLoss);
  const removed = spoken(state, 'loss-remove', 3, 0.22);
  const included = scores.slice(0, removed ? 2 : 3);
  const sum = included.reduce((a, b) => a + b, 0);
  return { losses: scores, count: included.length, removed, sum, mean: sum / included.length };
}
export function validateModel() {
  assert.deepEqual(
    TOKENS.filter((_, i) => MASK[i]),
    ['open', 'ticket', 'END'],
  );
  assert.deepEqual(TOKENS.slice(4, 7), ['ASSIST', 'open', 'ticket']);
  assert.equal(maskSnapshot(0, 1).labels.filter((label) => label === '−100').length, 5);
  assert.deepEqual(paddingLabels(false), [-100, 7, 8, -100, -100, -100]);
  assert.deepEqual(paddingLabels(true), [-100, 7, 8, 2, -100, -100]);
  const full = lossTrace(1, 1);
  const clipped = lossTrace(3, 1);
  assert.equal(full.mean.toFixed(3), '0.364');
  assert.equal(clipped.mean.toFixed(3), '0.434');
  assert.equal(full.sum.toFixed(3), '1.091');
  assert.equal(packingSnapshot(1, 1).bOutput, 15);
  assert.equal(packingSnapshot(2, 1).wrongOutput, 67.2);
  assert.deepEqual(
    [false, true].map((repaired) => sftBoundaryRepair(repaired).mean.toFixed(3)),
    ['1.461', '0.768'],
  );
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS).step, 600);
  assert.equal(sftCheckpointGate(SFT_CHECKPOINTS, 1).step, 400);
  return true;
}
export function packingImplementationState(beat, progress, cues) {
  const q = beat > 1 ? 1 : beat === 1 ? cueProgress(cues, 'packing-actual-change', progress) : 0,
    delta = Math.round(100 * bounded(q));
  const values = [1 + delta, 2 + delta, 3 + delta, 10, 20, 30];
  return {
    delta,
    values,
    independent: packedAttention(values, 4, true),
    global: packedAttention(values, 4, false),
  };
}
// Both padding rules see the same real stop and two identical padding IDs.
export function paddingLabels(byPosition) {
  const ids = [43, 7, 8, 2, 2, 2];
  return ids.map((id, i) => (i > 0 && (byPosition ? i < 4 : id !== 2) ? id : -100));
}
export function sftBoundaryRepair(repaired = false) {
  const tokens = [...TOKENS.slice(0, 3), '19 days', ...TOKENS.slice(4), 'USER'];
  const active = tokens.map((_, i) => i === 5 || i === 6 || (repaired ? i === 7 : i === 8));
  const supplied = [null, null, null, null, null, 0.5, 0.25, 0.8, 0.1];
  const probabilities = supplied.filter((_, i) => active[i]);
  return {
    tokens,
    active,
    count: active.filter(Boolean).length,
    mean: probabilities.reduce((s, v) => s + targetLoss(v), 0) / probabilities.length,
    probabilities,
  };
}
export function sftResume(restored = true) {
  const saved = 0.9,
    m1 = 0.2,
    v1 = 0.004,
    g = -1,
    beta1 = 0.9,
    beta2 = 0.999;
  const step = restored ? 2 : 1,
    m = beta1 * (restored ? m1 : 0) + (1 - beta1) * g,
    v = beta2 * (restored ? v1 : 0) + (1 - beta2) * g * g;
  const update = (0.1 * (m / (1 - beta1 ** step))) / (Math.sqrt(v / (1 - beta2 ** step)) + 1e-8);
  return {
    saved,
    m,
    v,
    step,
    update,
    weight: saved - update,
  };
}
export function sftCheckpointGate(rows, floor = 0.98) {
  for (const r of rows)
    for (const k of ['step', 'format', 'policy', 'loss']) assert(Number.isFinite(r[k]));
  return (
    [...rows]
      .filter((r) => r.format >= floor)
      .sort((a, b) => b.policy - a.policy || a.loss - b.loss || a.step - b.step)[0] ?? null
  );
}
