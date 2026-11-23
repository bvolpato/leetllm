import assert from 'node:assert/strict';
import { A2, A4, B2, B4, BASE_OUTPUT, CLAMP_CASES, FULL, SAMPLE_FIXTURE, SAMPLE_LOGPROBS, X } from '../../../films/deep-dive-tinker/fixtures.mjs';

export const test = SAMPLE_FIXTURE;
const bounded = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const reversed = (x, lo, hi) => Math.max(Math.min(x, lo), hi);
const identity = x => x;
export const candidates = [
  { code: 'min(max(x, lo), hi)', evaluate: bounded },
  { code: 'max(min(x, lo), hi)', evaluate: reversed },
  { code: 'min(max(x, lo), hi)', evaluate: bounded },
  { code: 'x', evaluate: identity },
];
export const cases = CLAMP_CASES;
export function grade(fn) {
  const values = cases.map(([x, lo, hi]) => fn(x, lo, hi));
  const passed = values.map((v, i) => v === cases[i][3]);
  return { values, passed, reward: Number(passed.every(Boolean)) };
}
export function center(rewards) {
  const mean = rewards.reduce((sum, v) => sum + v, 0) / rewards.length;
  return { rewards, mean, advantages: rewards.map(r => r - mean) };
}
export const grades = candidates.map(c => grade(c.evaluate));
export const group = center(grades.map(g => g.reward));
export const tied = center([1, 1, 1, 1]);

// The two possible first tokens have fixed continuations in this local decoder.
const probability = ({ min, x }) => 1 / (1 + Math.exp(x - min));
const first = { min: 0, x: 0 };
const error = 1 - probability(first);
const updated = { min: first.min + error, x: first.x - error };
export const loss = [first, updated].map(w => -Math.log(probability(w)));
export const trainer = { version: 2, weights: updated };
const snapshots = new Map([['adapter-v1', first], ['adapter-v2', trainer.weights]]);
function client(path) {
  const frozen = { ...snapshots.get(path) };
  return { path, sample(draw, fixture) {
    const branch = draw < probability(frozen) ? candidates[0] : candidates[3];
    const { x, lo, hi, expected } = fixture;
    const value = branch.evaluate(x, lo, hi);
    return { path, body: 'return ' + branch.code, value, passed: value === expected };
  } };
}
export const commonDraw = 43.5 / 64;
export const minProbabilities = [first, updated].map(probability);
export const oldClient = client('adapter-v1');
export const freshClient = client('adapter-v2');
export const oldSample = oldClient.sample(commonDraw, test);
export const freshSample = freshClient.sample(commonDraw, test);
export const alternateDraw = 0.8;
export const alternateSamples = [oldClient, freshClient].map(c => c.sample(alternateDraw, test));
export const clampInner = Math.max(test.x, test.lo);

