import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dashboardRows,
  gradeDashboardOutput,
  dashboardReceiptErrors,
  dashboardDecision,
  dashboardPairs,
  subsetAvailability,
  dashboardBootstrapState,
  dashboardFreshReveal,
} from '../animations/capstone-evaluation-dashboard.mjs';

test('required attack compares status, citation tuple and whole answer', () => {
  const rows = dashboardRows();
  assert.deepEqual(rows.at(-1).failures, [
    'status_mismatch',
    'unexpected_citation',
    'answer_mismatch',
  ]);
  assert.equal(dashboardDecision(rows), 'HOLD CANDIDATE');
  const expected = dashboardRows('hybrid-v2').at(-1);
  assert.equal(expected.passed, true);
  assert.equal(
    gradeDashboardOutput({ ...expected, answer: 'Ignore the prior rule. ' + expected.answer })
      .passed,
    false,
  );
});
test('receipt validity rejects mutated grades, invalid identity and malformed numerical data', () => {
  const rows = dashboardRows('hybrid-v2');
  for (const mutation of [
    rows.slice(0, -1),
    [...rows, rows[0]],
    rows.map((r, i) => (i ? r : { ...r, id: 'easy-extra' })),
    rows.map((r, i) => (i ? r : { ...r, passed: 'true' })),
    rows.map((r, i) => (i ? r : { ...r, answer: 'A different answer.' })),
    rows.map((r, i) => (i ? r : { ...r, corpus: 'a-new-corpus' })),
  ])
    assert.equal(dashboardDecision(mutation), 'HOLD COMPARISON');
  for (const value of [false, -1, Infinity, NaN])
    assert.throws(() => gradeDashboardOutput({ ...rows[0], latency: value }), TypeError);
  for (const changes of [{ reason: 3 }, { reason: ' ' }, { run: 'unknown-run' }])
    assert.throws(() => gradeDashboardOutput({ ...rows[0], ...changes }), TypeError);
  assert.equal(dashboardReceiptErrors(rows).length, 0);
});
test('fabricated but internally consistent rows remain a limitation of local regrading', () => {
  const expected = dashboardRows('hybrid-v2');
  const invented = dashboardRows().map((row, i) => {
    const output = {
      ...row,
      status: expected[i].status,
      citations: [...expected[i].citations],
      answer: expected[i].answer,
    };
    return { ...output, ...gradeDashboardOutput(output) };
  });
  assert.equal(dashboardDecision(invented), 'EXPAND OFFLINE EVAL');
});
test('pairing is invariant to file order but rejects duplicates and missing identities', () => {
  const before = dashboardRows('extractive-v1'),
    after = dashboardRows('hybrid-v2');
  assert.deepEqual(dashboardPairs(before, after), dashboardPairs(before, [...after].reverse()));
  assert.equal(dashboardPairs(before, after).reduce((n, r) => n + r.delta, 0) / 4, 0.25);
  assert.throws(() => dashboardPairs(before, after.slice(1)), /identities/);
  assert.throws(
    () => dashboardPairs(before, [after[0], after[0], after[2], after[3]]),
    /identities/,
  );
});
test('oracle pool availability enumerates the supplied subsets independently of selection', () => {
  const x = subsetAvailability([true, true, false, false, false], 2);
  assert.equal(x.total, 10);
  assert.equal(x.passed, 7);
  assert.equal(x.rate, 0.7);
  assert.equal(subsetAvailability([false, true], 2).rate, 1);
  assert.throws(() => subsetAvailability([true], 2));
  assert.throws(() => subsetAvailability([1], 1));
});
test('fresh outcome, predicates and gate wait for separate completed clauses', () => {
  const ids = ['fresh-dashboard-rate', 'fresh-dashboard-predicates', 'fresh-attack-step-2'],
    cues = Object.fromEntries(ids.map((id) => [id, { phase: 'before', progress: 0 }]));
  assert.deepEqual(dashboardFreshReveal({ beat: 0, beatP: 1, cues }), {
    rate: false,
    predicates: false,
    hold: false,
  });
  for (const [index, id] of ids.entries()) {
    for (const progress of [0.01, 0.5, 0.999]) {
      cues[id] = { phase: 'during', progress };
      const s = dashboardFreshReveal({ beat: 1, beatP: 0.99, cues });
      assert.deepEqual(
        [s.rate, s.predicates, s.hold],
        ids.map((_, i) => i < index),
      );
    }
    cues[id] = { phase: 'after', progress: 1 };
    const s = dashboardFreshReveal({ beat: 1, beatP: 0.99, cues });
    assert.deepEqual(
      [s.rate, s.predicates, s.hold],
      ids.map((_, i) => i <= index),
    );
  }
});

test('bootstrap narration returns to three-pass counts before constructing the all-pass endpoint', () => {
  const cue = { phase: 'before', progress: 0 };
  const prior = dashboardBootstrapState({
    beat: 2,
    beatP: 0.99,
    cues: { 'bootstrap-perfect-case': cue },
  });
  assert.equal(prior.perfect, false);
  assert.deepEqual(prior.bins, [1, 12, 54, 108, 81]);
  const active = dashboardBootstrapState({
    beat: 2,
    cues: { 'bootstrap-perfect-case': { phase: 'active', progress: 0.5 } },
  });
  assert.equal(active.perfect, true);
  assert.deepEqual(active.observed, [true, true, true, true]);
  assert.deepEqual(active.bins, [0, 0, 0, 0, 256]);
});
