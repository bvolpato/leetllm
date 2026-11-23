import assert from 'node:assert/strict';
import {
  NEXT,
  OPENING,
  POLICY_LOGITS,
  POLICY_TOKENS,
  OUTCOME_CANDIDATES,
} from '../../../films/beam-search/fixtures.mjs';
import {
  beamSearch,
  WIDTH_TWO,
  WIDTH_THREE,
  rawWinner,
  normalizedWinner,
  stablePolicy,
  retainedPolicy,
  widerBeamTrace,
  speculativeMass,
  enumByteTrace,
  thoughtTraversal,
} from '../../../films/beam-search/arithmetic.mjs';
import { conditionalEdgeExperiment, freshPolicyFrame, greedyPolicyFrame } from '../../../films/beam-search/construction.mjs';
import { sum } from './studio.mjs';

export {
  NEXT,
  OPENING,
  POLICY_LOGITS,
  POLICY_TOKENS,
  OUTCOME_CANDIDATES,
  WIDTH_TWO,
  WIDTH_THREE,
  rawWinner,
  normalizedWinner,
  stablePolicy,
  retainedPolicy,
  enumByteTrace,
  thoughtTraversal,
  conditionalEdgeExperiment,
};
export const base = stablePolicy(),
  peaked = [0.568, 0.345, 0.077, 0.01],
  flat = [0.28, 0.25, 0.24, 0.23];
export const widths = [beamSearch(1), WIDTH_TWO, WIDTH_THREE],
  counts = widths.map((run) => sum(run.history.map((step) => step.expansions.length)));
export const wider = [widerBeamTrace(2), widerBeamTrace(3)];
export const paths = [rawWinner(WIDTH_THREE), rawWinner(WIDTH_TWO)];
export const twoTokens = [
  ['create', 0.4, '.', 0.2],
  ['first', 0.35, 'create', 0.7],
  ['revoke', 0.25],
];
export const greedyFirst = greedyPolicyFrame({ beat: 0, beatP: 0 });
export const greedyLast = greedyPolicyFrame({ beat: 1, beatP: 1 });
// Path probabilities on arrival, followed by one final choice of door or window.
export const hallArrivals = [
  { via: 'foyer', probability: 0.3 },
  { via: 'stairs', probability: 0.2 },
];
export const hallExits = ['door', 'window'];
export const hallRow = [0.8, 0.2];
export const hallKept = hallArrivals.reduce((best, route) => route.probability > best.probability ? route : best);
export const hallPrefixes = hallArrivals.map((route, i) => ({
  ...route,
  next: i === 0 ? hallRow : [0.3, 0.7],
}));
export const enumToken = 'create"}';
export const limitPrefix = enumByteTrace(enumToken, 0);
export const boundaryRow = [0.5, 0.25, 0.25, 0];
export function expansionLabel(candidate, position, horizon) {
  if (candidate.completed) return 'finished';
  if (position >= horizon) return 'unfinished at limit';
  return candidate.status === 'active' ? 'carry' : 'cut';
}
export const penalize = (z, theta) => (z > 0 ? z / theta : z * theta);
export const sample = (row, u) => row.findIndex((_, i) => u < sum(row.slice(0, i + 1)));
export const retained = (row, rule, p) => retainedPolicy(row, rule, p);
export const survivors = (row, filter) => row.map((v, i) => (filter.indices.includes(i) ? v : 0));
export const filterOrder = [0.6, 0.25, 0.15];
// The printed worksheet specifies decimal thousandths as exact inputs.
export const printedFirstThree = sum(peaked.slice(0, 3).map((p) => Math.round(1000 * p))) / 1000;
export const exactFirstThree = sum(base.probabilities.slice(0, 3));
export const correction = speculativeMass([0.6, 0.3, 0.1], [0.8, 0.1, 0.1]);
export const orderGuide = ['backup', 'rotate', 'remove'],
  freshNames = [...orderGuide, 'quota'];
