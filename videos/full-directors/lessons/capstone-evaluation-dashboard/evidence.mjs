import assert from 'node:assert/strict';
import {
  DASHBOARD_FIXTURES,
  drawIds,
  keys,
  plan,
  rowNames,
} from '../../../films/capstone-evaluation-dashboard/fixtures.mjs';
import {
  comparePackets,
  dashboardDigest,
  dashboardPairs,
  dashboardRows,
  gradeDashboardOutput,
  histogram,
  percentileBand,
  resamples,
  subsetAvailability,
  sum,
} from '../../../films/capstone-evaluation-dashboard/arithmetic.mjs';
import { fifthCase } from '../../../films/capstone-evaluation-dashboard/stages/fresh-attack.mjs';

export const fixtures = DASHBOARD_FIXTURES;
export { drawIds, keys, plan, rowNames, dashboardDigest, fifthCase };
export const base = dashboardRows('extractive-v1');
export const hybrid = dashboardRows('hybrid-v1');
export const repair = dashboardRows('hybrid-v2');
export const passCount = (rows) => rows.filter((row) => row.passed).length;
export const pct = (rate) => (100 * rate).toFixed(0) + '%';
export const decide = (rows, run) => comparePackets(base, rows, run);
export const note = hybrid[3];
export const missing = repair.slice(0, 3);
export const padded = [...missing, repair[0]];
export const stale = repair.map((r, i) => (i === 3 ? { ...r, passed: false } : r));
export const copied = hybrid.map((r, i) => {
  const f = fixtures[i];
  const output = {
    ...r,
    status: f.status,
    answer: f.answer,
    citations: f.citations,
    reason: 'Copied from reviewed fixture',
  };
  return { ...output, ...gradeDashboardOutput(output, f) };
});
export const rules = ['Identity verification is required.', 'Identity verification is optional.'];
export const accepted = 'Access may be restored after identity verification.';
export const extra = 'Restore access before identity verification.';
export const extended = extra + ' ' + accepted;
export const values = [0, false, 3.5, -2, Infinity];
export const latencySteps = (v) => [typeof v === 'number', Number.isFinite(v), v >= 0];
export const bits = (rows) => rows.map((r) => Number(r.passed));
export function distribution(rows) {
  const rates = resamples(bits(rows));
  return { bins: histogram(rates), band: percentileBand(rates), n: rates.length };
}
export const arriving = [0, 3, 2, 1].map((i) => hybrid[i]);
export function paired(rows, indices = [0, 1, 2, 3]) {
  const pairs = dashboardPairs(base, rows);
  return indices.map((i) => pairs.find((pair) => pair.id === base[i].id));
}
export const mean = (numbers) => sum(numbers) / numbers.length;
export const noRewording = [0, 2, 2, 3];
export const gainBand = percentileBand(resamples(bits(base), bits(repair)));
export const pool = [true, true, false, false, false];
function pairDraw(outcomes) {
  const size = 2;
  const counts = subsetAvailability(outcomes, size);
  const failures = outcomes.filter((passed) => !passed).length;
  const guaranteed = size > failures;
  const example = guaranteed ? counts.subsets[0] : counts.subsets.find((pair) => !pair.passed);
  return { ...counts, outcomes, size, failures, guaranteed, indices: example.indices };
}
export const pairs = pairDraw(pool);
export const two = [note, repair[3]];
export const both = pairDraw(two.map((r) => r.passed));
export const randomOne = subsetAvailability(
  two.map((r) => r.passed),
  1,
);
export const huge = 10n ** 17n;
export const cancelled = 1 - Number(huge - 1n) / Number(huge);
export const direct = 1 / Number(huge);
export const orders = [
  ['A', 'B'],
  ['B', 'A'],
];
export const winners = orders.map((order) => order[0]);
export const preference = new Set(winners).size > 1 ? 'Unresolved' : winners[0];
export function view(slice, passedOnly) {
  const rows = hybrid.filter((r) => (!slice || r.id === slice) && (!passedOnly || r.passed));
  return {
    rows,
    rate: rows.length ? passCount(rows) / rows.length : null,
    failure: hybrid.find((r) => !r.passed),
    verdict: decide(hybrid, 'hybrid-v1'),
  };
}
export const groups = [
  ['A', 'B', 'C', 'D'],
  ['C', 'D', 'E', 'F'],
];
export const distinct = [...new Set(groups.flat())];
export const owners = ['Policy', 'Retrieval', 'Support', 'Security + policy', 'Policy'];
export const routes = [
  { name: 'Access override', need: 1, got: 1 },
  { name: 'Incident freeze', need: 1, got: 0 },
  { name: 'Routine rotation', need: 0, got: 0 },
];
export function routing(rows) {
  const required = rows.filter((r) => r.need === 1);
  const caught = required.filter((r) => r.got === 1).length;
  return {
    required: required.length,
    caught,
    recall: required.length ? caught / required.length : null,
  };
}
export function check() {
  assert.deepEqual([base, hybrid, repair].map(bits), [
    [1, 0, 1, 1],
    [1, 1, 1, 0],
    [1, 1, 1, 1],
  ]);
  assert.deepEqual(base.map((r) => r.id), hybrid.map((r) => r.id));
  assert.deepEqual([base, hybrid].map(passCount), [3, 3]);
  assert.deepEqual(
    [base[1], hybrid[1], base[3], note].map((r) => [r.status, r.citations]),
    [
      ['abstain', []],
      ['grounded', ['access-policy-us-v3']],
      ['abstain', []],
      ['grounded', ['workspace-note-48291']],
    ],
  );
  assert.equal(fixtures[3].required, true);
  assert.equal(note.expectedStatus, 'abstain');
  assert.deepEqual(note.expectedCitations, []);
  assert.deepEqual(note.failures, ['status_mismatch', 'unexpected_citation', 'answer_mismatch']);
  assert.equal(extended.includes(accepted), true);
  assert.notEqual(extended, accepted);
  assert.deepEqual(
    values.map((v) => latencySteps(v).every(Boolean)),
    [true, false, true, false, false],
  );
  for (const invalid of [missing, padded, stale])
    assert.equal(decide(invalid, 'hybrid-v2'), 'HOLD COMPARISON');
  for (const patch of [
    { passed: 'true' },
    { answer: 'changed' },
    { corpus: 'different' },
    { reason: 0 },
    { latency: Infinity },
  ]) {
    assert.equal(
      decide([{ ...hybrid[0], ...patch }, ...hybrid.slice(1)], 'hybrid-v1'),
      'HOLD COMPARISON',
    );
  }
  assert.notEqual(dashboardDigest(rules[0]), dashboardDigest(rules[1]));
  assert.equal(decide(copied, 'hybrid-v1'), 'EXPAND OFFLINE EVAL');
  assert.equal(decide(hybrid, 'hybrid-v1'), 'HOLD CANDIDATE');
  assert.equal(decide(repair, 'hybrid-v2'), 'EXPAND OFFLINE EVAL');
  assert.deepEqual(
    drawIds.map((i) => base[i].id),
    [base[0].id, base[1].id, base[1].id, base[2].id],
  );
  assert.equal(passCount(drawIds.map((i) => base[i])), 2);
  assert.deepEqual(distribution(base), { bins: [1, 12, 54, 108, 81], band: [0.25, 1], n: 256 });
  assert.deepEqual(distribution(repair), { bins: [0, 0, 0, 0, 256], band: [1, 1], n: 256 });
  assert.deepEqual(bits(arriving), bits(base));
  assert.deepEqual(
    paired(arriving).map((p) => p.delta),
    [0, 1, 0, -1],
  );
  assert.deepEqual(paired(repair), paired([...repair].reverse()));
  assert.equal(mean(paired(repair, drawIds).map((p) => p.delta)), 0.5);
  assert.equal(mean(paired(repair, noRewording).map((p) => p.delta)), 0);
  assert.deepEqual(gainBand, [0, 0.75]);
  assert.equal(pairs.total, 10);
  assert.equal(pairs.rate, 0.7);
  assert.equal(both.rate, 1);
  assert.deepEqual([both.size, both.failures, both.guaranteed, both.indices], [2, 1, true, [0, 1]]);
  assert.deepEqual([pairs.size, pairs.failures, pairs.guaranteed, pairs.indices], [2, 3, false, [2, 3]]);
  const boundary = pairDraw([true, false, false]);
  assert.equal(boundary.guaranteed, false);
  assert.deepEqual(boundary.indices, [1, 2]);
  assert.equal(boundary.rate, 2 / 3);
  assert.equal(randomOne.rate, 0.5);
  assert.equal(two[0].passed, false);
  assert.equal(cancelled, 0);
  assert.equal(direct, 1e-17);
  assert.deepEqual(winners, ['A', 'B']);
  assert.equal(preference, 'Unresolved');
  assert.equal(view(base[1].id, false).rate, 1);
  assert.equal(view(note.id, true).rate, null);
  assert.equal(view(note.id, true).verdict, 'HOLD CANDIDATE');
  assert.deepEqual(
    plan.map(([, n, have]) => n - have),
    [29, 24, 19, 19, 15],
  );
  assert.equal(groups.flat().length, 8);
  assert.equal(distinct.length, 6);
  assert.equal(routing(routes).recall, 0.5);
  assert.equal(routing(routes.slice(-1)).recall, null);
  assert.equal(fifthCase(false).decision, 'HOLD COMPARISON');
  const complete = fifthCase(true);
  assert.equal(complete.row.answer, complete.row.expectedAnswer);
  assert.equal(complete.row.status, complete.row.expectedStatus);
  assert.deepEqual(complete.row.failures, ['unexpected_citation']);
  assert.equal(passCount(complete.candidate), 4);
  assert.equal(complete.decision, 'HOLD CANDIDATE');
  return true;
}
