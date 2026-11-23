import assert from 'node:assert/strict';
import {
  z,
  vectors,
  records,
  FOUR_CHOICE_POLICY,
} from '../../../films/decision-models-jev-kev/fixtures.mjs';
import {
  softmax,
  confidence,
  probabilityCutoff,
} from '../../../films/decision-models-jev-kev/arithmetic.mjs';

export { z, vectors, records, softmax, confidence, probabilityCutoff };
export const policy = FOUR_CHOICE_POLICY;
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const weights = z.map((v) => Math.exp(v));
export const baseShares = softmax(z);
export const target = [0, 1, 0];
export const gradient = baseShares.map((p, i) => p - target[i]);
export const transferShares = [0.1, 0.5, 0.4];
export const transferGradient = transferShares[2] - 1;
export function update(progress) {
  const scores = z.map((v, i) => v - 0.5 * progress * gradient[i]);
  const shares = softmax(scores);
  return { scores, shares, loss: -Math.log(shares[1]) };
}
export const decisionVector = [1, 0];
export const dots = vectors.map((key) => sum(key.map((x, i) => x * decisionVector[i])));
export const pointer = dots.map((v) => v / Math.sqrt(decisionVector.length));
export function scaled(t) {
  return { t, logits: pointer.map((v) => v / t), shares: softmax(pointer, t) };
}
export const optionOrder = [2, 0, 1];
export function answerSet(drop) {
  const ids = drop ? [0, 1] : [0, 1, 2];
  const total = sum(ids.map((i) => weights[i]));
  return { ids, total, shares: ids.map((i) => weights[i] / total) };
}
export function isolation(added) {
  // These are expected scores for an isolation test in a fixed-score miniature.
  const first = z.slice(),
    replay = z.slice();
  const maxError = Math.max(...first.map((v, i) => Math.abs(v - replay[i])));
  return {
    first,
    replay,
    maxError,
    secondChoices: added ? ['Yes', 'No', 'Unknown'] : ['Yes', 'No'],
  };
}
export function gate(field, cutoff = 0.8) {
  const accepts = records.map((r) => (field === 'confidence' ? confidence(r.p, 3) : r.p) >= cutoff);
  const count = accepts.filter(Boolean).length;
  const errors = records.filter((r, i) => accepts[i] && !r.correct).length;
  return {
    accepts,
    count,
    errors,
    coverage: count / records.length,
    risk: count ? errors / count : null,
    pCutoff: field === 'confidence' ? probabilityCutoff(cutoff, 3) : cutoff,
  };
}
export const replayLog = ['Image pull succeeded', 'Tests started', 'Assertion failed'];
export const assertion = { expected: 12, actual: 11 };
export const fiveChoices = { count: 5, p: 0.72, cutoff: 0.65 };
export const trials = [0.7, 0.76];
export function route(p, choice = 'A', authenticated = true) {
  const k = policy.legalChoices.length;
  const valid = policy.legalChoices.includes(choice) && Number.isFinite(p) && p >= 1 / k && p <= 1;
  const score = valid ? confidence(p, k) : null;
  const pass = authenticated && valid && p >= probabilityCutoff(policy.cutoff, k);
  return {
    choice,
    p,
    k,
    score,
    pass,
    route: pass ? 'Test investigation' : 'Human review',
    log: replayLog,
  };
}
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, a + ' differs from ' + b);
export function verify() {
  const expected = [0.6652409557748218, 0.24472847105479764, 0.09003057317038046];
  baseShares.forEach((v, i) => near(v, expected[i]));
  for (const t of [0, 0.5, 1]) {
    const u = update(t);
    u.scores.forEach((v, i) => near(v, z[i] - 0.5 * t * (expected[i] - target[i])));
    u.shares.forEach((v, i) =>
      near(v, Math.exp(u.scores[i]) / sum(u.scores.map((x) => Math.exp(x)))),
    );
    near(u.loss, -Math.log(u.shares[1]));
    assert.equal(u.shares.indexOf(Math.max(...u.shares)), 0);
  }
  near(update(0).loss, 1.4076059644443804);
  near(sum(transferShares), 1);
  near(transferGradient, -0.6);
  assert.deepEqual(
    update(1).shares.map((x) => x.toFixed(3)),
    ['0.518', '0.388', '0.094'],
  );
  assert.deepEqual(dots, [0, 2, 0.5]);
  assert.deepEqual(
    pointer.map((x) => x.toFixed(3)),
    ['0.000', '1.414', '0.354'],
  );
  for (const t of [1, 1.5, 2]) {
    const s = scaled(t);
    s.logits.forEach((v, i) => near(v, pointer[i] / t));
    near(sum(s.shares), 1);
    assert.equal(s.shares.indexOf(Math.max(...s.shares)), 1);
  }
  assert.deepEqual(
    scaled(2).shares.map((x) => x.toFixed(3)),
    ['0.237', '0.480', '0.283'],
  );
  assert.equal(optionOrder.indexOf(1), 2);
  assert.equal(optionOrder[1], 0);
  near(answerSet(false).total - answerSet(true).total, 1);
  for (const drop of [false, true]) {
    const s = answerSet(drop);
    near(sum(s.shares), 1);
    s.ids.forEach((i, j) => near(s.shares[j], weights[i] / s.total));
  }
  near(answerSet(true).shares[1], 0.2689414213699951);
  assert.deepEqual(isolation(false).first, isolation(true).replay);
  assert.deepEqual(isolation(true).secondChoices, ['Yes', 'No', 'Unknown']);
  const p = gate('probability'),
    c = gate('confidence');
  assert.deepEqual(p.accepts, [true, true, true, true, false, false, false, false]);
  assert.deepEqual(c.accepts, [true, true, true, false, false, false, false, false]);
  near(c.pCutoff, 13 / 15);
  assert.deepEqual(
    records.filter((_, i) => p.accepts[i] && !c.accepts[i]),
    [{ p: 0.86, correct: true }],
  );
  assert.deepEqual(
    records.filter((record, i) => c.accepts[i] && !record.correct),
    [{ p: 0.9, correct: false }],
  );
  near(confidence(0.8, 3), 0.7);
  near(confidence(0.68, 5), 0.6);
  near(confidence(fiveChoices.p, fiveChoices.count), fiveChoices.cutoff);
  assert.equal(fiveChoices.p, probabilityCutoff(fiveChoices.cutoff, fiveChoices.count));
  assert.equal(confidence(1, 1), 1);
  for (const [r, n] of [
    [p, 4],
    [c, 3],
  ]) {
    assert.equal(r.errors, 1);
    assert.equal(r.count, n);
    near(r.coverage, n / 8);
    near(r.risk, 1 / n);
  }
  assert.equal(gate('probability', 1).risk, null);
  const [a, b] = trials.map((p) => route(p));
  assert.notEqual(assertion.actual, assertion.expected);
  assert.equal(a.log, b.log);
  assert.equal(a.choice, b.choice);
  near(a.score, 0.6);
  near(b.score, 0.68);
  assert.equal(a.route, 'Human review');
  assert.equal(b.route, 'Test investigation');
  assert(route(probabilityCutoff(policy.cutoff, 4)).pass);
  assert(!route(0.76, 'E').pass && !route(0.76, 'A', false).pass);
  return true;
}
