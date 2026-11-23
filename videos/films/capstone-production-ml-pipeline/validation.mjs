import { canary, matureQuality, outcomeRows, score, sum } from './arithmetic.mjs';
import {
  CANARY_EVIDENCE_CUES,
  HAND_FAIL,
  OFFLINE_POLICY,
  RETAINED_RELEASES,
  bundle,
  failedBundle,
  packageDigest,
  passingWindow,
  pendingWindow,
  priorBundle,
  regressingHistory,
} from './fixtures.mjs';
import {
  bad,
  canaryEvidence,
  offlineConstruction,
  passingEvaluation,
  sampleModel,
} from './construction.mjs';
import {
  admittedFeature,
  evaluatePackage,
  freshPipelineState,
  offline,
  offlineReceipt,
  pipelineOffline,
  pipelinePromotionDecision,
  pipelinePromotionFixture,
  probeRelease,
  promotionTarget,
  receiptMatches,
  receiptsFor,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validatePipelineUpgrade();
  assert.equal(RETAINED_RELEASES.v1.sha256, packageDigest);
  const priorProbe = probeRelease('v0', 9),
    candidateProbe = probeRelease('v1', 9);
  assert.equal(priorProbe.score, 0);
  assert.equal(priorProbe.warning, false);
  assert.equal(candidateProbe.transformed, 0.4);
  assert(Math.abs(candidateProbe.score - 0.98) < 1e-12);
  assert.equal(candidateProbe.warning, true);
  assert.equal(probeRelease('v1', 0).warning, false);
  assert.equal(probeRelease('v1', null).warning, true);
  for (const release of ['v0', 'v1'])
    for (const delay of [null, 0, 1, 8, 9, 10])
      assert.equal(
        probeRelease(release, delay).warning,
        score(release === 'v0' ? priorBundle : bundle, delay) >=
          (release === 'v0' ? priorBundle : bundle).threshold,
      );
  assert.equal(failedBundle.center, 9);
  assert.equal(failedBundle.scale, 18);
  assert.deepEqual(
    bad.map((r) => r.pred),
    [true, false, false, false],
  );
  assert.deepEqual(
    passingEvaluation.map((r) => r.pred),
    [true, true, false, false],
  );
  assert.deepEqual(
    bad.map((r) => r.id),
    passingEvaluation.map((r) => r.id),
  );
  assert.equal(offline(passingEvaluation).recall, 1);
  assert.equal(offline(passingEvaluation).pass, true);
  assert.equal(
    bad.reduce((n, r) => n + r.cost, 0),
    96,
  );
  assert.equal(
    passingEvaluation.reduce((n, r) => n + r.cost, 0),
    4,
  );
  assert(bad.every((r) => r.cost < r.baseline));
  for (const rows of [bad, passingEvaluation])
    for (const row of rows) assert.equal(row.pred, row.score >= 0.5);
  const receipt = offlineReceipt(bundle, passingEvaluation, 'train-v1');
  assert(receiptMatches(receipt, bundle, passingEvaluation));
  assert(
    !receiptMatches(
      receipt,
      {
        ...bundle,
        threshold: 0.6,
      },
      passingEvaluation,
    ),
  );
  assert(
    !receiptMatches(
      {
        ...receipt,
        release: 'other',
      },
      bundle,
      passingEvaluation,
    ),
  );
  assert.equal(
    offline(passingEvaluation, {
      ...OFFLINE_POLICY,
      costRegressionLimit: -0.95,
    }).pass,
    false,
  );
  assert(
    !receiptMatches(receipt, bundle, passingEvaluation, {
      ...OFFLINE_POLICY,
      recallFloor: 0.95,
    }),
  );
  assert.throws(() => evaluatePackage(bundle, receiptsFor(failedBundle, 24)), /cost receipt binds/);
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const current = offlineConstruction({
      beat: 1,
      cues: {
        'offline-b2-1': {
          phase: 'during',
          progress,
        },
      },
    });
    assert.equal(current.shown, Math.ceil(4 * progress));
    assert.equal(current.gate !== null, progress === 1);
    assert.equal(current.model, bundle);
  }
  assert.equal(
    promotionTarget('v0', packageDigest, {
      decision: canary([pendingWindow, passingWindow]),
      packageDigest,
    }),
    'v1',
  );
  assert.equal(
    promotionTarget('v0', 'changed', {
      decision: 'READY',
      packageDigest,
    }),
    'v0',
  );
  assert.equal(
    promotionTarget('v0', packageDigest, {
      decision: 'HOLD',
      packageDigest,
    }),
    'v0',
  );
  assert.equal(bundle.center, 5);
  assert.equal(bundle.scale, 10);
  assert(Math.abs(bundle.slope - 1.2) < 1e-12);
  assert.deepEqual(
    [9, 8, 1, 0].map((x) => score(bundle, x) >= 0.5),
    [true, true, false, false],
  );
  assert.equal(score(bundle, null), 0.5);
  assert.equal(offline(bad).recall, 0.5);
  assert.equal(offline(bad).pass, false);
  assert.equal(canary([]), 'HOLD');
  assert.equal(canary([pendingWindow]), 'HOLD');
  const mature = matureQuality(passingWindow);
  assert.deepEqual(mature, {
    count: 4,
    candidateCost: 92,
    baselineCost: 100,
    delta: 92 / 100 - 1,
  });
  assert.equal(canary([pendingWindow, passingWindow]), 'READY');
  assert.equal(
    canary([
      pendingWindow,
      {
        ...passingWindow,
        labelsReady: false,
      },
    ]),
    'HOLD',
  );
  assert.equal(
    canary([
      pendingWindow,
      {
        ...passingWindow,
        qualityRows: null,
      },
    ]),
    'HOLD',
  );
  assert.equal(
    canary([
      pendingWindow,
      {
        ...passingWindow,
        qualityRows: [],
      },
    ]),
    'HOLD',
  );
  assert.equal(
    canary([
      pendingWindow,
      {
        ...passingWindow,
        qualityRows: outcomeRows(0).map((row) => ({
          ...row,
          baselineCost: 0,
        })),
      },
    ]),
    'HOLD',
  );
  assert.equal(canary(regressingHistory), 'ABORT');
  assert.equal(
    canary([
      pendingWindow,
      {
        ...passingWindow,
        qualityRows: outcomeRows(25),
      },
    ]),
    'READY',
  );
  for (const change of [
    (window) => {
      window.ms = 251;
    },
    (window) => {
      window.error = NaN;
    },
    (window) => {
      delete window.labelsReady;
    },
    (window) => {
      window.qualityRows[0].late = null;
    },
    (window) => {
      window.qualityRows[0].candidateCost = NaN;
    },
    (window) => {
      window.qualityRows[0].candidateCost = -1;
    },
    (window) => {
      window.qualityRows[1].id = window.qualityRows[0].id;
    },
  ]) {
    const badWindow = structuredClone(passingWindow);
    change(badWindow);
    assert.equal(canary([pendingWindow, badWindow]), 'ABORT');
  }
  assert.equal(canary([passingWindow, pendingWindow]), 'ABORT');
  for (const p of [0, 0.02, 0.5, 0.98]) {
    assert.equal(
      canary(
        sampleModel('canary', {
          beat: 0,
          beatP: p,
        }).windows,
      ),
      'HOLD',
    );
    const current = sampleModel('canary', {
      beat: 1,
      beatP: p,
    });
    assert.equal(
      canary(current.windows),
      current.canaryEvidence.costCount === 4 ? 'READY' : 'HOLD',
    );
    assert.equal(
      canary(
        sampleModel('canary', {
          beat: 2,
          beatP: p,
        }).windows,
      ),
      'ABORT',
    );
  }
  const ids = passingWindow.qualityRows.map((row) => row.id);
  for (const [index, cue] of CANARY_EVIDENCE_CUES.labels.entries()) {
    const before = canaryEvidence({
      beat: 1,
      beatP: cue - 1e-6,
    });
    const after = canaryEvidence({
      beat: 1,
      beatP: cue,
    });
    assert.equal(before.labelCount, index);
    assert.equal(after.labelCount, index + 1);
    assert.deepEqual(
      after.rows.map((row) => row.id),
      ids,
    );
    assert.equal(after.costCount, 0);
    assert.equal(after.controllerCalled, false);
  }
  for (const [index, cue] of CANARY_EVIDENCE_CUES.costs.entries()) {
    const before = canaryEvidence({
      beat: 1,
      beatP: cue - 1e-6,
    });
    const after = canaryEvidence({
      beat: 1,
      beatP: cue,
    });
    assert.equal(before.costCount, index);
    assert.equal(after.costCount, index + 1);
    assert.equal(after.labelCount, 4);
    assert.equal(
      after.candidateTotal,
      sum(passingWindow.qualityRows.slice(0, index + 1).map((row) => row.candidateCost)),
    );
    assert.equal(
      after.baselineTotal,
      sum(passingWindow.qualityRows.slice(0, index + 1).map((row) => row.baselineCost)),
    );
    assert.equal(after.controllerCalled, false);
  }
  const beforeCall = sampleModel('canary', {
    beat: 1,
    beatP: CANARY_EVIDENCE_CUES.controller - 1e-6,
  });
  const afterCall = sampleModel('canary', {
    beat: 1,
    beatP: CANARY_EVIDENCE_CUES.controller,
  });
  assert.equal(beforeCall.canaryEvidence.controllerCalled, false);
  assert.equal(afterCall.canaryEvidence.controllerCalled, true);
  assert.equal(canary(afterCall.windows), 'READY');
  assert.deepEqual(
    [afterCall.canaryEvidence.candidateTotal, afterCall.canaryEvidence.baselineTotal],
    [92, 100],
  );
  return true;
}
export function validatePipelineUpgrade() {
  assert.deepEqual(pipelineOffline(HAND_FAIL), {
    positives: 2,
    hits: 1,
    recall: 0.5,
    cost: 96,
    base: 100,
    delta: 96 / 100 - 1,
    pass: false,
  });
  const trained = pipelineOffline(passingEvaluation);
  assert.equal(trained.cost, 4);
  assert.equal(trained.base, 50);
  assert.equal(trained.recall, 1);
  assert(trained.pass);
  assert.equal(pipelineOffline([]).recall, null);
  assert.equal(pipelineOffline([]).delta, null);
  assert(!pipelineOffline([]).pass);
  const scans = [
    {
      entity: 'eval-1',
      observed: '2026-05-28T10:00:00Z',
      available: '2026-05-28T11:00:00Z',
      value: 9,
    },
    {
      entity: 'eval-1',
      observed: '2026-05-28T11:30:00Z',
      available: '2026-05-28T12:30:00Z',
      value: 99,
    },
    {
      entity: 'eval-1',
      observed: '2026-05-28T13:00:00Z',
      available: '2026-05-28T13:01:00Z',
      value: 100,
    },
  ];
  assert.equal(admittedFeature(scans, '2026-05-28T12:00:00Z', 'eval-1').value, 9);
  assert.throws(
    () =>
      admittedFeature(
        [
          ...scans,
          {
            ...scans[0],
            observed: '2026-05-28T10:00:00+00:00',
          },
        ],
        '2026-05-28T12:00:00Z',
        'eval-1',
      ),
    /ambiguous/,
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((n) => freshPipelineState(n).decision.action),
    ['hold_promotion', 'hold_promotion', 'hold_promotion', 'promote'],
  );
  assert.deepEqual(
    [1, 2, 3].map((n) => freshPipelineState(n).probe.warning),
    [false, false, true],
  );
  const ready = pipelinePromotionFixture();
  assert.equal(
    pipelinePromotionDecision({
      ...ready,
      production: 'v1',
    }).action,
    'hold_promotion',
  );
  const changed = pipelinePromotionFixture();
  changed.retained.v1.bytes += ' ';
  assert(pipelinePromotionDecision(changed).reasons.includes('model_reload_failed'));
  return true;
}
