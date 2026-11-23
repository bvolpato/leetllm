import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORECAST_ROWS,
  weeklyLookup,
  seasonalDescription,
  patchContract,
  pinball,
  expectedDiscreteLoss,
  conformalRank,
  alphaUpdate,
  stateTrace,
  diagonalProjection,
  deduplicateEvents,
  forecastCueProgress,
} from '../animations/forecasting.mjs';
test('dated weekly sources preserve observed values and reject a fixed-origin future read', () => {
  assert.deepEqual(
    FORECAST_ROWS.slice(14, 21).map((r) => r.volume),
    [104, 110, 119, 116, 132, 83, 78],
  );
  assert.deepEqual(
    FORECAST_ROWS.slice(21).map((r) => r.volume),
    [103, 113, 117, 117, 160, 84, 77],
  );
  assert.equal(weeklyLookup(27, 20).value, 78);
  assert.throws(() => weeklyLookup(28, 20), /observed matching day/);
  assert.equal(weeklyLookup(28, 21).value, 103);
});
test('changing the level separates additive and proportional geometry', () => {
  assert.equal(seasonalDescription(105).additive, seasonalDescription(105).proportional);
  assert.equal(seasonalDescription(120).additive, 147);
  assert(Math.abs(seasonalDescription(120).proportional - 150.85714285714286) < 1e-10);
});
test('patch padding changes token count and attention area independently of runtime', () => {
  assert.equal(patchContract(336, 16, 8, false).tokens, 41);
  assert.equal(patchContract().tokens, 42);
  assert.equal(patchContract().mapRatio, 64);
  assert.throws(() => patchContract(8), /contain one patch/);
});
test('pinball asymmetry and a flat minimizer interval survive fresh inputs', () => {
  assert.equal(pinball(120, 100, 0.8), 16);
  assert(Math.abs(pinball(80, 100, 0.8) - 4) < 1e-12);
  for (const prediction of [10, 19, 55, 100])
    assert(Math.abs(expectedDiscreteLoss(prediction) - 8.1) < 1e-12);
  assert(expectedDiscreteLoss(0) > 8.1);
  assert(expectedDiscreteLoss(101) > 8.1);
  assert.equal(conformalRank(14).finite, false);
  assert.equal(conformalRank(19).rank, 19);
  assert.equal(alphaUpdate(0.1, 0.1, 0.05, 1), 0.055);
});
test('missing breaks consecutive runs without clearing an active alert', () => {
  const first = stateTrace([4, 5, null, 4, 2, 4, 0, -1]);
  assert.equal(first[2].active, true);
  assert.equal(first[2].breaches + first[2].clean, 0);
  assert.deepEqual(
    first.filter((r) => r.transition).map((r) => [r.minute, r.transition]),
    [
      [5, 'review'],
      [35, 'clear'],
    ],
  );
  const fresh = stateTrace([5, null, 6, 7, 1, null, 0, -2]);
  assert.deepEqual(
    fresh.filter((r) => r.transition).map((r) => [r.minute, r.transition]),
    [
      [15, 'review'],
      [35, 'clear'],
    ],
  );
  assert.throws(() => stateTrace([true]), /Finite error/);
});
test('joint reconstruction and event identity expose independent blind spots', () => {
  assert.deepEqual(diagonalProjection([1, -1]), {
    point: [1, -1],
    reconstruction: [0, 0],
    score: 2,
    inside: true,
  });
  assert.equal(diagonalProjection([5, 5]).score, 0);
  const a = { event_id: 'e1', job_id: 'j1', type: 'started' },
    b = { ...a, job_id: 'j2' };
  assert.equal(deduplicateEvents([a, a]).duplicates, 1);
  const conflict = deduplicateEvents([a, b]);
  assert.equal(conflict.unique[0].job_id, 'j1');
  assert.equal(conflict.conflicts.length, 1);
});
test('current-scene result cues cannot silently fall back to early reveals', () => {
  assert.throws(
    () => forecastCueProgress({ cues: {} }, 'fc-fresh-state-entry'),
    /Missing current-scene/,
  );
  assert.equal(
    forecastCueProgress(
      { cues: { 'fc-fresh-state-entry': { progress: 0.4 } } },
      'fc-fresh-state-entry',
    ),
    0.4,
  );
  assert.throws(() => forecastCueProgress({}, 'invented'), /Unknown forecasting cue/);
});
test('interval endpoints and the Friday outlier use one linear job scale', async () => {
  const { intervalCalibrationGeometry } = await import('../animations/forecasting.mjs'),
    g = intervalCalibrationGeometry(),
    center = (g.x0 + g.x1) / 2;
  assert(
    Math.abs((g.markerX - center) / (g.x1 - g.x0) - (g.observed - 132) / (g.upper - g.lower)) <
      1e-10,
  );
});
