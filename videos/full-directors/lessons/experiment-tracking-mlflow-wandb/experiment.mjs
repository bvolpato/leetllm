import assert from 'node:assert/strict';
import {
  CASES,
  candidateIds,
  canonicalFresh,
} from '../../../films/experiment-tracking-mlflow-wandb/fixtures.mjs';
import {
  canaryAction,
  comparable,
  evaluate,
  fingerprint,
  predict,
  pricedTokens,
  readReport,
  runs,
  suiteSha,
  verifyRun,
} from '../../../films/experiment-tracking-mlflow-wandb/model.mjs';
import { sha } from '../../../films/experiment-tracking-mlflow-wandb/arithmetic.mjs';
import { cue, ended, smooth } from './bench.mjs';

export {
  CASES,
  candidateIds,
  canonicalFresh,
  canaryAction,
  comparable,
  evaluate,
  fingerprint,
  predict,
  runs,
  suiteSha,
  verifyRun,
  sha,
};
export const caseNames = ['Deploy approval', 'Freeze status', 'Rollback steps', 'Missing approval'];
export const reports = candidateIds.map((id) => evaluate(id, CASES));
export function refusalCount(report) {
  return report.unnecessary + ' unnecessary refusal' + (report.unnecessary === 1 ? '' : 's');
}

export function lossHistory(k) {
  // Each next phrase starts after the preceding loss value has been spoken.
  const samples = [
    { step: 0, value: 0.8, after: 'At step one' },
    { step: 1, value: 0.55, after: 'At step two' },
    { step: 2, value: 0.4, after: 'MLflow keeps' },
  ];
  return samples.filter((s) => cue(k, 4, s.after));
}