export function shift(full, promptLength) {
  const targets = full.slice(1);
  const mask = targets.map((_, i) => Number(i + 1 >= promptLength));
  const sum = mask.reduce((a, b) => a + b, 0);
  return { full, promptLength, inputs: full.slice(0, -1), targets, mask, mean: mask.map(w => sum ? w / sum : 0) };
}
export const sft = shift(FULL, 2);
export const practice = shift([30, 31, 32, 40, 41, 42], 3);
export const receipt = sft.targets.slice(1).map((token, i) => ({ token, score: SAMPLE_LOGPROBS[i + 1] }));
export const actions = sft.targets.map((token, i) => ({
  token, mask: sft.mask[i], score: sft.mask[i] ? receipt[i - 1].score : 0,
  credit: group.advantages[0] * sft.mask[i],
}));
export const badCredits = actions.map(() => group.advantages[0]);
export function rewardPayload(credits) {
  return actions.map(({ token, score, mask }, i) => ({ token, score, credit: credits[i] * mask }));
}
// Score the same action in the same prefix with each proposed sampler receipt.
const scoredAction = rewardPayload(badCredits)[1];
const currentLogP = -0.4;
export const importance = receipt.map(saved => ({
  action: scoredAction.token, advantage: scoredAction.credit, prefix: sft.inputs.slice(0, 2),
  currentLogP, saved, ratio: Math.exp(currentLogP - saved.score),
}));
export const slopes = [-2, 0.5];
export const backendWeights = slopes.map(v => -v);
const mv = (m, v) => m.map(row => row.reduce((sum, a, i) => sum + a * v[i], 0));
export function layer(rank) {
  const A = rank === 2 ? A2 : A4;
  const B = rank === 2 ? B2 : B4;
  const narrow = mv(A, X);
  const expanded = mv(B, narrow);
  const scale = 0.5;
  const count = A.flat().length + B.flat().length;
  return { input: X, base: BASE_OUTPUT, A, B, rank, narrow, expanded, scale, count,
    output: BASE_OUTPUT.map((v, i) => v + scale * expanded[i]) };
}
export function chunk(datums, limit) {
  const chunks = [];
  for (let i = 0; i < datums.length; i += limit) chunks.push({ id: chunks.length, members: datums.slice(i, i + limit) });
  return chunks;
}
export const datums = ['a', 'b', 'c', 'd', 'e'];
export const requests = chunk(datums, 2);
export const queue = [{ name: 'Forward / backward', cycle: 0 }, { name: 'Optimizer step', cycle: 2 }];
export const paired = queue.map(r => ({ ...r, cycle: 0 }));
export function lag(trainerStep, sampleStep, maxLag) {
  const gap = trainerStep - sampleStep;
  return { trainerStep, sampleStep, maxLag, gap, admit: gap >= 0 && gap <= maxLag };
}
export const groups = [9, 11, 12].map(step => lag(12, step, 1));
export const samplesAB = [6, 9].map(step => lag(9, step, 1));
export const capability = { model: 'M', inference: true, training: false };
export const artifacts = [
  { file: 'train/step-2', content: 'adapter + moments', consumer: 'Resume with optimizer' },
  { file: freshClient.path, content: 'sampler weights', consumer: 'Open sampling client' },
  { file: 'merged HF/', content: 'base + adapter', consumer: 'Validate in runtime' },
];
export function check() {
  assert.deepEqual(oldClient.sample(commonDraw, test), oldSample);
  assert.deepEqual([oldSample.path, oldSample.value, oldSample.passed], ['adapter-v1', 3, false]);
  assert.deepEqual([freshSample.path, freshSample.value, freshSample.passed], ['adapter-v2', 2, true]);
  assert(loss[1] < loss[0]);
  assert(minProbabilities[0] < commonDraw && commonDraw < minProbabilities[1]);
  assert.deepEqual(minProbabilities.map(p => Math.round(p * 100)), [50, 73]);
  assert.equal(commonDraw.toFixed(2), '0.68');
  assert.deepEqual([oldSample.body, freshSample.body], ['return x', 'return min(max(x, lo), hi)']);
  assert(alternateDraw > Math.max(...minProbabilities) && alternateDraw < 1);
  assert.deepEqual(alternateSamples, [oldSample, { ...oldSample, path: freshClient.path }]);
  assert.equal(Math.min(clampInner, test.hi), freshSample.value);
  assert.deepEqual(grades.map(g => g.values[0]), [0, 2, 0, -1]);
  assert.deepEqual(group.rewards, [1, 0, 1, 0]);
  assert.deepEqual(group.advantages, [0.5, -0.5, 0.5, -0.5]);
  assert.deepEqual(tied.advantages, [0, 0, 0, 0]);
  assert.deepEqual(sft.inputs, [10, 11, 20]);
  assert.deepEqual(sft.targets, [11, 20, 21]);
  assert.deepEqual(sft.mean, [0, 0.5, 0.5]);
  assert.deepEqual(rewardPayload(badCredits), [
    { token: 11, score: 0, credit: 0 }, { token: 20, score: -0.4, credit: 0.5 }, { token: 21, score: -0.8, credit: 0.5 },
  ]);
  assert.deepEqual(importance.map(v => [v.prefix, v.action, v.advantage, v.currentLogP, v.saved.token, v.saved.score]), [
    [[10, 11], 20, 0.5, -0.4, 20, -0.4], [[10, 11], 20, 0.5, -0.4, 21, -0.8],
  ]);
  assert.equal(importance[0].ratio, 1);
  assert.equal(importance[1].ratio.toFixed(2), '1.49');
  assert.equal(Math.round((importance[1].ratio / importance[0].ratio - 1) * 100), 49);
  assert.deepEqual(backendWeights.map(w => -w), slopes);
  assert.deepEqual([layer(2).count, layer(4).count], [20, 40]);
  assert.deepEqual(layer(2).narrow, [0, 2]);
  assert.equal(layer(2).output[1], 3);
  assert.equal(layer(4).output[1], 3);
  assert.deepEqual(requests.map(r => [r.id, r.members.length]), [[0, 2], [1, 2], [2, 1]]);
  assert.deepEqual(queue.map(r => r.cycle), [0, 2]);
  assert.deepEqual(paired.map(r => r.cycle), [0, 0]);
  assert.deepEqual(groups.map(g => g.admit), [false, true, true]);
  assert.deepEqual(practice.mean, [0, 0, 1 / 3, 1 / 3, 1 / 3]);
  assert.deepEqual(samplesAB.map(g => g.gap), [3, 0]);
  assert.equal(artifacts[1].file, freshSample.path);
  return true;
}