export const orderAnswer = [orderGuide[0], orderGuide[2], orderGuide[1]];
export const fresh = freshPolicyFrame({ beat: 0, beatP: 0 }).probabilities;
export const nucleus = retained(fresh, 'p', 0.75);
export const backupOnly = nucleus.probabilities.map((p, i) => (i === 0 && p > 0 ? 1 : 0));
export const exampleSteps = [
  [0.95, 0.92, 0.98],
  [0.05, 0.9, 0.92],
];
export function stepScores(regraded) {
  return [exampleSteps[0], regraded ? [0.99, ...exampleSteps[1].slice(1)] : exampleSteps[1]];
}
export const tailRisk = (n) => 1 - 0.998 ** n;
export const replay = [
  0.3238327648, 0.1508491739, 0.650934473, 0.0724362867, 0.5358820043, 0.3656889169, 0.0579989248,
  0.5074357332,
];
export function visits(child, parent) {
  const n = 10 + Number(parent),
    ns = [8, 2 + Number(child)],
    rewards = [3.2, 1.2 + (child ? 0.2 : 0)];
  return {
    n,
    total: 4.4 + (parent ? 0.2 : 0),
    nodes: ns.map((nChild, i) => ({
      n: nChild,
      total: rewards[i],
      mean: rewards[i] / nChild,
      ucb: rewards[i] / nChild + Math.sqrt(Math.log(n) / nChild),
    })),
  };
}
export const valid = [0.4, 0.6],
  future = [0.1, 0.9],
  validMass = valid.map((p, i) => p * future[i]),
  conditioned = validMass.map((p) => p / sum(validMass));
