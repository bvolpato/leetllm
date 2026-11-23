import {
  CONTEXT_LIMIT,
  DASHBOARD,
  MAX_PREFIX,
  TEXT_STATE,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
} from './fixtures.mjs';
import { attentionConstruction, budgetSnapshot, freshIncidentState } from './construction.mjs';
import { originalKey, risingRow, secondKey } from './chart-reading.mjs';
import {
  TRACKS,
  attentionStates,
  cacheWorkAt,
  chartEvidence,
  cropSelection,
  crossAttentionFixture,
  eventOrder,
  fusionScoreFixture,
  prefixPlan,
  releaseBlockers,
  sceneSnapshots,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.deepEqual(attentionConstruction(2, 9.99 / 14.092).fused, TEXT_STATE);
  assert.equal(attentionConstruction(0, 7 / 13.368).divide, 0);
  assert.equal(attentionConstruction(1, 3.99 / 14.57).normalize, 1);
  assert(attentionConstruction(1, 6 / 14.57).attended[0] < crossAttentionFixture(0).attended[0]);
  assert.deepEqual(attentionConstruction(2, 1).fused, crossAttentionFixture(0.35).fused);
  const evidence = chartEvidence();
  assert.deepEqual(evidence.points, [
    {
      x: 3,
      y: 5.2,
    },
    {
      x: 4,
      y: 6.4,
    },
    {
      x: 5,
      y: 7.7,
    },
    {
      x: 6,
      y: 9,
    },
  ]);
  assert.equal(evidence.name, 'Line B');
  assert.deepEqual([originalKey[risingRow], secondKey[risingRow]], ['Checkout', 'Search']);
  for (const series of DASHBOARD.series) {
    assert.equal(series.values.length, DASHBOARD.hours.length);
    assert(series.values.every((value) => value >= 0 && value <= 10));
  }
  const fixed = budgetSnapshot(0, 1);
  assert.equal(CONTEXT_LIMIT - fixed.total, 1596);
  const two = budgetSnapshot(1, 1);
  assert.equal(two.views.length, 2);
  assert.equal(CONTEXT_LIMIT - two.total, 444);
  const third = budgetSnapshot(2, 0, {
    'budget-third-view': { progress: 1 },
    'budget-five-views': { progress: 0 },
  });
  assert.equal(third.views.length, 3);
  assert.equal(third.fits, false);
  assert.equal(budgetSnapshot(2, 1).total, 5380);
  for (let i = 0; i <= 5; i++) {
    const step = budgetSnapshot(3, 0, { 'budget-reduce': { progress: i / 5 } });
    assert.equal(step.visualTokens, (5 - i) * 576 + i * 32);
    assert.equal(step.total, step.visualTokens + 2500);
    assert.equal(step.fits, step.total <= CONTEXT_LIMIT);
  }
  assert.equal(budgetSnapshot(3, 1).total, 2660);
  assert.equal(VISUAL_TOKENS_224, 256);
  assert.equal(VISUAL_TOKENS_336, 576);
  assert.equal(MAX_PREFIX, 3796);
  const full = prefixPlan(VISUAL_TOKENS_336);
  const reduced = prefixPlan(32);
  assert.deepEqual([full.visualTokens, full.prefix, full.fits], [2880, 5080, false]);
  assert.deepEqual(
    [reduced.visualTokens, reduced.prefix, reduced.total, reduced.fits],
    [160, 2360, 2660, true],
  );
  assert.equal(attentionStates[0].fused.join(','), TEXT_STATE.join(','));
  assert(Math.abs(attentionStates[2].gateStrength - 0.336) < 0.001);
  assert.deepEqual(
    attentionStates[2].weights.map((value) => Number(value.toFixed(3))),
    [0.384, 0.317, 0.299],
  );
  assert.deepEqual(
    attentionStates[2].fused.map((value) => Number(value.toFixed(3))),
    [0.308, 0.191, 0.837],
  );
  assert(Math.abs(attentionStates[0].weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  for (const [sceneId, snapshots] of Object.entries(sceneSnapshots)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      for (const beatP of [0, 0.25, 0.5, 0.99])
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP,
          }).snapshot,
          snapshots[beat],
        );
    }
  }
  return true;
}
export function validateExpandedModel() {
  assert.equal(fusionScoreFixture().score, 0.6);
  assert.deepEqual(
    [1, 2, 3].reduce(
      (a, v, i) => [
        a[0] +
          v *
            [
              [1, 0],
              [0, 1],
              [1, -1],
            ][i][0],
        a[1] +
          v *
            [
              [1, 0],
              [0, 1],
              [1, -1],
            ][i][1],
      ],
      [0, 0],
    ),
    [4, -1],
  );
  assert.equal(eventOrder([105, 135], [90, 270]), 'unresolved');
  assert.equal(eventOrder([105, 135], [170, 190]), 'after');
  assert.equal(eventOrder([100, 120], [120, 140]), 'unresolved');
  const f = freshIncidentState(0);
  assert.equal(f.direct.total, 6152);
  assert.equal(f.reduced.total, 2184);
  assert.equal(f.reduced.kvMiB, 273);
  assert(!f.revealDirect && !f.revealReduced && !f.revealCache && !f.evidenceReady);
  assert.deepEqual(
    cacheWorkAt('projected')
      .filter((x) => x.required)
      .map((x) => x.name),
    ['shared-prefix prefill', 'question prefill', 'decode'],
  );
  assert.deepEqual(cropSelection(3), ['global', 'axis', 'badge']);
  assert.deepEqual(cropSelection(2), ['global', 'axis']);
  assert.equal(freshIncidentState(2).order, 'after');
  assert.equal(freshIncidentState(3, { correction: true }).order, 'unresolved');
  assert.deepEqual(
    releaseBlockers({
      helpfulness: 0.91,
      OCR: 0.72,
      IoU: 0.68,
    }),
    ['OCR'],
  );
  assert.deepEqual(
    releaseBlockers({
      helpfulness: 0.9,
      OCR: NaN,
      IoU: 0.7,
    }),
    ['OCR'],
  );
  assert.deepEqual(
    releaseBlockers({
      helpfulness: 0.9,
      OCR: true,
      IoU: 0.7,
    }),
    ['OCR'],
  );
  assert.equal(2360 ** 2, 5569600);
  assert.equal(2200 * 160, 352000);
  assert.equal(2200 ** 2, 4840000);
  assert.equal((2880 * 131072) / 2 ** 20, 360);
  assert.equal((160 * 131072) / 2 ** 20, 20);
  assert.equal((2660 * 131072) / 2 ** 20, 332.5);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  validateExpandedModel();
  return true;
}
