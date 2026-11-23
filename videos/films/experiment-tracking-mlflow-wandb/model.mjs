import { clamp, sha } from './arithmetic.mjs';
import { CASES, candidateIds, canonicalFresh, ids } from './fixtures.mjs';
import { clause, motion } from './construction.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          beat: 0,
        },
      },
      cues: [0, 1].map((beat) => ({
        id: id + '-' + beat,
        beat,
        at: 0,
        snapshot: {
          beat,
        },
      })),
    }),
  ]),
);
export function predict(candidate, row) {
  assert(candidateIds.includes(candidate));
  if (candidate === 'regressed') return 'SERVE';
  return (candidate === 'first repair'
    ? ['release record']
    : ['release record', 'rollback runbook']
  ).includes(row.evidence)
    ? 'SERVE'
    : 'ABSTAIN';
}
export function fingerprint(rows) {
  assert(rows.length > 0);
  assert.equal(new Set(rows.map((r) => r.caseId)).size, rows.length);
  return sha(
    JSON.stringify(
      [...rows]
        .sort((a, b) => a.caseId.localeCompare(b.caseId))
        .map((r) => ({
          case_id: r.caseId,
          evidence_state: r.evidence.replaceAll(' ', '_'),
          expected_route: r.expected,
          slice_name: r.slice,
          source: r.source,
        })),
    ),
  );
}
export function evaluate(candidate, cases) {
  const rows = cases.map((row) => ({
    ...row,
    predicted: predict(candidate, row),
  }));
  return scoreReport(rows);
}
function scoreReport(rows) {
  const unsafe = rows.filter((r) => r.predicted === 'SERVE' && r.expected === 'ABSTAIN').length,
    unnecessary = rows.filter((r) => r.predicted === 'ABSTAIN' && r.expected === 'SERVE').length,
    exact = rows.filter((r) => r.predicted === r.expected).length;
  return {
    rows,
    count: rows.length,
    unsafe,
    unnecessary,
    exact,
    rate: rows.length ? exact / rows.length : null,
  };
}
export const codeBytes = predict.toString();
export const knownGoodBytes = JSON.stringify({
  release: 'deploy-answerer-v1',
  kind: 'supplied stable teaching reference',
});
export const suiteSha = fingerprint(CASES);
export const context = {
  suite: suiteSha,
  evaluator: 'route-eval-v2',
  policy: 'deploy-grounding-slo-v1',
  evidence: 'deploy-policy@v17',
};
export function makeRun(candidate) {
  const report = evaluate(candidate, CASES),
    manifest = {
      candidate,
      implementation: 'categorical evidence rule',
      simulation: true,
    },
    bytes = JSON.stringify(report.rows),
    manifestBytes = JSON.stringify(manifest);
  return {
    id: 'run-' + (candidateIds.indexOf(candidate) + 1),
    candidate,
    codeIdentity: sha(codeBytes),
    knownGood: 'deploy-answerer-v1',
    context: {
      ...context,
    },
    metrics: {
      count: report.count,
      unsafe: report.unsafe,
      unnecessary: report.unnecessary,
      exact: report.exact,
    },
    artifacts: {
      code: {
        bytes: codeBytes,
        digest: sha(codeBytes),
      },
      knownGood: {
        bytes: knownGoodBytes,
        digest: sha(knownGoodBytes),
      },
      report: {
        bytes,
        digest: sha(bytes),
      },
      manifest: {
        bytes: manifestBytes,
        digest: sha(manifestBytes),
      },
    },
    incident: CASES[0].caseId,
  };
}
export function verifyRun(run) {
  try {
    assert.equal(run.incident, CASES[0].caseId, 'incident link changed');
    assert.equal(run.artifacts.code.bytes, codeBytes, 'code source changed');
    assert.equal(sha(run.artifacts.code.bytes), run.artifacts.code.digest, 'code digest mismatch');
    assert.equal(run.codeIdentity, run.artifacts.code.digest, 'code identity mismatch');
    assert.equal(run.artifacts.knownGood.bytes, knownGoodBytes, 'stable reference changed');
    assert.equal(
      sha(run.artifacts.knownGood.bytes),
      run.artifacts.knownGood.digest,
      'stable reference digest mismatch',
    );
    assert.equal(
      JSON.parse(run.artifacts.knownGood.bytes).release,
      run.knownGood,
      'stable reference identity mismatch',
    );
    for (const key of Object.keys(context))
      assert.equal(run.context[key], context[key], 'comparison context changed');
    const artifact = run.artifacts.report;
    assert.equal(sha(artifact.bytes), artifact.digest, 'report digest mismatch');
    const manifest = run.artifacts.manifest;
    assert.equal(sha(manifest.bytes), manifest.digest, 'manifest digest mismatch');
    assert.deepEqual(JSON.parse(manifest.bytes), {
      candidate: run.candidate,
      implementation: 'categorical evidence rule',
      simulation: true,
    });
    const rows = JSON.parse(artifact.bytes),
      expected = evaluate(run.candidate, CASES);
    assert.equal(rows.length, CASES.length, 'missing case');
    assert.equal(new Set(rows.map((r) => r.caseId)).size, CASES.length, 'duplicate case identity');
    for (const row of rows)
      assert.deepEqual(
        row,
        expected.rows.find((r) => r.caseId === row.caseId),
        'unexpected case or prediction',
      );
    const measured = scoreReport(rows);
    assert.deepEqual(
      run.metrics,
      {
        count: measured.count,
        unsafe: measured.unsafe,
        unnecessary: measured.unnecessary,
        exact: measured.exact,
      },
      'metrics disagree',
    );
    return {
      valid: true,
      ...measured,
      reason: measured.unsafe
        ? 'Reject unsafe route'
        : measured.unnecessary
          ? 'Reject unnecessary abstention'
          : 'Development checks clear',
    };
  } catch (error) {
    return {
      valid: false,
      reason: error.message.split('\n')[0],
    };
  }
}
export const runs = candidateIds.map(makeRun);
export function readReport(damaged) {
  const run = structuredClone(runs[2]);
  const artifact = run.artifacts.report;
  if (damaged) {
    const rows = JSON.parse(artifact.bytes);
    rows[rows.length - 1] = { ...rows[0] };
    artifact.bytes = JSON.stringify(rows);
    artifact.digest = sha(artifact.bytes);
  }
  return { run, report: JSON.parse(artifact.bytes), verification: verifyRun(run) };
}
export function comparable(records) {
  return (
    records.length > 0 &&
    Object.keys(context).every(
      (key) =>
        records.every((r) => typeof r.context[key] === 'string' && r.context[key].length) &&
        new Set(records.map((r) => r.context[key])).size === 1,
    )
  );
}
export function sampleModel(id, state) {
  const { beat } = tracks[id].sample(state).snapshot,
    q = motion(beat > state.beat ? 0 : state.beatP),
    base = {
      beat,
      q,
    };
  if (id === 'fingerprint') {
    const edited = beat > 0 && state.beatP >= 0.36,
      rows = (beat ? [...CASES].sort((a, b) => a.caseId.localeCompare(b.caseId)) : CASES).map(
        (r) =>
          edited && r.id === 'known good'
            ? {
                ...r,
                expected: 'ABSTAIN',
              }
            : r,
      );
    return {
      ...base,
      edited,
      rows,
      current: fingerprint(rows),
      original: suiteSha,
      reordered: fingerprint([...CASES].reverse()),
    };
  }
  if (id === 'paired') {
    const progress = clamp((state.beatP - 0.04) / 0.32),
      n = beat === 0 ? Math.floor(progress * 2) : 2 + Math.floor(progress * 2);
    return {
      ...base,
      ...evaluate('first repair', CASES.slice(0, n)),
      candidate: 'first repair',
    };
  }
  if (id === 'tradeoff') {
    const candidate = beat === 0 ? 'regressed' : 'revision',
      n = beat === 0 ? 4 : Math.floor(clamp((state.beatP - 0.03) / 0.27) * 4);
    return {
      ...base,
      candidate,
      ...evaluate(candidate, CASES.slice(0, n)),
    };
  }
  if (id === 'lineage') {
    return { ...base, ...readReport(beat === 1) };
  }
  if (id === 'comparability') {
    const records = structuredClone(runs);
    if (beat) records[2].context.evaluator = 'route-eval-v3';
    return {
      ...base,
      records,
      comparable: comparable(records),
    };
  }
  if (id === 'platforms')
    return {
      ...base,
      run: runs[1],
      verification: verifyRun(runs[1]),
    };
  if (id === 'feedback') {
    const holdout = CASES.filter((row) => row.source === 'holdout');
    const progress = beat === 0 ? clamp((state.beatP - 0.08) / 0.78) : 1,
      motion = progress * holdout.length,
      moved = Math.min(holdout.length, Math.floor(motion)),
      movingIndex = moved < holdout.length ? moved : null;
    return {
      ...base,
      progress,
      motion,
      moved,
      movingIndex,
      movingProgress: movingIndex === null ? 0 : motion - movingIndex,
      development: [
        ...CASES.filter((row) => row.source !== 'holdout'),
        ...holdout.slice(0, moved),
      ].map((r) => r.id),
      holdout: holdout.map((r) => r.id),
      final: ['new support shape', 'new rollback shape', 'missing approval', 'conflicting record'],
      scored: 0,
    };
  }
  if (id === 'handoff') {
    const results = runs.map(verifyRun),
      eligible = runs.filter(
        (_, i) => results[i].valid && !results[i].unsafe && !results[i].unnecessary,
      );
    assert.equal(eligible.length, 1);
    return {
      ...base,
      results,
      selected: eligible[0],
      traffic: 'PENDING fresh evaluation and release review',
    };
  }
  return {
    ...base,
    runIds: runs.map((r) => r.id),
  };
}
export function validateModel() {
  assert.equal(suiteSha.slice(0, 16), 'a20b1372381e9ca8');
  const same = sampleModel('fingerprint', {
      beat: 1,
      beatP: 0.2,
    }),
    changed = sampleModel('fingerprint', {
      beat: 1,
      beatP: 0.6,
    });
  assert.equal(same.edited, false);
  assert.equal(same.current, same.original);
  assert.equal(same.rows.find((r) => r.id === 'known good').expected, 'SERVE');
  assert.equal(changed.edited, true);
  assert.notEqual(changed.current, changed.original);
  assert.equal(changed.rows.find((r) => r.id === 'known good').expected, 'ABSTAIN');
  assert.equal(fingerprint([...CASES].reverse()), suiteSha);
  assert.notEqual(
    fingerprint(
      CASES.map((r, i) =>
        i === 1
          ? {
              ...r,
              expected: 'ABSTAIN',
            }
          : r,
      ),
    ),
    suiteSha,
  );
  assert.throws(() => fingerprint([CASES[0], CASES[0]]));
  assert.deepEqual(
    candidateIds.map((id) => {
      const r = evaluate(id, CASES);
      return [r.unsafe, r.unnecessary, r.exact];
    }),
    [
      [2, 0, 2],
      [0, 1, 3],
      [0, 0, 4],
    ],
  );
  assert.equal(
    sampleModel('paired', {
      beat: 0,
      beatP: 0.99,
    }).rate,
    1,
  );
  assert.equal(
    sampleModel('paired', {
      beat: 1,
      beatP: 0.99,
    }).rate,
    0.75,
  );
  for (const p of [0, 0.2, 0.4, 0.99]) {
    const s = sampleModel('tradeoff', {
      beat: 1,
      beatP: p,
    });
    assert.equal(s.count, s.rows.length);
    assert.equal(s.exact, s.count);
    if (!s.count) assert.equal(s.rate, null);
  }
  assert(runs.every((run) => verifyRun(run).valid));
  const original = readReport(false),
    copied = readReport(true);
  assert.equal(original.verification.valid, true);
  assert.equal(copied.verification.valid, false);
  assert.equal(copied.run.artifacts.report.digest, sha(copied.run.artifacts.report.bytes));
  assert.equal(copied.verification.reason, 'duplicate case identity');
  assert.deepEqual(copied.run.metrics, original.run.metrics);
  assert.equal(
    sampleModel('lineage', {
      beat: 1,
      beatP: 0,
    }).verification.valid,
    false,
  );
  for (const mutate of [
    (r) => delete r.artifacts.report,
    (r) => (r.artifacts.report.bytes = '[]'),
    (r) => (r.metrics.exact = 99),
    (r) => (r.context.suite = 'other'),
    (r) => delete r.codeIdentity,
    (r) => (r.knownGood = 'other'),
    (r) => (r.artifacts.code.bytes = 'altered'),
    (r) => delete r.artifacts.knownGood,
  ]) {
    const bad = structuredClone(runs[2]);
    mutate(bad);
    assert(!verifyRun(bad).valid);
  }
  assert(comparable(runs));
  assert(
    !sampleModel('comparability', {
      beat: 1,
      beatP: 0,
    }).comparable,
  );
  assert.equal(
    sampleModel('handoff', {
      beat: 1,
      beatP: 0,
    }).selected.candidate,
    'revision',
  );
  assert.equal(
    sampleModel('feedback', {
      beat: 1,
      beatP: 0.99,
    }).scored,
    0,
  );
  assert.equal(
    sampleModel('feedback', {
      beat: 0,
      beatP: 0,
    }).moved,
    0,
  );
  assert.equal(
    sampleModel('feedback', {
      beat: 0,
      beatP: 0.5,
    }).moved,
    1,
  );
  assert.equal(
    sampleModel('feedback', {
      beat: 0,
      beatP: 0.99,
    }).moved,
    2,
  );
  assert.equal(
    sampleModel('feedback', {
      beat: 1,
      beatP: 0,
    }).moved,
    2,
  );
  return true;
}
function inspectSixCaseReport(rows, loadedTemperature) {
  const bytes = JSON.stringify(rows);
  const saved = JSON.parse(bytes);
  const missing = canonicalFresh.filter((c) => !saved.some((r) => r.id === c.id));
  const canonical =
    saved.length === canonicalFresh.length &&
    missing.length === 0 &&
    saved.every((row) => {
      const reference = canonicalFresh.find((r) => r.id === row.id);
      return (
        reference && row.expected === reference.expected && row.predicted === reference.predicted
      );
    });
  return {
    saved,
    bytes,
    digest: sha(bytes),
    canonical,
    missing: missing.map((row) => row.id),
    exact: saved.filter((row) => row.predicted === row.expected).length,
    loadedTemperature,
    eligible: canonical && loadedTemperature === 0,
  };
}
export function freshTracking(state, api) {
  const at = (n) => clause(state, 'fresh-contract', 1, n, api),
    recoveredRow = state.beat > 1 || at(2) >= 1,
    refreshedWorker = state.beat > 1 || at(3) >= 1,
    rows = structuredClone(canonicalFresh);
  if (!recoveredRow) rows[5] = structuredClone(rows[0]);
  const r8 = inspectSixCaseReport(rows, 0);
  const r9 = inspectSixCaseReport(canonicalFresh, refreshedWorker ? 0 : 0.6);
  return {
    rows: r8.saved,
    reportBytes: r8.bytes,
    digest: r8.digest,
    canonical: r8.canonical,
    workerRows: r9.saved,
    missing: r8.missing,
    temperature: r9.loadedTemperature,
    approvedTemperature: 0,
    configMatches: r9.loadedTemperature === 0,
    exact: r8.exact,
    eligibleCount: [r8, r9].filter((r) => r.eligible).length,
    repair: recoveredRow && refreshedWorker,
    reveal: state.beat > 1 || at(0) >= 1,
    promotion: false,
  };
}
export function canaryAction(unsafe, reviewComplete) {
  assert(Number.isSafeInteger(unsafe) && unsafe >= 0);
  assert.equal(typeof reviewComplete, 'boolean');
  return unsafe > 0 ? 'ABORT CANARY' : reviewComplete ? 'CONTINUE MONITORING' : 'PAUSE FOR REVIEW';
}
export function pricedTokens({ uncached, cached, output, rates }) {
  for (const x of [uncached, cached, output]) assert(Number.isSafeInteger(x) && x >= 0);
  assert(rates.length === 3 && rates.every((x) => Number.isFinite(x) && x >= 0));
  const terms = [uncached * rates[0], cached * rates[1], output * rates[2]];
  return {
    terms,
    total: terms.reduce((a, b) => a + b, 0) / 1e6,
  };
}
