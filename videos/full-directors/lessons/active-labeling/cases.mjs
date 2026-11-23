import assert from 'node:assert/strict';
import { hash, euclidean } from '../../../films/active-labeling/arithmetic.mjs';
import {
  baseRow,
  reviewMatrix,
  pool,
  selectionItems,
  provenance,
  candidates,
  draftRows,
  cleanedRows,
} from '../../../films/active-labeling/fixtures.mjs';
import {
  auditRelease,
  binaryMeasures,
  cohenKappa,
  fleissFixture,
  hybridSteps,
  judgePair,
  overlapFindings,
  preferenceFixture,
  reviewJudgeOrder,
  releaseSummaryGate,
} from '../../../films/active-labeling/model.mjs';
export {
  hash,
  reviewMatrix,
  pool,
  selectionItems,
  provenance,
  candidates,
  draftRows,
  cleanedRows,
  binaryMeasures,
  cohenKappa,
  judgePair,
  overlapFindings,
  releaseSummaryGate,
};
export const firstCases = [
  {
    name: 'Missing approver',
    p: pool[1].probability,
    a: 'Wait for the owner.',
    b: 'Ask an authorized delegate.',
    human: 'B',
  },
  {
    name: 'Password reset',
    p: pool[3].probability,
    a: 'Use the recovery link.',
    b: 'Contact support.',
    human: null,
  },
];
export const closest = firstCases.toSorted(
  (a, b) => binaryMeasures(b.p).entropy - binaryMeasures(a.p).entropy,
)[0];
export const rankedAnswers = ['A', 'B', 'C', 'D'];
export const comparisons = rankedAnswers.flatMap((a, i) =>
  rankedAnswers.slice(i + 1).map((b) => [a, b]),
);
export const pref = preferenceFixture();
export const preferenceChance = (a, b) => 1 / (1 + Math.exp(b - a));
export function localMask(fields) {
  const ids = new Map();
  return fields.map((value) => {
    if (/<(?:EMAIL|OWNER|COMMIT)_\d+>/.test(value)) throw Error('Reserved token');
    if (!ids.has(value)) ids.set(value, '<EMAIL_' + (ids.size + 1) + '>');
    return ids.get(value);
  });
}
export const addresses = ['alex@example.org', 'alex@example.org'];
export const tokens = localMask(addresses);
export const alternateTokens = localMask(['sam@example.org']);
export const ratings = ['A', 'B', 'Tie'];
export function ballots(n) {
  const m = reviewMatrix.map((r) => [...r]);
  if (n < 120) m[0][1]--;
  if (n < 119) m[0][0]--;
  const stats = cohenKappa(m);
  const sums = m.map((row) => row.reduce((a, b) => a + b, 0));
  const cols = m[0].map((_, j) => m.reduce((s, row) => s + row[j], 0));
  return { m, ...stats, sums, cols, diag: stats.total - stats.disagreements };
}
export const unbalanced = cohenKappa([
  [82, 10],
  [6, 2],
]);
export const single = cohenKappa([
  [100, 0],
  [0, 0],
]);
export const fleiss = fleissFixture();
export const separate = [
  [50, 40],
  [0, 10],
];
export const steps = hybridSteps();
export const shortNames = ['Canary 1', 'Canary 2', 'Canary 3', 'Handoff', 'Injection', 'Keyboard'];
export const nameOf = (item) => shortNames[selectionItems.indexOf(item)];
export const byUncertainty = selectionItems.toSorted((a, b) => b.uncertainty - a.uncertainty);
export function links(selected) {
  const rows = selectionItems
    .filter((item) => !selected.includes(item))
    .map((item) => {
      const neighbors = selected
        .map((to) => ({ to, d: euclidean(item.xy, to.xy) }))
        .sort((a, b) => a.d - b.d);
      return { item, ...(neighbors[0] || { to: null, d: 0 }) };
    });
  const longest = Math.max(0, ...rows.map((row) => row.d));
  return rows.map((row) => {
    const u = 0.6 * row.item.uncertainty;
    const v = longest ? (0.4 * row.d) / longest : 0;
    return { ...row, u, v, score: u + v };
  });
}
export const ruler = [
  { name: 'Seed', x: 0 },
  { name: 'Appeal', x: 1, u: 0.95 },
  { name: 'Handoff', x: 5, u: 0.2 },
];
export const rulerScore = (item) => 0.6 * item.u + (0.4 * item.x) / 5;
export const radius = (set) =>
  Math.max(...ruler.map((item) => Math.min(...set.map((to) => Math.abs(item.x - to.x)))));
