import assert from 'node:assert/strict';
import { manuals, bundle, manifest } from '../../../films/edge-specialization/fixtures.mjs';
import {
  verifyAnswer,
  train,
  executeGraph,
  checkBundle,
  policyDecision,
} from '../../../films/edge-specialization/model.mjs';
import {
  energyCandidate,
  integrateEnergy,
  edgeRoute,
  edgeNumeric,
  edgeDevice,
} from '../../../films/edge-specialization/arithmetic.mjs';
export { manuals, bundle, manifest, train, energyCandidate, integrateEnergy, edgeDevice };

export const articleBus = { weights: 3.8, gbps: 50, rate: 18 };
export function stream(bits) {
  const size = (articleBus.weights * bits) / 8;
  return { size, traffic: size * articleBus.rate, ceiling: articleBus.gbps / size };
}
export const cache = { layers: 24, width: 32, positions: 1024, bytes: 2, queryHeads: 8 };
export const cacheMiB = (heads) =>
  (2 * cache.layers * heads * cache.width * cache.positions * cache.bytes) / 2 ** 20;
export function answer(code, citation) {
  const question = { sensor: 'A', code };
  if (!citation) return { question, citation: null, record: null, ok: false };
  const record = manuals[citation];
  const verified = verifyAnswer(question, { citation, ...record });
  return { question, citation, record, ok: verified.applies, quoted: verified.valueMatch };
}
export const plans = [
  ['cpu', 'cpu', 'cpu'],
  ['npu', 'cpu', 'npu'],
  ['npu', 'npu', 'npu'],
].map(executeGraph);
export function graphAt(plan, time) {
  const ops = plan.spans.filter((s) => s.device !== 'boundary' && s.end <= time);
  const active = plan.spans.find((s) => s.end > time);
  const spanIndex = plan.spans.indexOf(active);
  const side = (d) => (d === 'cpu' ? 0 : 1);
  let position = side(active?.device ?? plan.placement.at(-1));
  if (active?.device === 'boundary') {
    const from = side(plan.spans[spanIndex - 1].device);
    position = from + ((1 - 2 * from) * (time - active.start)) / (active.end - active.start);
  }
  return {
    position,
    values: ops.length ? plan.results[ops.length - 1] : [2, 1],
    label: active?.name ?? 'Result',
    finished: !active,
  };
}
export const gradient = { p: 0.7, q: 0.2, t: 2, lr: 0.1 };
export function gradientStep({ p, q, t, lr }) {
  const raw = (q - p) / t,
    scaled = raw * t * t;
  return { raw, scaled, delta: -lr * scaled };
}
export const alpha = 0.6,
  beta = 0.2;
export const signals = [
  { name: 'Hard label', value: 0.5, weight: 1 - alpha },
  { name: 'Soft KL × T²', value: 0.2, weight: alpha },
  { name: 'Hidden MSE', value: 0.1, weight: beta },
];
export const parts = signals.map((r) => r.weight * r.value);
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const numericInput = [2, -0.5, -2];
export const numeric = edgeNumeric(numericInput);
export const batchOK = (n) => Number.isInteger(n) && n >= 1 && n <= 8;
export const referenceQuality = 0.94,
  allowedDrop = 0.02,
  latencyLimit = 120;
export const exportFloor = referenceQuality - allowedDrop;
export const candidates = [
  ['Baseline', referenceQuality, 132],
  ['INT8', 0.938, 104],
  ['INT4', 0.887, 71],
];
export const passesExport = ([, quality, ms]) => quality >= exportFloor && ms <= latencyLimit;

// The planning profiles have their own assumed decode rates, independent of the recorder.
export const shiftProfiles = ['A', 'B'].map(energyCandidate);
export const trialTimes = [
  205, 160, 228, 193, 178, 212, 188, 205, 183, 198, 217, 312, 219, 208, 225, 223, 232, 175, 238,
  199,
].sort((a, b) => a - b);
export const trialRank = Math.ceil(0.95 * trialTimes.length);
export const trialLimit = 250;

