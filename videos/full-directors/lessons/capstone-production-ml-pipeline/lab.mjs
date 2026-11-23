import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  bundle,
  HAND_FAIL,
  OFFLINE_CASES,
  train,
  passingWindow,
  pendingWindow,
  regressingHistory,
} from '../../../films/capstone-production-ml-pipeline/fixtures.mjs';
import {
  admittedFeature,
  pipelineOffline,
  probeRelease,
  pipelinePromotionDecision,
  pipelinePromotionFixture,
} from '../../../films/capstone-production-ml-pipeline/model.mjs';
import {
  canary,
  matureQuality,
} from '../../../films/capstone-production-ml-pipeline/arithmetic.mjs';

export {
  bundle,
  train,
  HAND_FAIL,
  OFFLINE_CASES,
  pipelineOffline,
  probeRelease,
  pendingWindow,
  passingWindow,
  regressingHistory,
  canary,
  matureQuality,
};
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const fitted = OFFLINE_CASES.map((row) => {
  const probe = probeRelease('v1', row.x);
  return {
    ...row,
    pred: probe.warning,
    score: probe.score,
    cost: probe.warning ? 2 : row.gold ? 25 : 0,
    baseline: row.gold ? 25 : 0,
  };
});
export const chain = JSON.parse(readFileSync(new URL('./article-chain.json', import.meta.url)));
// Hash the same canonical bytes as the Python registry, including its floating-point costs.
function readArtifact(filename) {
  const bytes = readFileSync(new URL(filename, import.meta.url));
  const artifact = JSON.parse(bytes);
  const rows = artifact.evaluation_rows.map((row) => ({
    id: row.entity_id,
    gold: Boolean(row.late_delivery),
    critical: row.critical_slice,
    pred: Boolean(row.predicted_late),
    cost: row.candidate_cost,
    baseline: row.baseline_cost,
  }));
  return { artifact, fingerprint: digest(bytes), rows, metrics: gate(rows, artifact.training_entity_ids) };
}
export const originalArtifact = readArtifact('./article-artifact.json');
export const repricedArtifact = readArtifact('./article-repriced.json');
const stamp = (time) => '2026-05-28T' + time + ':00Z';
export const scans = [
  ['A', '10:00', '11:00', 9],
  ['B', '11:30', '12:30', 99],
  ['C', '13:00', '13:01', 100],
].map(([id, from, to, delay]) => ({
  id,
  from,
  to,
  delay,
  entity: 'eval-1',
  observed: stamp(from),
  available: stamp(to),
}));
export const selected = admittedFeature(scans, stamp('12:00'), 'eval-1');
export const trainingSum = train.reduce((n, r) => n + r.x, 0);
export const z = (x) => (x - bundle.center) / bundle.scale;
export const cross = train.reduce((n, r) => n + z(r.x) * (r.y - 0.5), 0);
export const squares = train.reduce((n, r) => n + z(r.x) ** 2, 0);
export const frac = (n) => (n == null ? '—' : Math.round(n * 100) + '%');
export const delta = (n) =>
  n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n * 100)) + '%';