export const clusterMean = ruler.reduce((sum, item) => sum + item.x, 0) / ruler.length;
export const medoidCandidates = ruler.map((record) => {
  const distances = ruler.map((other) => Math.abs(record.x - other.x));
  return { record, distances, total: distances.reduce((sum, d) => sum + d, 0) };
});
export const medoid = medoidCandidates.reduce((best, row) => row.total < best.total ? row : best);
export const trial = {
  start: 61,
  count: 400,
  runs: [
    { name: 'Random', end: 64 },
    { name: 'Hybrid', end: 68 },
  ],
};
export const auditTicket = firstCases[1];
export const auditInclusion = 1 / 5;
export const auditWeight = 1 / auditInclusion;
export const cost = (end) => trial.count / (end - trial.start);
export const judge = reviewJudgeOrder();
export const normalize = (s) => s.normalize('NFC').trim().toLowerCase().replace(/\s+/gu, ' ');
export const copies = [
  'Who can approve the canary?',
  '  WHO   can approve the CANARY?',
  'Which reviewer can sign off?',
];
export const fingerprints = copies.map((s) => hash(normalize(s)).slice(0, 10));
export const oldAudit = auditRelease(draftRows);
export const rebuiltAudit = auditRelease(cleanedRows);
export const waitingAudit = auditRelease(cleanedRows, false, oldAudit.digest);
export const absentAudit = auditRelease(cleanedRows, false);
export const freshFrozen = {
  id: 'incident-seven',
  family: 'incident-seven',
  parents: [],
  text: 'Frozen incident.',
};
export const freshRows = [
  baseRow('fresh-permitted', 'Request canary approval.'),
  baseRow('ticket-nine', 'Copied incident evidence.', freshFrozen.id, [freshFrozen.id]),
  baseRow('ticket-nine-copy', 'Derived incident evidence.', freshFrozen.id, ['ticket-nine']),
];
export const cleanFresh = freshRows.filter((row) => row.family !== freshFrozen.family);
export const oldId = hash(freshRows).slice(0, 10),
  newId = hash(cleanFresh).slice(0, 10);
