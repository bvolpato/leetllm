import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  ledger,
  openingRuns,
  summary,
  reportedMeans,
  reportedInterval,
  controlStep,
} from '../../../films/capstone-reproducible-research-study/evidence.mjs';
import {
  seedRows,
  RS_FIRST_INDICES,
  RS_Q18,
  RS_TAPES,
  RS_ARTIFACT_HASHES,
} from '../../../films/capstone-reproducible-research-study/fixtures.mjs';
import {
  potential,
  shaping,
  quantile,
} from '../../../films/capstone-reproducible-research-study/arithmetic.mjs';
import { cue, mix, ease, beat } from './drawing.mjs';
export {
  ledger,
  openingRuns,
  summary,
  reportedInterval,
  controlStep,
  seedRows,
  RS_FIRST_INDICES,
  RS_Q18,
  RS_TAPES,
  RS_ARTIFACT_HASHES,
  potential,
  shaping,
  quantile,
};
export const mean = (values) => values.reduce((s, n) => s + n, 0) / values.length;
export const positive = ledger.filter((r) => r.gain > 0),
  negative = ledger.filter((r) => r.gain < 0);
export const firstSample = RS_FIRST_INDICES.map((i) => ledger[i]),
  practice = [6, 6, 14, 0].map((i) => ledger[i]);
export const result = summary(ledger);
export const sorted = [...reportedMeans].sort((a, b) => a - b);
export const endpointRanks = [0.05, 0.95].map((probability, i) => {
  const gaps = sorted.length - 1;
  const position = probability * gaps;
  const indices = [Math.floor(position), Math.ceil(position)];
  return {
    probability,
    gaps,
    position,
    indices,
    neighbors: indices.map((index) => sorted[index]),
    endpoint: reportedInterval[i],
  };
});
// This comparison uses the independent-arm interval in the companion article's study_results.json.
export const independentInterval = [0.04861111111111116, 0.2361111111111111];
export const histogram = Array.from({ length: 48 }, (_, i) => ({ lo: -12 + i, n: 0 }));
for (const v of reportedMeans) {
  const k = Math.floor(v * 100) + 12;
  if (k >= 0 && k < histogram.length) histogram[k].n++;
}
export const policy = RS_Q18.slice(0, 6).map((r) => r.indexOf(Math.max(...r)));
export const rates = Object.freeze([
  100 * seedRows[18].final_sparse,
  100 * seedRows[18].final_shaped,
]);
export const transitionMeans = ['steps_sparse', 'steps_shaped'].map((key) =>
  mean(seedRows.map((r) => r[key])),
);
export const talk = [45, 60, 75, 90, 105, 60, 45, 120];
export function move(s, dir, u) {
  return Math.min(6, Math.max(0, s + (u < 0.15 ? -dir : dir)));
}
export function update({ old = 0, reward, next, alpha = 0.35, gamma = 0.95, terminal = false }) {
  const target = reward + (terminal ? 0 : gamma * next);
  return { target, updated: old + alpha * (target - old) };
}
export function qSlip(alpha, next) {
  return update({ reward: shaping(1, 0), next, alpha });
}
export function opening(k) {
  const arrival = ease(cue(k, 0, 'Seed fourteen', 0.9)),
    finish = ease(cue(k, 1, 'Play the last move', 1));
  return {
    pos: openingRuns.map((path) => mix(mix(path[10], path[11], arrival), path[12], finish)),
    arrival,
    finish,
    settled: finish === 1,
  };
}
export function tapeState(k) {
  const used = [6, 12],
    first = [cue(k, 0, 'purple uses', 0.85), cue(k, 0, 'orange uses', 1.1)];
  const continuous = cue(k, 0, 'Purple points', 0.65);
  const jump = cue(k, 1, 'Advance both readers', 1.25),
    fourth = cue(k, 2, 'fourth move', 1.1);
  return {
    used: used.map((n, i) => Math.round(n * first[i])),
    continuous,
    jump,
    fourth,
    pointers: used.map((n) => [ease(jump), mix(n - 1, 0, ease(jump)) + 3 * ease(fourth)]),
  };
}
export function controlState(k) {
  const slipped = !!cue(k, 2, 'let that same right action slip left'),
    repaired = !!cue(k, 4, 'Write to the intended action');
  const res = controlStep(slipped, !repaired),
    b = beat(k);
  const creditSparse = (b === 1 && cue(k, 1, 'both tables put')) || b >= 3;
  const creditZero =
    (b === 1 && cue(k, 1, 'both tables put')) || cue(k, 3, 'Our faulty candidate credits left');
  const rows = [creditSparse ? res.sparse : [0, 0], creditZero ? res.zero : [0, 0]];
  return {
    slipped,
    repaired,
    rows,
    settled: !!(creditSparse && creditZero),
    successor: res.successor,
    match: rows[0].every((n, i) => n === rows[1][i]),
  };
}
export function verdict({ early, final }) {
  return {
    early: early.mean >= 10 && early.low > 0,
    finite: final.mean >= -2 && final.mean <= 2 && final.low >= -2 && final.high <= 2,
    strong: early.low > 10,
  };
}
export function worksheet(changed) {
  const early = { mean: 13, low: 4, high: 22 };
  const final = { mean: 0.5, low: changed ? -3 : -0.5, high: 1.5 };
  return { early, final, ...{ rules: verdict({ early, final }) }, rates: [42, 42.5] };
}
export const bytes = [
  '{"seed":0,"success":0.5}',
  JSON.stringify({ seed: 0, success: 0.5 }, null, 2),
];
export const hash = (s) => createHash('sha256').update(s).digest('hex');
export const anti = [0, 0.25, 0.5, 0.75, 1].map((x) => [x, 1 - x]);
export const pairDifferences = anti.map(([baseline, candidate]) => candidate - baseline);
export const meanDifference = mean(pairDifferences);
const covariance = (x, y) =>
  x.reduce((s, v, i) => s + (v - mean(x)) * (y[i] - mean(y)), 0) / (x.length - 1);