// These are the exact bytes produced by the article builder for its six training records.
const savedBytes = readFileSync(new URL('./article-v1.json', import.meta.url), 'utf8');
const registeredDigest = digest(savedBytes);
export function changedPackage(kind) {
  let bytes = savedBytes,
    expected = registeredDigest;
  if (kind === 'space') bytes += ' ';
  if (kind === 'scale') {
    const model = JSON.parse(bytes);
    model.scale = 0;
    bytes = JSON.stringify(model);
    expected = digest(bytes);
  }
  const actual = digest(bytes),
    model = JSON.parse(bytes);
  const valid = actual === expected && model.scale > 0 && model.warning_threshold === 0.5;
  return { bytes, expected, actual, valid, model };
}
export const files = Object.fromEntries(
  ['good', 'space', 'scale'].map((k) => [k, changedPackage(k)]),
);
export function gate(rows, trainIds = train.map((_, i) => 'train-' + (i + 1))) {
  const metrics = pipelineOffline(rows);
  const overlap = rows.filter((r) => trainIds.includes(r.id)).map((r) => r.id);
  return { ...metrics, overlap, open: metrics.pass && !overlap.length };
}
export const noCritical = fitted.map((row) => ({ ...row, critical: false }));
export const noBase = fitted.map((row) => ({ ...row, baseline: 0 }));
export const firstHour = {
  id: 'first-hour',
  release: 'v1',
  day: 0,
  n: 500,
  errors: 0.002,
  ms: 118,
  ready: false,
  cost: null,
};
export const seventh = {
  ...firstHour,
  id: 'day-seven',
  day: 7,
  n: 4200,
  errors: 0.003,
  ms: 124,
  ready: true,
  cost: -0.08,
};
export const boundary = { ...seventh, ms: 250, errors: 0.01, cost: 0 };
export const day8 = {
  ...seventh,
  id: 'day-eight',
  day: 8,
  n: 900,
  ms: 130,
  errors: 0.004,
  cost: 0.14,
};
export function valid(w) {
  return (
    Number.isInteger(w.n) &&
    w.n > 0 &&
    Number.isInteger(w.day) &&
    w.day >= 0 &&
    Number.isFinite(w.ms) &&
    w.ms >= 0 &&
    Number.isFinite(w.errors) &&
    w.errors >= 0 &&
    w.errors <= 1 &&
    typeof w.ready === 'boolean' &&
    (w.cost === null || (Number.isFinite(w.cost) && w.cost >= -1))
  );
}
export function windowDecision(windows) {
  if (
    new Set(windows.map((w) => w.id)).size !== windows.length ||
    windows.some(
      (w, i) =>
        !valid(w) ||
        w.release !== 'v1' ||
        (i > 0 && w.day <= windows[i - 1].day) ||
        w.ms > 250 ||
        w.errors > 0.01 ||
        (w.ready && w.cost > 0),
    )
  )
    return 'Abort';
  const last = windows.at(-1);
  return windows.length >= 2 && last.ready && last.cost !== null ? 'Ready' : 'Hold';
}
export function productionStep(prior, w) {
  if (w.release !== 'v1' || w.day < prior.validDay) return { ...prior, decision: 'Hold rollback' };
  const accepted = valid(w);
  const costMeasured = w.ready && w.cost !== null;
  const limits = chain.limits;
  const breach =
    accepted && (w.ms > limits.latency || w.errors > limits.errors || (costMeasured && w.cost > limits.cost));
  return {
    latest: w.day,
    validDay: accepted ? w.day : prior.validDay,
    decision: breach
      ? 'Rollback required'
      : accepted && costMeasured
        ? 'Keep production'
        : 'Hold monitor',
  };
}
export const d9 = { ...day8, day: 9, cost: -0.01 },
  d10 = { ...d9, day: 10, errors: NaN };
