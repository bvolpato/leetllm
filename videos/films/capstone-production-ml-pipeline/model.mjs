import { fingerprint, modelDigest, score, sum } from './arithmetic.mjs';
import {
  OFFLINE_CASES,
  OFFLINE_POLICY,
  RETAINED_RELEASES,
  packageDigest,
  promotionPolicy,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function offline(rows, policy = OFFLINE_POLICY) {
  const positives = rows.filter((v) => v.critical && v.gold),
    recall = positives.filter((v) => v.pred).length / positives.length;
  return {
    recall,
    delta: sum(rows.map((v) => v.cost)) / sum(rows.map((v) => v.baseline)) - 1,
    pass:
      recall >= policy.recallFloor &&
      sum(rows.map((v) => v.cost)) <=
        sum(rows.map((v) => v.baseline)) * (1 + policy.costRegressionLimit),
  };
}
export function evaluatePackage(model, costReceipts) {
  return OFFLINE_CASES.map((row) => {
    const scoreValue = score(model, row.x),
      receipt = costReceipts.find((r) => r.id === row.id);
    assert(
      receipt && receipt.modelDigest === modelDigest(model),
      'cost receipt binds this model and evaluation request',
    );
    return {
      ...row,
      score: scoreValue,
      pred: scoreValue >= model.threshold,
      cost: receipt.cost,
      baseline: receipt.baseline,
    };
  });
}
export const receiptsFor = (model, cost) =>
  OFFLINE_CASES.map((row) => ({
    id: row.id,
    modelDigest: modelDigest(model),
    cost,
    baseline: 25,
  }));
export function offlineReceipt(model, rows, training, policy = OFFLINE_POLICY) {
  return {
    training,
    release: training === 'train-v1' ? 'v1' : 'candidate-cheap',
    modelDigest: modelDigest(model),
    rowsDigest: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
    policyDigest: createHash('sha256').update(JSON.stringify(policy)).digest('hex'),
    rowIds: rows.map((r) => r.id),
    policy,
    metrics: offline(rows, policy),
  };
}
export function receiptMatches(
  receipt,
  model,
  rows,
  policy = OFFLINE_POLICY,
  expectedRelease = 'v1',
) {
  const current = offlineReceipt(model, rows, receipt.training, policy);
  return (
    receipt.release === expectedRelease &&
    ['modelDigest', 'rowsDigest', 'policyDigest'].every((key) => current[key] === receipt[key])
  );
}
export function loadRelease(release, registry = RETAINED_RELEASES) {
  assert(Object.hasOwn(registry, release), 'unknown retained release');
  const retained = registry[release];
  assert.equal(
    createHash('sha256').update(retained.bytes).digest('hex'),
    retained.sha256,
    'release package checksum mismatch',
  );
  const restored = JSON.parse(retained.bytes);
  assert.equal(restored.schema, 'delay-v1');
  for (const field of ['center', 'scale', 'slope', 'intercept', 'threshold'])
    assert(Number.isFinite(restored.bundle[field]), 'invalid retained model parameter');
  assert(restored.bundle.scale > 0, 'invalid retained transformation scale');
  return restored;
}
export function probeRelease(release, delay, registry = RETAINED_RELEASES) {
  const restored = loadRelease(release, registry),
    model = restored.bundle;
  const input = delay ?? model.center;
  assert(Number.isFinite(input), 'invalid probe input');
  const transformed = (input - model.center) / model.scale;
  const value = score(model, input);
  return {
    release,
    digest: registry[release].sha256,
    model,
    input,
    transformed,
    score: value,
    warning: value >= model.threshold,
  };
}
export function promotionTarget(current, requestedDigest, receipt) {
  return receipt?.decision === 'READY' &&
    receipt.packageDigest === requestedDigest &&
    requestedDigest === packageDigest
    ? 'v1'
    : current;
}
export function pipelineOffline(rows, policy = OFFLINE_POLICY) {
  const ids = new Set();
  for (const r of rows) {
    assert(typeof r.id === 'string' && r.id && !ids.has(r.id), 'duplicate evaluation identity');
    ids.add(r.id);
    assert(
      typeof r.gold === 'boolean' && typeof r.critical === 'boolean' && typeof r.pred === 'boolean',
      'typed evaluation decisions',
    );
    for (const k of ['cost', 'baseline'])
      assert(Number.isFinite(r[k]) && r[k] >= 0, 'finite nonnegative cost');
  }
  const positives = rows.filter((r) => r.gold && r.critical),
    hits = positives.filter((r) => r.pred).length,
    base = sum(rows.map((r) => r.baseline)),
    cost = sum(rows.map((r) => r.cost)),
    recall = positives.length ? hits / positives.length : null,
    delta = base > 0 ? cost / base - 1 : null;
  return {
    positives: positives.length,
    hits,
    recall,
    cost,
    base,
    delta,
    pass:
      recall !== null &&
      delta !== null &&
      recall >= policy.recallFloor &&
      delta <= policy.costRegressionLimit,
  };
}
export function admittedFeature(scans, prediction, entity) {
  const cutoff = Date.parse(prediction);
  assert(Number.isFinite(cutoff), 'invalid prediction clock');
  const seen = new Set();
  for (const r of scans) {
    const observed = Date.parse(r.observed),
      available = Date.parse(r.available),
      key = r.entity + '@' + observed;
    assert(
      Number.isFinite(observed) && Number.isFinite(available) && available >= observed,
      'invalid scan clocks',
    );
    assert(!seen.has(key), 'ambiguous normalized scan revision');
    seen.add(key);
  }
  return (
    scans
      .filter(
        (r) =>
          r.entity === entity &&
          Date.parse(r.observed) <= cutoff &&
          Date.parse(r.available) <= cutoff,
      )
      .sort((a, b) => Date.parse(b.observed) - Date.parse(a.observed))[0] ?? null
  );
}
export function pipelinePromotionFixture() {
  const receipt = {
    id: 'ready-3',
    decision: 'READY',
    productionBefore: 'v0',
    candidate: 'v1',
    policy: fingerprint(promotionPolicy),
    package: RETAINED_RELEASES.v1.sha256,
  };
  return {
    production: 'v0',
    receipt,
    latestReceiptId: receipt.id,
    policy: {
      ...promotionPolicy,
    },
    retained: structuredClone(RETAINED_RELEASES),
  };
}
export function pipelinePromotionDecision(state) {
  const { production, receipt, latestReceiptId, policy, retained } = state,
    reasons = [];
  if (!receipt) reasons.push('canary_receipt_not_registered');
  else {
    if (receipt.id !== latestReceiptId) reasons.push('canary_receipt_superseded');
    if (receipt.decision !== 'READY') reasons.push('canary_receipt_not_ready');
    if (receipt.policy !== fingerprint(policy))
      reasons.push('canary_receipt_policy_fingerprint_mismatch');
    if (receipt.productionBefore !== production)
      reasons.push('production_changed_since_canary_receipt');
    if (receipt.package !== retained?.v1?.sha256)
      reasons.push('canary_receipt_artifact_fingerprint_mismatch');
    try {
      loadRelease('v1', retained);
      loadRelease(production, retained);
    } catch {
      reasons.push('model_reload_failed');
    }
  }
  return {
    action: reasons.length ? 'hold_promotion' : 'promote',
    production: reasons.length ? production : 'v1',
    reasons,
  };
}
export function freshPipelineState(stage) {
  const state = pipelinePromotionFixture();
  if (stage < 3) state.latestReceiptId = 'hold-4';
  if (stage < 2) state.policy.latency = 300;
  else if (stage === 3) {
    state.receipt.id = 'ready-5';
    state.latestReceiptId = 'ready-5';
  }
  const decision = pipelinePromotionDecision(state);
  return {
    ...state,
    decision,
    probe: probeRelease(decision.production, 9),
  };
}