export const earlyCovariance = covariance(
  seedRows.map((r) => r.early_sparse),
  seedRows.map((r) => r.early_shaped),
);
const xs = anti.map((r) => r[0]),
  ys = anti.map((r) => r[1]);
export const cov = covariance(xs, ys),
  ind = (covariance(xs, xs) + covariance(ys, ys)) / xs.length,
  paired = ind - (2 * cov) / xs.length;
export function restore(k) {
  const a = cue(k, 1, 'Its nine lost goals'),
    all = cue(k, 1, 'Put back the other four');
  const selected = ledger.filter((r) => r.gain >= 0 || (r.seed === 6 && a) || all);
  return { selected, ...summary(selected), answer: !!cue(k, 2, 'gives fourteen point three') };
}
export function checkStudy() {
  assert.deepEqual(
    openingRuns.map((r) => r.slice(11)),
    [
      [2, 1],
      [5, 6],
    ],
  );
  assert.deepEqual(
    negative.map((r) => r.seed),
    [6, 11, 17, 19, 23],
  );
  assert.equal(summary(positive).gain, 136);
  assert.equal(summary(practice).gain, 5);
  assert.equal(result.gain, 103);
  assert.equal(result.episodesPerArm, 720);
  assert.equal(sorted.length, 10000);
  assert.equal(
    histogram.reduce((n, b) => n + b.n, 0),
    10000,
  );
  assert.equal(summary(firstSample).gain, 113);
  assert.deepEqual(
    reportedInterval.map((n) => (100 * n).toFixed(1)),
    ['6.1', '22.5'],
  );
  assert.deepEqual(endpointRanks.map(({ indices }) => indices), [[499, 500], [9499, 9500]]);
  for (const { neighbors, endpoint } of endpointRanks) {
    assert.deepEqual(neighbors, [endpoint, endpoint]);
  }
  assert.deepEqual([move(2, -1, RS_TAPES.slip[1][3]), move(2, 1, RS_TAPES.slip[1][3])], [3, 1]);
  assert.equal(qSlip(0.35, 0).updated.toFixed(5), '-0.04083');
  assert.equal(qSlip(0.35, 0.4).updated.toFixed(5), '0.09217');
  assert.equal(
    update({ reward: 1, terminal: true, old: 0.2, alpha: 0.25, next: 0.6 }).updated,
    0.4,
  );
  assert.deepEqual(
    [controlStep(false, true).match, controlStep(true, true).match, controlStep(true, false).match],
    [true, false, true],
  );
  assert.deepEqual([cov, ind, paired], [-0.15625, 0.0625, 0.125]);
  assert.deepEqual(pairDifferences, [1, 0.5, 0, -0.5, -1]);
  assert.equal(meanDifference, 0);
  assert.equal(paired, covariance(pairDifferences, pairDifferences) / anti.length);
  assert.deepEqual(policy, [0, 1, 1, 1, 1, 1]);
  assert.equal(transitionMeans[0], 773.25);
  assert.equal(transitionMeans[1].toFixed(1), '754.7');
  assert.deepEqual(rates, [45.5, 45.5]);
  assert(seedRows.every((r) => r.final_sparse === r.final_shaped));
  assert.deepEqual(worksheet(false).rules, { early: true, finite: true, strong: false });
  assert(!worksheet(true).rules.finite);
  assert.deepEqual(JSON.parse(bytes[0]), JSON.parse(bytes[1]));
  assert.notEqual(hash(bytes[0]), hash(bytes[1]));
  assert.equal(
    talk.slice(0, 7).reduce((a, b) => a + b),
    480,
  );
  assert.equal(talk.at(-1), 120);
}