export const day9state = productionStep({ latest: 8, validDay: 8 }, d9);
export const day10state = productionStep(day9state, d10);
export const lateState = productionStep(day10state, day8);
export function receiptState(requested, current, limit) {
  const fixture = pipelinePromotionFixture();
  fixture.receipt.id = 'ready-' + requested;
  fixture.latestReceiptId = (current === 4 ? 'hold-' : 'ready-') + current;
  fixture.policy.latency = limit;
  return pipelinePromotionDecision(fixture);
}
export function check() {
  assert.equal(selected.delay, 9);
  assert.equal(admittedFeature(scans, stamp('09:00'), 'eval-1'), null);
  assert.throws(() =>
    admittedFeature(
      [...scans, { ...scans[0], observed: '2026-05-28T06:00:00-04:00' }],
      stamp('12:00'),
      'eval-1',
    ),
  );
  assert.deepEqual(
    train.map((r) => r.x),
    [0, 1, 2, 8, 9, 10],
  );
  assert.deepEqual([trainingSum, bundle.center, bundle.scale], [30, 5, 10]);
  assert(Math.abs(cross - 1.2) < 1e-12 && Math.abs(squares - 1) < 1e-12);
  assert.deepEqual(
    fitted.map((r) => r.score.toFixed(2)),
    ['0.98', '0.86', '0.02', '-0.10'],
  );
  const missing = probeRelease('v1', null);
  assert.deepEqual([missing.transformed, missing.score, missing.warning], [0, 0.5, true]);
  const cheap = gate(HAND_FAIL),
    fit = gate(fitted);
  assert.deepEqual(
    [cheap.cost, cheap.base, cheap.hits, cheap.positives, cheap.open],
    [96, 100, 1, 2, false],
  );
  assert.deepEqual([fit.cost, fit.base, fit.hits, fit.positives, fit.open], [4, 50, 2, 2, true]);
  assert.equal(gate(fitted, ['eval-2']).open, false);
  assert.equal(gate(noCritical).recall, null);
  assert.equal(gate(noBase).delta, null);
  assert.equal(chain.ready.admissionId, chain.admission.id);
  assert.equal(chain.admission.evidenceId, chain.evidence.id);
  assert.equal(chain.admission.decision, 'open_canary');
  assert.equal(chain.ready.decision, 'ready_for_promotion');
  assert.equal(originalArtifact.artifact.artifact_id, chain.evidence.artifactId);
  assert.equal(originalArtifact.artifact.model_artifact, files.good.expected);
  assert.equal(originalArtifact.fingerprint, chain.evidence.artifactFingerprint);
  assert.deepEqual(originalArtifact.metrics, fit);
  assert.deepEqual(originalArtifact.rows, fitted.map(({ x, score, ...row }) => row));
  const priceEdit = structuredClone(originalArtifact.artifact);
  priceEdit.evaluation_rows.find((row) => row.entity_id === 'eval-2').candidate_cost = 3;
  assert.deepEqual(repricedArtifact.artifact, priceEdit);
  assert.equal(repricedArtifact.metrics.cost, 5);
  assert.notEqual(repricedArtifact.fingerprint, chain.evidence.artifactFingerprint);
  for (const row of fitted) {
    const saved = files.good.model;
    assert.equal(saved.intercept + saved.slope * ((row.x - saved.center) / saved.scale), row.score);
    assert.equal(saved.warning_threshold, bundle.threshold);
  }
  assert.equal(files.good.model.training_ids.length, train.length);
  assert(files.good.valid && !files.space.valid && !files.scale.valid);
  assert.notEqual(files.space.actual, files.space.expected);
  assert.equal(files.scale.actual, files.scale.expected);
  assert.equal(matureQuality(pendingWindow), null);
  assert.deepEqual(
    passingWindow.qualityRows.map((r) => r.late),
    [true, true, false, false],
  );
  assert.equal(delta(matureQuality(passingWindow).delta), '−8%');
  assert.equal(delta(matureQuality(regressingHistory[0]).delta), '+14%');
  assert.deepEqual(
    [canary([pendingWindow]), canary([pendingWindow, passingWindow]), canary(regressingHistory)],
    ['HOLD', 'READY', 'ABORT'],
  );
  assert.deepEqual(
    [
      [],
      [firstHour],
      [firstHour, boundary],
      [firstHour, { ...boundary, ready: false, cost: null }],
      [firstHour, { ...boundary, ms: NaN }],
      [firstHour, { ...seventh, n: true }],
      [seventh, firstHour],
    ].map(windowDecision),
    ['Hold', 'Hold', 'Ready', 'Hold', 'Abort', 'Abort', 'Abort'],
  );
  assert.deepEqual(lateState, { latest: 10, validDay: 9, decision: 'Hold rollback' });
  assert.equal(
    productionStep(day9state, { ...d10, errors: 0, release: 'v0' }).decision,
    'Hold rollback',
  );
  for (const [changes, decision] of [
    [{ ready: false, cost: null }, 'Hold monitor'],
    [{ cost: null }, 'Hold monitor'],
    [{}, 'Rollback required'],
    [{ cost: null, errors: 0.02 }, 'Rollback required'],
    [{ ready: false, cost: null, ms: 251 }, 'Rollback required'],
    [{ cost: 0 }, 'Keep production'],
  ]) {
    assert.equal(productionStep({ latest: 7, validDay: 7 }, { ...day8, ...changes }).decision, decision);
  }
  assert.deepEqual(receiptState(3, 4, 300).reasons, [
    'canary_receipt_superseded',
    'canary_receipt_policy_fingerprint_mismatch',
  ]);
  assert.deepEqual(receiptState(3, 4, 250).reasons, ['canary_receipt_superseded']);
  const moved = receiptState(5, 5, 250);
  assert.equal(moved.production, 'v1');
  const two = OFFLINE_CASES[1];
  assert.equal(two.x, 8);
  assert.deepEqual(
    [probeRelease('v0', two.x).warning, probeRelease(moved.production, two.x).warning],
    [false, true],
  );
  assert.equal(probeRelease(moved.production, two.x).score.toFixed(2), '0.86');
  assert.equal(probeRelease('v0', 9).score, 0);
  return true;
}
