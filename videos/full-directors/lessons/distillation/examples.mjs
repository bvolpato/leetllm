import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
import { kl } from '../../../films/distillation/arithmetic.mjs';
import {
  studentTrace,
  projectionFixture,
  jointFixture,
  policySelection,
  releaseChecks,
} from '../../../films/distillation/model.mjs';
import {
  WORDS,
  TEACHER,
  INITIAL,
  POLICY_TEACHER,
  POLICY_STUDENT,
  POLICY_CASES,
  RELEASE_CANDIDATES,
  RELEASE_LIMITS,
} from '../../../films/distillation/fixtures.mjs';
export {
  kl,
  WORDS,
  TEACHER,
  INITIAL,
  POLICY_TEACHER,
  POLICY_STUDENT,
  POLICY_CASES,
  RELEASE_CANDIDATES,
  RELEASE_LIMITS,
  projectionFixture,
  policySelection,
  releaseChecks,
};
export const sm = (z, t = 1) => stableSoftmax(z, t);
export const sum = (a) => a.reduce((s, v) => s + v, 0);
export const target = sm(TEACHER),
  trace = studentTrace();
export const savedWord = target.indexOf(Math.max(...target));
export const hardTarget = target.map((_, i) => Number(i === savedWord));
const dogIndex = WORDS.indexOf('dog');
const catIndex = WORDS.indexOf('cat');
export function swapAlternatives(progress) {
  const probabilities = target.slice();
  const transfer = progress * (target[dogIndex] - target[catIndex]);
  probabilities[dogIndex] -= transfer;
  probabilities[catIndex] += transfer;
  return probabilities;
}
export const terms = target.map((v, i) => v * Math.log(v / trace[0].probs[i]));
export const binary = (t) => {
  const q = sm([2, 0], t)[0],
    p = sm([0, 2], t)[0];
  return { q, p, raw: (p - q) / t, scaled: t * (p - q) };
};
export const familyTeacher = [0.49, 0.02, 0.49],
  family = [
    [0.98, 0.01, 0.01],
    [0.25, 0.5, 0.25],
    [0.01, 0.01, 0.98],
  ];
export const familyScores = (reverse) =>
  family.map((p) => (reverse ? kl(p, familyTeacher) : kl(familyTeacher, p)));
export const joint = jointFixture();
export function chain(reverse = false, equal = false) {
  const [a, b, ac, bc] = reverse
    ? [joint.p0, joint.q0, joint.p1, joint.q1]
    : [joint.q0, joint.p0, joint.q1, joint.p1];
  const weights = equal ? [0.5, 0.5] : a,
    local = ac.map((row, i) => kl(row, bc[i]));
  const first = kl(a, b);
  return { weights, first, local, total: first + sum(local.map((x, i) => x * weights[i])) };
}
export const cache = [
  [0.45, 0.45, 0.1],
  [0.05, 0.05, 0.9],
];
export const retained = (row) => sum(row.slice(0, 2));
export const conditional = (row) => row.slice(0, 2).map((x) => x / retained(row));
export const headBytes = 10000 * 50000 * 2;
export const remap = (words, row, student) => student.map((w) => row[words.indexOf(w)]);
export const vocab = [
    ['bird', 'dog'],
    ['dog', 'bird'],
  ],
  masses = [0.8, 0.2];
export const batchLosses = [[0.2], [0.8, 0.8, 0.8]];
export const mean = (a) => sum(a) / a.length;
export const prefixWords = ['in', 'near', 'beside'],
  prefixRows = [
    [0.65, 0.2, 0.15],
    [0.1, 0.55, 0.35],
  ];
export const slices = [
  ['Familiar type', 94, 95],
  ['Fresh wording', 71, 91],
  ['New subject', 53, 86],
];
export const freshWords = ['gate', 'garden', 'tree'],
  freshTeacher = [0.2, 0.5, 0.3],
  freshBefore = sm([0, 0, 0]);
export const freshLogits = freshTeacher.map((q, i) => 0.6 * (q - freshBefore[i])),
  freshAfter = sm(freshLogits);
