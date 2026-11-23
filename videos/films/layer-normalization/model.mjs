import { F, jac, ln, mean, norm, post, pre, rms, variance } from './arithmetic.mjs';
import { direction, epsilon, point, start, x } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { motion } from './timing.mjs';
import { dotProduct } from 'vizmatic';
export const centered = x.map((v) => v - 2);
export const normal = ln(x);
export const pre2 = pre(pre(start));
export const post2 = post(post(start));
export function placementTrace(input = start) {
  const preNorm = ln(input),
    preBranch = F(preNorm),
    preSum = input.map((v, i) => v + preBranch[i]);
  const postBranch = F(input),
    postSum = input.map((v, i) => v + postBranch[i]),
    postNorm = ln(postSum);
  return {
    pre: [input, preNorm, preBranch, preSum],
    post: [input, postBranch, postSum, postNorm],
  };
}
export function placementTravel(beat, progress, column, cues) {
  const state = { beat, beatP: progress, cues };
  const repeat = motion(state, 'second-block', 4, 0.01, 0.25);
  if (repeat > 0) return 3 * repeat;
  if (column === 0) return (
    motion(state, 'pre-read', 1, 0.03, 0.19) +
    motion(state, 'pre-write', 1, 0.32, 0.46) +
    motion(state, 'pre-add', 1, 0.55, 0.68)
  );
  return (
    motion(state, 'post-write', 2, 0.02, 0.2) +
    motion(state, 'post-add', 2, 0.3, 0.42) +
    motion(state, 'post-normalize', 3, 0.22, 0.36)
  );
}
export function scaleProgress(progress, state = { beat: 0, beatP: progress }) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError('scale beat progress must be from 0 through 1');
  }
  return (
    motion(state, 'scale-squares', 0, 0.12, 0.31) +
    motion(state, 'scale-divide', 0, 0.68, 0.83)
  ) / 2;
}
export const scale = Math.sqrt(variance(point) + epsilon);
export const J = jac(point);
export const branch = J.map((r) => -scale * dotProduct(r, direction));
export function scaleTrace(progress) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError('scale progress must be from 0 through 1');
  }
  const squares = centered.map((value) => value ** 2);
  const termCount = Math.min(squares.length, Math.floor(progress * squares.length * 2));
  const squareSum = squares.slice(0, termCount).reduce((sum, value) => sum + value, 0);
  const currentVariance = termCount === squares.length ? squareSum / squares.length : null;
  const divisor = currentVariance === null ? null : Math.sqrt(currentVariance + epsilon);
  const applicationProgress =
    currentVariance === null ? 0 : Math.max(0, Math.min(1, (progress - 0.5) * 2));
  const appliedCount = Math.floor(applicationProgress * centered.length + 1e-9);
  const values = centered.map((value, index) => (index < appliedCount ? value / divisor : value));
  return {
    squares,
    termCount,
    squareSum,
    variance: currentVariance,
    divisor,
    applicationProgress,
    appliedCount,
    values,
  };
}
export function alignedWriteState(state) {
  const first = motion(state, 'first-write', 0, 0.42, 0.70);
  const six = 6 * motion(state, 'six-writes', 1, 0.02, 0.40);
  const eighth = motion(state, 'eighth-share', 2, 0.01, 0.13);
  const amounts = [first, ...Array.from({ length: 6 }, (_, i) => Math.max(0, Math.min(1, six - i))), eighth];
  const added = amounts.reduce((sum, amount) => sum + amount, 0),
    streamNorm = 1 + added;
  return {
    amounts,
    added,
    completed: amounts.filter((amount) => amount === 1).length,
    streamNorm,
    nextWriteShare: 1 / (streamNorm + 1),
  };
}
export function affineState(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0));
  const progress = (id, start, end) => {
    if (beat < 1) return 0;
    if (beat > 1) return 1;
    const cue = state.cues?.[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : Math.max(0, Math.min(1, (p - start) / (end - start)));
  };
  const gain = 1 + progress('affine-first-feature-gain-b2-1', 0.05, 0.2),
    bias = 0.7 * progress('affine-last-feature-bias-b2-2', 0.2, 0.4),
    gamma = [gain, 1, 1, 1],
    beta = [0, 0, 0, bias],
    values = normal.map((value, i) => value * gamma[i] + beta[i]);
  return {
    gain,
    bias,
    gamma,
    beta,
    values,
    mean: mean(values),
    variance: variance(values),
  };
}
export function backwardTrace(input = x, upstream = [1, 2, 0, -1], gain = [1, 1, 1, 1]) {
  const standardized = ln(input),
    u = upstream.map((v, i) => v * gain[i]),
    centered = u.map((v) => v - mean(u));
  const component = mean(u.map((v, i) => v * standardized[i]));
  const corrected = centered.map((v, i) => v - standardized[i] * component),
    divisor = Math.sqrt(variance(input) + epsilon);
  return {
    standardized,
    u,
    centered,
    component,
    corrected,
    divisor,
    dx: corrected.map((v) => v / divisor),
  };
}
export function deepNormTrace(layers = 16, input = start, branch = F(input)) {
  const alpha = (2 * layers) ** 0.25,
    beta = (8 * layers) ** -0.25,
    skip = input.map((v) => alpha * v),
    sum = skip.map((v, i) => v + branch[i]);
  return {
    layers,
    alpha,
    beta,
    skip,
    branch,
    sum,
    output: ln(sum),
    wrongOutput: ln(skip.map((v, i) => v + beta * branch[i])),
  };
}
export function normalizationTransfer(offset = 5) {
  const input = [2, 4, 6, 8],
    shifted = input.map((v) => v + offset);
  return {
    input,
    shifted,
    ln: ln(input),
    shiftedLN: ln(shifted),
    rms: rms(input),
    shiftedRMS: rms(shifted),
  };
}
export function validateModel() {
  const gradient = backwardTrace();
  assert.ok(Math.abs(gradient.dx.reduce((a, v) => a + v, 0)) < 1e-12);
  for (let i = 0; i < 4; i++) {
    const h = 1e-5,
      a = [...x],
      z = [...x];
    a[i] += h;
    z[i] -= h;
    const numeric = (dotProduct(ln(a), [1, 2, 0, -1]) - dotProduct(ln(z), [1, 2, 0, -1])) / (2 * h);
    assert.ok(Math.abs(numeric - gradient.dx[i]) < 1e-8);
  }
  const deep = deepNormTrace();
  assert.ok(Math.abs(deep.alpha - 32 ** 0.25) < 1e-12);
  assert.ok(Math.abs(deep.beta ** 2 - 1 / Math.sqrt(128)) < 1e-12);
  const transfer = normalizationTransfer();
  assert.deepEqual(transfer.ln, transfer.shiftedLN);
  assert.notDeepEqual(transfer.rms, transfer.shiftedRMS);
  assert.equal(dotProduct([1, 1, 1, 1], [1, 1, 1, 1]) / Math.sqrt(4), 2);
  assert.ok(1 / (1 + Math.exp(-4)) > 0.98);
  for (const [beat, beatP, added] of [[0, 0, 0], [0, 1, 1], [1, 1, 7], [2, 1, 8]]) {
    const row = alignedWriteState({ beat, beatP });
    assert.equal(row.added, added);
    assert.equal(row.streamNorm, 1 + added);
  }
  assert.equal(alignedWriteState({ beat: 1, beatP: 1 }).nextWriteShare, 1 / 9);
  assert.equal(placementTravel(0, 1, 0), 0);
  assert.equal(placementTravel(1, 1, 0), 3);
  assert.equal(placementTravel(2, 1, 1), 2);
  assert.equal(placementTravel(3, 1, 1), 3);
  assert.equal(placementTravel(4, 1, 1), 3);
  const oneBlock = placementTrace();
  assert.deepEqual(oneBlock.post[2].map(v => v.toFixed(1)), ['1.3', '2.5', '4.9', '9.7']);
  assert.equal(mean(oneBlock.post[2]).toFixed(1), '4.6');
  assert.equal(oneBlock.pre[3][0].toFixed(3), '0.895');
  assert.equal(oneBlock.post[3][0].toFixed(3), '-1.026');
  assert.deepEqual([transfer.input[0], transfer.shifted[0]], [2, 7]);
  assert.deepEqual([transfer.ln[0], transfer.shiftedLN[0]].map(v => v.toFixed(3)), ['-1.342', '-1.342']);
  assert.deepEqual([transfer.rms[0], transfer.shiftedRMS[0]].map(v => v.toFixed(3)), ['0.365', '0.683']);
  assert.equal(mean(x), 2);
  assert.equal(variance(x), 5);
  assert.ok(Math.abs(mean(normal)) < 1e-12);
  assert.ok(Math.abs(variance(normal) - 5 / 5.00001) < 1e-12);
  assert.ok(Math.abs(mean(pre2) - 3.95) < 1e-12);
  assert.ok(Math.abs(mean(post2)) < 1e-12);
  assert.ok(branch.every((v, i) => Math.abs(v + direction[i]) < 1e-12));
  assert.deepEqual(ln([10000, 10000, 10000, 10000]), [0, 0, 0, 0]);
  assert.ok(norm(ln([10000, 10001, 9999, 10002])) > 1.9);
  assert.equal(scaleTrace(0.1).termCount, 0);
  const partialSquares = scaleTrace(0.375);
  assert.deepEqual(partialSquares.squares.slice(0, partialSquares.termCount), [1, 1, 9]);
  assert.equal(partialSquares.squareSum, 11);
  assert.equal(partialSquares.variance, null);
  assert.equal(partialSquares.divisor, null);
  assert.deepEqual(partialSquares.values, centered);
  const measured = scaleTrace(0.5);
  assert.equal(measured.variance, 5);
  assert.equal(measured.divisor, Math.sqrt(5 + epsilon));
  assert.equal(measured.appliedCount, 0);
  assert.deepEqual(measured.values, centered);
  const halfApplied = scaleTrace(0.75);
  assert.equal(halfApplied.appliedCount, 2);
  assert.deepEqual(halfApplied.values, [
    centered[0] / measured.divisor,
    centered[1] / measured.divisor,
    centered[2],
    centered[3],
  ]);
  const complete = scaleTrace(1);
  assert.equal(complete.appliedCount, centered.length);
  assert.deepEqual(complete.values, normal);
  assert.ok(Math.abs(complete.divisor - Math.sqrt(variance(x) + epsilon)) < 1e-12);
  assert.equal(scaleTrace(scaleProgress(0.05)).termCount, 0);
  assert.equal(scaleTrace(scaleProgress(0.32)).variance, 5);
  assert.equal(scaleTrace(scaleProgress(0.67)).appliedCount, 0);
  assert.equal(scaleTrace(scaleProgress(0.76)).appliedCount, 2);
  assert.equal(scaleTrace(scaleProgress(0.84)).appliedCount, centered.length);
  assert.ok(Math.sqrt(variance([7, 7, 7, 7]) + epsilon) > 0);
  assert.throws(() => scaleProgress(-0.1), RangeError);
  assert.throws(() => scaleTrace(1.1), RangeError);
  return true;
}