export const accept = (p, q, u) => u < Math.min(1, p / q);
export const block = [
  { word: 'create', p: 0.6, q: 0.8, u: 0.2 },
  { word: 'a', p: 0.4, q: 0.8, u: 0.8 },
  { word: 'key' },
];
export const audit = [
  [92, 70, 10],
  [85, 80, 5],
];
export function checkExamples() {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, a + ' ≠ ' + b);
  for (const t of [0.5, 1, 2]) near(sum(stablePolicy(POLICY_LOGITS, t).probabilities), 1);
  assert.equal(POLICY_TOKENS[sample(base.probabilities, 0.75)], 'revoke');
  assert.equal(POLICY_TOKENS[POLICY_LOGITS.indexOf(Math.max(...POLICY_LOGITS))], 'create');
  assert.deepEqual(base.shifted, [0, -0.5, -2, -4]);
  assert.equal(stablePolicy([0, -1000]).logProbabilities[1], -1000);
  assert.throws(() => stablePolicy([-Infinity, -Infinity]));
  near(sum(twoTokens.map(([, p]) => p)), 1);
  near(twoTokens[0][1] * twoTokens[0][3], 0.08);
  near(twoTokens[1][1] * twoTokens[1][3], 0.245);
  assert.deepEqual(counts, [11, 18, 25]);
  assert.deepEqual(greedyLast.prefix, ['create', '.']);
  assert.equal(greedyFirst.labels[greedyFirst.logits.indexOf(Math.max(...greedyFirst.logits))], 'create');
  assert.equal(greedyLast.labels[greedyLast.logits.indexOf(Math.max(...greedyLast.logits))], 'period');
  assert.equal(hallKept.via, 'foyer');
  hallPrefixes.forEach(route => near(sum(route.next), 1));
  hallRow.forEach(p => {
    assert.ok(hallKept.probability * p > hallArrivals[1].probability * p);
  });
  near(hallKept.probability * hallRow[0], 0.24);
  near(hallArrivals[1].probability * hallRow[0], 0.16);
  near(hallPrefixes[0].probability * hallPrefixes[0].next[1], 0.06);
  near(hallPrefixes[1].probability * hallPrefixes[1].next[1], 0.14);
  const statuses = (step) => step.expansions.map(e => [e.token, expansionLabel(e, step.step, WIDTH_TWO.horizon)]);
  assert.deepEqual(statuses(WIDTH_TWO.history[2]), [
    ['door', 'carry'], ['window', 'cut'], ['EOS', 'finished'], ['again', 'carry'], ['EOS', 'finished'],
  ]);
  assert.deepEqual(statuses(WIDTH_TWO.history[3]), [
    ['EOS', 'finished'], ['again', 'unfinished at limit'], ['EOS', 'finished'], ['quietly', 'unfinished at limit'],
  ]);
  assert.deepEqual(
    WIDTH_TWO.history[1].expansions.filter((x) => x.completed).map((x) => x.parent),
    ['opened', 'looked'],
  );
  near(paths[0].probability, 0.19);
  near(paths[1].probability, 0.153);
  assert.equal(normalizedWinner(WIDTH_THREE).text, 'opened the door');
  near(wider[0].winner.probability, 0.09);
  near(wider[1].winner.probability, 0.04);
  near(penalize(3, 1.2), 2.5);
  near(penalize(-1, 1.2), -1.2);
  near(penalize(0, 1.2), 0);
  assert.deepEqual(
    replay.map((u) => sample(base.probabilities, u)),
    [0, 0, 1, 0, 0, 0, 0, 0],
  );
  near(retained(peaked, 'k', 2).mass, 0.913);
  near(retained(flat, 'k', 2).mass, 0.53);
  assert.deepEqual(retained(flat, 'p', 0.9).indices, [0, 1, 2, 3]);
  assert.deepEqual(retained(peaked, 'min-p', 0.1).indices, [0, 1, 2]);
  assert.deepEqual(retained(boundaryRow, 'min-p', 0.5).indices, [0, 1, 2]);
  assert.deepEqual(retained(boundaryRow, 'p', 1).indices, [0, 1, 2]);
  assert.deepEqual(retained(boundaryRow, 'min-p', 1).indices, [0]);
  assert.ok(exactFirstThree < 0.99);
  assert.equal(printedFirstThree, 0.99);
  const k = retained(filterOrder, 'k', 2),
    p = retained(filterOrder, 'p', 0.7);
  near(k.probabilities[0], 0.6 / 0.85);
  assert.deepEqual(retained(k.probabilities, 'p', 0.7).indices, [0]);
  assert.deepEqual(retained(p.probabilities, 'k', 2).indices, [0, 1]);
  near(sum(validMass), 0.58);
  near(conditioned[0], 0.04 / 0.58);
  assert.equal(limitPrefix.current, '{"first_step":"');
  assert.equal(limitPrefix.scanned.length, 0);
  assert.equal(limitPrefix.eosAllowed, false);
  assert.equal(enumByteTrace(enumToken, enumToken.length - 1).eosAllowed, false);
  assert.ok(enumByteTrace(enumToken).eosAllowed);
  assert.ok(enumByteTrace('quota"}').rejected);
  assert.equal(OUTCOME_CANDIDATES.reduce((a, b) => (a.score > b.score ? a : b)).id, 'A');
  near(Math.min(...stepScores(true)[1]), 0.9);
  near(visits(true, true).nodes[1].mean, 1.4 / 3);
  near(visits(true, true).total, 4.6);
  correction.restored.forEach((p, i) => near(p, correction.target[i]));
  assert.deepEqual(correction.correction, [0, 1, 0]);
  assert.deepEqual(
    block.slice(0, 2).map((x) => accept(x.p, x.q, x.u)),
    [true, false],
  );
  near(tailRisk(500), 1 - 0.998 ** 500);
  assert.ok(audit[1][1] > audit[0][1] && audit[1][0] < audit[0][0]);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const model = conditionalEdgeExperiment(t);
    const next = model.run.history[1].expansions.filter((x) => x.parent === 'opened');
    model.choices.forEach(([name, p], i) => {
      assert.equal(next[i].token, name);
      near(next[i].probability, 0.45 * p);
    });
  }
  const changed = conditionalEdgeExperiment(1);
  assert.deepEqual(changed.frontier, ['opened a', 'looked outside']);
  near(changed.raw.probability, 0.1701);
  assert.equal(changed.normalized.text, 'opened a book');
  assert.equal(freshNames[sample(nucleus.probabilities, 0.65)], 'rotate');
  assert.equal(freshNames[sample(backupOnly, 0.65)], 'backup');
  assert.equal(
    orderAnswer.findIndex((w, i) => w !== orderGuide[i]),
    1,
  );
}