export const qualifies = (c) => Object.values(releaseChecks(c)).every(Boolean);
export function check() {
  const near = (a, b, t = 1e-9) => assert(Math.abs(a - b) < t, a + ' differs from ' + b);
  const vec = (a, b, t) => {
    assert.equal(a.length, b.length);
    a.forEach((v, i) => near(v, b[i], t));
  };
  vec(POLICY_STUDENT, POLICY_TEACHER);
  near(kl(POLICY_TEACHER, POLICY_STUDENT), 0);
  vec(POLICY_TEACHER, [0.9, 0.1]);
  assert.equal(POLICY_CASES[1].rule, 'not allowed');
  near(sum(terms), trace[0].loss);
  assert.equal(WORDS[savedWord], 'bird');
  vec(hardTarget, [1, 0, 0, 0]);
  assert.deepEqual(WORDS.toSorted((a, b) => target[WORDS.indexOf(b)] - target[WORDS.indexOf(a)]),
    ['bird', 'dog', 'cat', 'tree']);
  const original = swapAlternatives(0);
  const halfway = swapAlternatives(0.5);
  const swapped = swapAlternatives(1);
  vec(original, target);
  near(halfway[dogIndex], halfway[catIndex]);
  vec(swapped, [target[0], target[2], target[1], target[3]]);
  for (const probabilities of [original, halfway, swapped]) {
    near(sum(probabilities), 1);
    assert.equal(probabilities.indexOf(Math.max(...probabilities)), savedWord);
  }
  const excess = trace[0].probs.map((p, i) => p - target[i]);
  assert.equal(WORDS[excess.indexOf(Math.max(...excess))], 'cat');
  assert(terms[0] > 0 && terms[2] < 0);
  for (const [step, row] of trace.entries()) {
    vec(sm(row.logits), row.probs);
    near(sum(row.probs), 1);
    near(kl(target, row.probs), row.loss);
    if (step) {
      assert(row.loss < trace[step - 1].loss);
      vec(
        row.logits,
        trace[step - 1].logits.map((z, i) => z + 0.8 * (target[i] - trace[step - 1].probs[i])),
      );
    }
  }
  assert(trace[4].probs[0] > trace[4].probs[2]);
  assert(trace[6].probs[2] > trace[6].probs[1]);
  assert(trace[7].probs[2] < trace[7].probs[1]);
  near(trace[12].probs[2] - target[2], 0.0117565, 0.0001);
  for (const t of [1, 4, 40]) {
    const r = binary(t);
    near(r.scaled, r.raw * t * t);
    near(sum(sm(TEACHER, t)), 1);
  }
  near(binary(40).scaled, -1, 0.001);
  assert.deepEqual(remap(vocab[0], masses, vocab[1]), [0.2, 0.8]);
  near(mean(batchLosses.flat()), 0.65);
  near(mean(batchLosses.map(mean)), 0.5);
  for (const u of [0, 0.5, 1]) {
    const f = projectionFixture(u);
    vec(f.output, [1, 2 + u, 3 - u]);
    near(f.sse, 2 * (1 - u) ** 2);
  }
  const f = projectionFixture(1, true);
  vec(f.output, [2, 1.8, 2.2]);
  near(f.sse, 1.48);
  near(kl([1, 0], [0.5, 0.5]), Math.log(2));
  assert.equal(kl([0.5, 0.5], [1, 0]), Infinity);
  const fw = familyScores(false),
    rv = familyScores(true);
  near(fw[1], Math.min(...fw));
  near(rv[0], Math.min(...rv));
  near(rv[2], rv[0]);
  vec(joint.q, [0.72, 0.08, 0.04, 0.16]);
  vec(joint.p, [0.25, 0.25, 0.2, 0.3]);
  for (const [reverse, paths] of [[false, joint.q], [true, joint.p]]) {
    const { weights, local } = chain(reverse);
    vec(weights, [paths[0] + paths[1], paths[2] + paths[3]]);
    const other = reverse ? joint.q : joint.p;
    const afterB = (row) => row.slice(2).map((v) => v / (row[2] + row[3]));
    near(local[1], kl(afterB(paths), afterB(other)));
  }
  vec(chain(false, true).weights, [0.5, 0.5]);
  vec(chain(false, true).local, chain().local);
  near(chain().total, joint.forward);
  near(chain(true).total, joint.reverse);
  near(chain(false, true).total, 0.422535, 0.000001);
  vec(cache.map(retained), [0.9, 0.1]);
  vec(conditional(cache[0]), conditional(cache[1]));
  vec(conditional(cache[0]), [0.5, 0.5]);
  near(kl(...cache.map(conditional)), 0);
  near(kl(...cache), 0.8 * Math.log(9));
  assert.equal(headBytes, 1e9);
  assert.deepEqual(
    policySelection().map((r) => r.outcome),
    ['keep', 'skip', 'reject'],
  );
  assert.deepEqual(
    slices.map(([, p, q]) => q - p),
    [1, 20, 33],
  );
  vec(freshLogits, [-0.08, 0.1, -0.02]);
  vec(freshAfter, [0.307, 0.367, 0.326], 0.002);
  assert.equal(freshWords[freshAfter.indexOf(Math.max(...freshAfter))], 'garden');
  assert.deepEqual(RELEASE_CANDIDATES.map(qualifies), [false, true]);
  assert(!qualifies({ ...RELEASE_CANDIDATES[1], latency: 70 }));
  assert(!qualifies({ ...RELEASE_CANDIDATES[1], accuracy: 0.89 }));
}