// A fourth synthetic sample lets the class distinguish a recovered rate from a recovered minimum.
export const traces = [
  [
    [0, 23],
    [1.5, 19.4],
    [8, 16.8],
    [10, 18.6],
  ],
  [
    [0, 21],
    [1.5, 20],
    [8, 19.5],
    [10, 19],
  ],
];
export function observations(trace, minute) {
  const seen = trace.filter((p) => p[0] <= minute);
  return { seen, latest: seen.at(-1), lowest: seen.reduce((a, b) => (a[1] <= b[1] ? a : b)) };
}
export const assets = { metrics: 'public', manual: 'restricted', incident: 'restricted' };
export const report = ['metrics', 'manual'];
export const reportDecision = policyDecision(report, 'cloud', 'public');
const permissions = { data: 'public', approval: true, redaction: true, online: true };
export const routes = [
  { score: true, supported: true, ...permissions },
  {
    score: 0.8,
    supported: true,
    data: 'restricted',
    approval: false,
    redaction: false,
    online: false,
  },
  { score: 0.79, supported: false, ...permissions },
];
export const route = (r) => edgeRoute(r);
export const tokenChoices = [
  { word: 'lens', p: 0.93 },
  { word: 'battery', p: 0.04 },
];
export const topTwoMargin = tokenChoices[0].p - tokenChoices[1].p;
// Each draft quotes its cited entry. The audit also checks whether that entry applies to the probe.
export const heldOut = [
  [0.94, 'A', 'M7'],
  [0.81, 'B', 'M8'],
  [0.86, 'B', 'M8'],
  [0.78, 'A', 'M7'],
  [0.91, 'B', 'M8'],
  [0.84, 'A', 'M7'],
  [0.88, 'B', 'M8'],
  [topTwoMargin, 'A', 'M8'],
  [0.93, 'A', 'M7'],
  [0.62, 'B', 'M8'],
].map(([score, sensor, citation], index) => {
  const check = verifyAnswer({ sensor, code: 'E2' }, { citation, ...manuals[citation] });
  return { number: index + 1, score, supported: check.valueMatch, correct: check.applies };
});
export function auditAt(cutoff) {
  const rows = heldOut.map((r) => ({ ...r, kept: r.score >= cutoff && r.supported }));
  const retained = rows.filter((r) => r.kept);
  return {
    rows,
    retained: retained.length,
    errors: retained.filter((r) => !r.correct).length,
    total: rows.length,
  };
}
export const receipts = [
  ['A', 7, 99, true],
  ['B', 6, 120, true],
  ['C', 8, 120, true],
  ['D', 8, 120, false],
];
export function receiptReason([, version, expiry, match]) {
  if (version < 7) return 'Version too low';
  if (expiry <= 100) return 'Expired';
  return match ? 'Eligible' : 'Bytes differ';
}
const approvedBytes = Buffer.from(
  JSON.stringify({ model: 'student 1', tokenizer: 'toy 3', runtime: 2 }),
);
export const approvedLength = approvedBytes.length;
const shelf = {
  A: { model: JSON.parse(approvedBytes), manuals },
  B: { model: JSON.parse(bundle), manuals },
};
export function readLocal(slot, sensor, code) {
  const entry = Object.entries(shelf[slot].manuals).find(
    ([, r]) => r.sensor === sensor && r.code === code,
  );
  return { model: shelf[slot].model.model, citation: entry?.[0], meaning: entry?.[1].meaning };
}
export function slots(bytes, activate = false, healthFailed = false) {
  const checked = checkBundle(bundle.subarray(0, bytes));
  const canRun = activate && checked.accepted;
  return {
    bytes,
    checked,
    active: canRun && !healthFailed ? 'B' : 'A',
    session: !canRun ? 1 : healthFailed ? 3 : 2,
  };
}
export function checkExamples() {
  assert.equal(answer('E2', 'M8').quoted, true);
  assert.equal(answer('E2', 'M8').ok, false);
  assert.equal(answer('E2', 'M7').ok, true);
  assert.ok(!Object.values(manuals).some((r) => r.sensor === 'A' && r.code === 'E9'));
  assert.deepEqual(
    [stream(8).traffic, stream(4).traffic].map((x) => x.toFixed(1)),
    ['68.4', '34.2'],
  );
  assert.deepEqual([cacheMiB(8), cacheMiB(2)], [24, 6]);
  assert.ok(train(0, 3).teacher[1] > train(0, 1).teacher[1]);
  assert.ok(train(60, 3).loss < train(0, 3).loss);
  const g = gradientStep(gradient);
  assert.deepEqual(
    [g.raw, g.scaled, g.delta, sum(parts)].map((x) => x.toFixed(3)),
    ['-0.250', '-1.000', '0.100', '0.340'],
  );
  assert.deepEqual(
    parts.map((p) => p.toFixed(2)),
    ['0.20', '0.12', '0.02'],
  );
  assert.deepEqual(
    plans.map((p) => p.total),
    [13, 21, 2.5],
  );
  assert.deepEqual(
    plans.map((p) => graphAt(p, p.total).values),
    [[2], [2], [2]],
  );
  assert.equal(graphAt(plans[1], 5).position, 0.5);
  assert.deepEqual(graphAt(plans[1], 16).values, [1, 1.5]);
  assert.deepEqual(numeric.logits, [0.5, -0.5]);
  assert.deepEqual([batchOK(8), batchOK(9)], [true, false]);
  assert.deepEqual(
    candidates.filter(passesExport).map((r) => r[0]),
    ['INT8'],
  );
  assert.deepEqual(observations(traces[0], 10).lowest, [8, 16.8]);
  assert.deepEqual(observations(traces[0], 10).latest, [10, 18.6]);
  assert.equal(observations(traces[1], 10).lowest[1], 19);
  assert.deepEqual(
    shiftProfiles.map((p) => integrateEnergy(p, 28800).toFixed(2)),
    ['11.13', '14.07'],
  );
  assert.deepEqual(
    shiftProfiles.map((p) => [p.rate, p.watts]),
    [
      [18, 3.5],
      [10, 6],
    ],
  );
  for (const profile of shiftProfiles) {
    assert.equal(profile.phases[1].seconds, 30000 / profile.rate);
    assert.equal(sum(profile.phases.map((p) => p.seconds)), 28800);
  }
  assert.equal(trialRank, 19);
  assert.equal(trialTimes[trialRank - 1], 238);
  assert.ok(trialTimes[trialRank - 1] < trialLimit && trialTimes.at(-1) > trialLimit);
  assert.equal(topTwoMargin.toFixed(2), '0.89');
  const audit = auditAt(0.8);
  assert.deepEqual([audit.retained, audit.errors, audit.total], [8, 1, 10]);
  assert.deepEqual(
    audit.rows.filter((r) => r.kept && !r.correct).map((r) => r.number),
    [8],
  );
  assert.ok(audit.rows.every((r) => r.kept === (route(r) === 'local answer')));
  const stricter = auditAt(0.9);
  assert.deepEqual([stricter.retained, stricter.errors, stricter.total], [3, 0, 10]);
  assert.equal(answer('E2', 'M8').record.meaning, 'lens covered');
  assert.equal(reportDecision.classification, 'restricted');
  assert.equal(reportDecision.allowed, false);
  assert.deepEqual(routes.map(route), ['local review', 'local answer', 'cloud allowed']);
  assert.equal(route({ ...routes[2], online: false }), 'local review');
  assert.equal(slots(49, true).checked.length, false);
  assert.equal(slots(49, true).active, 'A');
  assert.equal(slots(49, true).checked.digest, false);
  assert.equal(slots(bundle.length, true).active, 'B');
  assert.deepEqual([slots(53, true, true).active, slots(53, true, true).session], ['A', 3]);
  assert.deepEqual(readLocal(slots(49, true).active, 'A', 'E2'), {
    model: 'student 1',
    citation: 'M7',
    meaning: 'battery low',
  });
  assert.equal(readLocal(slots(53, true, true).active, 'A', 'E9').meaning, undefined);
  assert.deepEqual(
    receipts.filter((r) => receiptReason(r) === 'Eligible').map((r) => r[0]),
    ['C'],
  );
  assert.deepEqual(
    [edgeDevice(1), edgeDevice(0.9)].map((d) => d.total.toFixed(2)),
    ['6.67', '6.09'],
  );
  assert.deepEqual(edgeDevice(1).seconds, edgeDevice(0.9).seconds);
  assert.equal(edgeDevice(0.9).resident, 1872);
  assert.equal(edgeDevice(0.9).margin, 176);
}