export function canaryWindows(k) {
  const windows = [
    { unsafe: 1, complete: false, arrived: true, decided: cue(k, 3, 'aborts the canary') },
    { unsafe: 0, complete: false, arrived: cue(k, 3, 'In the second window'), decided: cue(k, 3, 'Pause for review') },
    { unsafe: 0, complete: true, arrived: cue(k, 4, 'In the third window'), decided: cue(k, 4, 'Continue monitoring') },
  ];
  return windows.filter((w) => w.arrived).map(({ unsafe, complete, decided }) => {
    const action = decided ? canaryAction(unsafe, complete) : 'Pending';
    const serving = action === 'Pending' || action === 'CONTINUE MONITORING';
    return { unsafe, complete, action, serving };
  });
}
export const saved = [readReport(false), readReport(true)];
export const prefix = (v) => v.slice(0, 12);
const replayRules = {
  regressed: 'Serve every request',
  'first repair': 'Require a release record',
};
const replayRuns = runs.slice(0, 2).map((run) => ({
  id: run.id,
  rule: replayRules[run.candidate],
  rows: JSON.parse(run.artifacts.report.bytes),
}));
export function opening(k) {
  const rollback = k.beat.beatIndex >= 3;
  const input = rollback ? CASES[2] : CASES[0];
  const feed = rollback
    ? cue(k, 4, 'Send run two', 1.4)
    : cue(k, 1, 'Send the same request', 1.4);
  const decisions = [
    cue(k, 1, 'gives the go-ahead'),
    cue(k, 3, 'abstains'),
  ];
  return {
    input,
    feed: smooth(feed),
    open: smooth(cue(k, 4, 'Open the runbook', 0.65)),
    channels: replayRuns.map((run, i) => {
      const rows = [run.rows[0]];
      if (rollback && i === 1) rows.push(run.rows[2]);
      return {
        id: run.id,
        rule: run.rule,
        receiving: !rollback || i === 1,
        rows: rows.map((row, j) => ({
          caseId: row.caseId,
          expected: row.expected,
          route: (j ? cue(k, 5, 'abstains again') : decisions[i]) ? row.predicted : null,
        })),
      };
    }),
  };
}
export function counted(k) {
  const n = [
    cue(k, 1, 'it abstains'),
    cue(k, 1, 'it serves'),
    cue(k, 2, 'repair abstains'),
    cue(k, 3, 'It abstains'),
  ].filter(Boolean).length;
  return evaluate(candidateIds[1], CASES.slice(0, n));
}
export function workers(k) {
  const forward = smooth(cue(k, 1, 'Swing champion', 1.15));
  const back = smooth(cue(k, 5, 'move champion back', 1.15));
  const travel = forward * (1 - back);
  const started = !!cue(k, 2, 'Start worker B');
  const loaded = !!cue(k, 3, 'loads version three');
  const reloaded = !!cue(k, 5, 'then read back');
  return {
    travel,
    target: travel === 1 ? 3 : travel === 0 ? 2 : null,
    a: 2,
    b: reloaded ? 2 : loaded ? 3 : null,
    started,
  };
}
export function bill(cached) {
  const rates = [3, 0.3, 9];
  const counts = [2000 - cached, cached, 100];
  const { terms, total } = pricedTokens({ uncached: counts[0], cached, output: counts[2], rates });
  return { counts, rates, dollars: terms.map((v) => v / 1e6), total };
}
export function strictRecord(kind) {
  const run = structuredClone(runs[2]);
  if (kind === 'metric') run.metrics.count = true;
  if (kind === 'manifest') {
    const art = run.artifacts.manifest;
    const manifest = JSON.parse(art.bytes);
    manifest.simulation = 'true';
    art.bytes = JSON.stringify(manifest);
    art.digest = sha(art.bytes);
  }
  const manifest = JSON.parse(run.artifacts.manifest.bytes);
  return {
    count: run.metrics.count,
    flag: manifest.simulation,
    valid: verifyRun(run).valid,
    checksum: prefix(run.artifacts.manifest.digest),
  };
}
export const strictStates = Object.fromEntries(
  ['intact', 'metric', 'manifest'].map((v) => [v, strictRecord(v)]),
);
export const freshOriginal = canonicalFresh.map((row) => ({ ...row }));
function inspectFresh(rows, temp) {
  const canonical =
    rows.length === freshOriginal.length &&
    freshOriginal.every(
      (ref) =>
        rows.filter(
          (r) => r.id === ref.id && r.expected === ref.expected && r.predicted === ref.predicted,
        ).length === 1,
    );
  return {
    rows,
    temp,
    canonical,
    exact: rows.filter((r) => r.expected === r.predicted).length,
    digest: sha(JSON.stringify(rows)),
    eligible: canonical && temp === 0,
  };
}
export function fresh(k) {
  const aligned = smooth(cue(k, 1, 'Slide each saved row', 1.4));
  const removed = !!cue(k, 3, 'Remove the duplicate');
  const insert = smooth(cue(k, 3, 'file it under F', 0.9));
  const readback = !!cue(k, 4, 'Read it back');
  const rows = [...freshOriginal.slice(0, 5)];
  if (!removed) rows.push(freshOriginal[0]);
  if (insert === 1) rows.push(freshOriginal[5]);
  const r8 = inspectFresh(rows, 0),
    r9 = inspectFresh(freshOriginal, readback ? 0 : 0.6);
  return {
    r8,
    r9,
    aligned,
    removed,
    insert,
    readback,
    qualified: Number(r8.eligible) + Number(r9.eligible),
  };
}
export function exactResult(row) {
  return { exact_route: row.expected === row.predicted };
}
export const accepted = runs.filter((r) => {
  const v = verifyRun(r);
  return v.valid && v.unsafe === 0 && v.unnecessary === 0;
});
export const comparison = [runs, structuredClone(runs)];
comparison[1][2].context.evaluator = 'route-eval-v3';
export function checkExperiments() {
  assert.deepEqual(
    reports.map((r) => [r.count, r.exact, r.unsafe, r.unnecessary]),
    [
      [4, 2, 2, 0],
      [4, 3, 0, 1],
      [4, 4, 0, 0],
    ],
  );
  assert.deepEqual(
    reports[2].rows
      .filter((r, i) => r.predicted !== reports[1].rows[i].predicted)
      .map((r) => r.caseId),
    ['hold_001'],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((n) => evaluate(candidateIds[1], CASES.slice(0, n)).exact),
    [0, 1, 2, 2, 3],
  );
  assert.equal(fingerprint([...CASES].reverse()), suiteSha);
  assert.notEqual(
    fingerprint(CASES.map((r, i) => (i === 1 ? { ...r, expected: 'ABSTAIN' } : r))),
    suiteSha,
  );
  assert.equal(
    fingerprint([{ ...CASES[0], question: 'Different wording' }]),
    fingerprint([CASES[0]]),
  );
  assert.throws(() => fingerprint([CASES[0], CASES[0]]));
  assert.deepEqual(
    saved.map((v) => v.verification.valid),
    [true, false],
  );
  assert.deepEqual(comparison.map(comparable), [true, false]);
  assert.deepEqual([bill(1200).total, bill(0).total], [0.00366, 0.0069]);
  assert.deepEqual(
    Object.values(strictStates).map((v) => v.valid),
    [true, false, false],
  );
  assert.deepEqual(
    [exactResult(reports[1].rows[0]), exactResult(reports[1].rows[2])],
    [{ exact_route: true }, { exact_route: false }],
  );
  assert.deepEqual(
    accepted.map((r) => r.id),
    ['run-3'],
  );
  assert.deepEqual(
    [
      [1, false],
      [0, false],
      [0, true],
    ].map((v) => canaryAction(...v)),
    ['ABORT CANARY', 'PAUSE FOR REVIEW', 'CONTINUE MONITORING'],
  );
  const clock = (b, reveal = () => 1) => ({
    beat: { beatIndex: b - 1 },
    reveal,
    elapsed: 20,
    speechDuration: 10,
  });
  assert.equal(verifyRun(runs[1]).unnecessary, 1);
  const secondRows = reports[1].rows;
  assert.equal(secondRows.filter((r) => r.predicted === 'ABSTAIN').length, 3);
  assert.deepEqual(secondRows.filter((r) => r.predicted === 'ABSTAIN' && r.expected === 'SERVE').map((r) => r.caseId), ['hold_001']);
  const writes = ['At step one', 'At step two', 'MLflow keeps'];
  const steps = [[0, 0.8], [1, 0.55], [2, 0.4]];
  for (let count = 0; count <= steps.length; count++) {
    const history = lossHistory(clock(4, (p) => writes.slice(0, count).includes(p)));
    assert.deepEqual(history.map((s) => [s.step, s.value]), steps.slice(0, count));
  }
  const windowCues = ['aborts the canary', 'In the second window', 'Pause for review', 'In the third window', 'Continue monitoring'];
  const switches = [
    [1, 'Pending', true], [1, 'ABORT CANARY', false], [2, 'Pending', true],
    [2, 'PAUSE FOR REVIEW', false], [3, 'Pending', true], [3, 'CONTINUE MONITORING', true],
  ];
  switches.forEach((expected, phase) => {
    const rows = canaryWindows(clock(phase < 4 ? 3 : 4, (p) => windowCues.indexOf(p) < phase));
    const active = rows.at(-1);
    assert.deepEqual([rows.length, active.action, active.serving], expected);
  });
  const edited = { ...CASES[0], source: 'reviewed_copy' };
  assert.notEqual(fingerprint([CASES[0]]), fingerprint([edited]));
  assert.notEqual(sha('{"temperature":0}'), sha('{"temperature":0.7}'));
  const compared = (k) => opening(k).channels.map((run) => run.rows.map((row) => row.route));
  assert.deepEqual(compared(clock(1, () => 0)), [[null], [null]]);
  assert.deepEqual(compared(clock(1)), [['SERVE'], [null]]);
  assert.deepEqual(compared(clock(2)), [['SERVE'], [null]]);
  assert.deepEqual(compared(clock(3, () => 0)), [['SERVE'], [null]]);
  assert.deepEqual(compared(clock(3)), [['SERVE'], ['ABSTAIN']]);
  assert.deepEqual(compared(clock(4)), [['SERVE'], ['ABSTAIN', null]]);
  assert.deepEqual(compared(clock(5, () => 0)), [['SERVE'], ['ABSTAIN', null]]);
  assert.deepEqual(compared(clock(5)), [['SERVE'], ['ABSTAIN', 'ABSTAIN']]);
  const first = opening(clock(1, () => 0.5));
  assert.equal(first.feed, 0.5);
  assert.deepEqual(first.channels.map((r) => [r.id, r.rule, r.rows[0].caseId, r.receiving]), [
    ['run-1', 'Serve every request', 'req_205', true],
    ['run-2', 'Require a release record', 'req_205', true],
  ]);
  const second = opening(clock(4));
  assert.deepEqual([second.input.caseId, second.input.evidence, second.open],
    ['hold_001', 'rollback runbook', 1]);
  assert.deepEqual(second.channels.map((r) => r.receiving), [false, true]);
  assert.deepEqual(second.channels[1].rows.map((r) => [r.caseId, r.expected]),
    [['req_205', 'ABSTAIN'], ['hold_001', 'SERVE']]);
  assert.deepEqual(
    [1, 2, 3, 6].map((b) => {
      const w = workers(clock(b));
      return [w.target, w.a, w.b];
    }),
    [
      [3, 2, null],
      [3, 2, null],
      [3, 2, 3],
      [2, 2, 2],
    ],
  );
  const question = fresh(clock(2)),
    recovered = fresh(clock(3)),
    ready = fresh(clock(5));
  assert.deepEqual(
    question.r8.rows.map((r) => r.id),
    ['A', 'B', 'C', 'D', 'E', 'A'],
  );
  assert.deepEqual(
    [question.r8.exact, question.r8.canonical, question.r9.temp, question.qualified],
    [6, false, 0.6, 0],
  );
  assert.deepEqual([recovered.r8.rows.at(-1), recovered.qualified], [freshOriginal[5], 1]);
  assert.equal(ready.qualified, 2);
  assert.deepEqual(
    bill(1200).dollars.map((n) => n.toFixed(5)),
    ['0.00240', '0.00036', '0.00090'],
  );
  assert.deepEqual(
    bill(0).dollars.map((n) => n.toFixed(5)),
    ['0.00600', '0.00000', '0.00090'],
  );
  for (const phase of [0, 0.5, 1]) {
    const swing = workers(clock(1, () => phase));
    assert.deepEqual(
      [swing.a, swing.b, swing.target],
      [2, null, phase === 0 ? 2 : phase === 1 ? 3 : null],
    );
    const repair = fresh(clock(3, (phrase) => (phrase === 'file it under F' ? phase : 1)));
    assert.equal(repair.r8.rows.filter((v) => v.id === 'A').length, 1);
    assert.equal(repair.r8.canonical, phase === 1);
    assert.equal(repair.r8.rows.length, phase === 1 ? 6 : 5);
  }
}