export const checkpoint = { trainedOn: oldId, families: [...new Set(freshRows.map((r) => r.family))] };
export const finalMatrix = [
  [32, 8],
  [8, 32],
];
export const freshStats = cohenKappa(finalMatrix);
export const freshLog = { changed: 1, approved: 2, family: 'canary-new' };
export const threshold = 0.65;
export function checkCases() {
  assert.equal(closest, firstCases[0]);
  assert.equal(closest.human, 'B');
  assert.deepEqual(
    comparisons.map((p) => p.join('')),
    ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'],
  );
  assert.equal(preferenceChance(2, 0), preferenceChance(7, 5));
  assert.equal(preferenceChance(2, 0).toFixed(3), '0.881');
  assert.equal(pref.loss.toFixed(3), '0.405');
  assert.equal(pref.probability, 2 / 3);
  assert.deepEqual(tokens, ['<EMAIL_1>', '<EMAIL_1>']);
  assert.deepEqual(alternateTokens, ['<EMAIL_1>']);
  assert.throws(() => localMask(['<EMAIL_1>']));
  assert.equal(judgePair(candidates.A, candidates.B), 'CHOOSE A');
  assert.equal(judgePair(candidates.C, candidates.D), 'BOTH BAD');
  assert.equal(judgePair({ ...candidates.A, correct: false }, candidates.D), 'REWRITE');
  assert.equal(judgePair({ ...candidates.A, evidence: false }, candidates.B), 'ADJUDICATE');
  assert.equal(judgePair(candidates.A, { ...candidates.A, id: 'E' }), 'TIE');
  assert.deepEqual(
    [118, 119, 120].map((n) => [ballots(n).m[0][0], ballots(n).m[0][1], ballots(n).total]),
    [
      [41, 2, 118],
      [42, 2, 119],
      [42, 3, 120],
    ],
  );
  assert.deepEqual(ballots(120).sums, [46, 44, 30]);
  assert.deepEqual(ballots(120).cols, [48, 42, 30]);
  assert.equal(ballots(120).kappa.toFixed(3), '0.835');
  assert.equal(unbalanced.expected.toFixed(4), '0.8192');
  assert.equal(single.kappa, null);
  assert.equal(fleiss.kappa.toFixed(3), '0.489');
  assert.deepEqual(
    pool
      .toSorted((a, b) => b.uncertainty - a.uncertainty)
      .slice(0, 2)
      .map((v) => v.probability),
    [0.49, 0.53],
  );
  assert.deepEqual(steps.at(-1).selected.map(nameOf), ['Canary 1', 'Handoff', 'Injection', 'Keyboard']);
  for (let i = 1; i <= 4; i++) {
    const selected = steps[i - 1].selected,
      remaining = links(selected);
    assert.equal(remaining.length, 6 - i);
    for (const r of remaining) {
      assert(selected.includes(r.to));
      assert.equal(r.d, Math.min(...selected.map((s) => euclidean(r.item.xy, s.xy))));
    }
    if (i < 4) {
      const next = remaining.toSorted((a, b) => b.score - a.score)[0];
      assert.equal(next.item, steps[i].chosen.item);
      assert.equal(next.score.toFixed(3), steps[i].chosen.score.toFixed(3));
    }
  }
  assert.equal(steps[1].chosen.score.toFixed(3), '0.796');
  assert.equal(steps[2].chosen.score.toFixed(3), '0.798');
  const injection = steps[2].chosen.item;
  const beforeHandoff = links(steps[0].selected);
  const afterHandoff = links(steps[1].selected);
  const before = beforeHandoff.find(({ item }) => item === injection);
  const after = afterHandoff.find(({ item }) => item === injection);
  assert.equal(before.score.toFixed(3), '0.791');
  assert.equal((steps[1].chosen.score - before.score).toFixed(3), '0.005');
  assert.deepEqual([before.to, before.d, before.u], [after.to, after.d, after.u]);
  assert.deepEqual([before.v.toFixed(3), after.v.toFixed(3)], ['0.365', '0.372']);
  for (const [rows, name, length] of [
    [beforeHandoff, 'Handoff', '6.36'],
    [afterHandoff, 'Keyboard', '6.24'],
  ]) {
    const longest = Math.max(...rows.map(({ d }) => d));
    assert.deepEqual([nameOf(rows.find(({ d }) => d === longest).item), longest.toFixed(2)], [name, length]);
  }
  assert(links(steps.at(-1).selected).every(({ d }) => d < 1));
  assert.deepEqual(
    ruler.slice(1).map((i) => rulerScore(i).toFixed(2)),
    ['0.65', '0.52'],
  );
  assert.deepEqual(
    [1, 2].map((i) => radius([ruler[0], ruler[i]])),
    [4, 1],
  );
  assert.equal(clusterMean, 2);
  assert.deepEqual(
    medoidCandidates.map(({ record, distances, total }) => [record.x, distances, total]),
    [[0, [0, 1, 5], 6], [1, [1, 0, 4], 5], [5, [5, 4, 0], 9]],
  );
  assert.equal(medoid.record, ruler[1]);
  assert.equal(auditTicket.name, 'Password reset');
  assert.equal(auditWeight, 5);
  assert.deepEqual(
    trial.runs.map((r) => cost(r.end).toFixed(1)),
    ['133.3', '57.1'],
  );
  assert.deepEqual(
    judge.flips.map((r) => r.id),
    ['citation', 'unsafe action'],
  );
  assert.equal(fingerprints[0], fingerprints[1]);
  assert.notEqual(fingerprints[1], fingerprints[2]);
  assert.deepEqual(
    [oldAudit.open, waitingAudit.open, rebuiltAudit.open, absentAudit.open],
    [false, false, true, false],
  );
  assert.equal(freshRows[2].parents[0], freshRows[1].id);
  assert.equal(freshRows[1].parents[0], freshFrozen.id);
  assert.deepEqual(
    cleanFresh.map((r) => r.id),
    ['fresh-permitted'],
  );
  assert.notEqual(oldId, newId);
  assert.equal(freshStats.kappa.toFixed(2), '0.60');
  assert.equal(freshStats.disagreements, 16);
  const gate = {
    redaction: true,
    completed: true,
    findings: overlapFindings(freshRows, [freshFrozen]),
    kappa: freshStats.kappa,
    threshold,
    unsafe: 0,
    unresolved: 0,
  };
  assert.equal(gate.findings.length, 2);
  assert(!releaseSummaryGate({ ...gate, findings: [] }));
  assert(!releaseSummaryGate({ ...gate, kappa: 0.8 }));
  assert.equal(checkpoint.trainedOn, oldId);
  assert(checkpoint.families.includes(freshFrozen.family));
  assert(!checkpoint.families.includes(freshLog.family));
  assert.equal(freshLog.approved - freshLog.changed, 1);
}
