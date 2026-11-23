import { alphaUpdate, conformalRank, expectedDiscreteLoss, mae, pinball } from './arithmetic.mjs';
import {
  FORECAST_ROWS,
  actual,
  alertStatuses,
  confusion,
  errors,
  folds,
  intervalErrors,
  intervalHalfWidth,
  residualCues,
  splitTestDays,
  weeklyLagForecast,
} from './fixtures.mjs';
import { quietPeriodRevealOpacity, residualSnapshot } from './construction.mjs';
import {
  alertStateTrace,
  alertUsefulnessCells,
  diagonalProjection,
  forecastComparisonGeometry,
  intervalCalibrationGeometry,
  patchContract,
  seasonalDescription,
  stateTrace,
  weeklyLookup,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(errors, [-1, 3, -2, 1, 28, 1, -1]);
  assert.equal(Math.round(mae(errors) * 10) / 10, 5.3);
  assert.equal(Math.round(mae(errors.slice(0, 4).concat(errors.slice(5))) * 10) / 10, 1.5);
  assert.equal(Math.round(mae([25, 10, 4, 0, 43, -76, -7]) * 10) / 10, 23.6);
  assert.equal(Math.round(mae(folds[0]) * 10) / 10, 0.9);
  assert.equal(errors[4], actual[4] - weeklyLagForecast[4]);
  assert.equal(errors[4], 28);
  assert.equal(
    Math.round((errors.reduce((sum, value) => sum + value, 0) / errors.length) * 10) / 10,
    4.1,
  );
  assert.equal(
    errors.reduce((sum, value) => sum + Math.abs(value), 0),
    37,
  );
  assert.equal(intervalHalfWidth, 3);
  assert.equal(Math.ceil(0.95 * intervalErrors.length), 14);
  assert.equal(intervalErrors.filter((value) => Math.abs(value) <= intervalHalfWidth).length, 14);
  assert.equal(errors.filter((value) => Math.abs(value) <= intervalHalfWidth).length, 6);
  assert.equal(132 - intervalHalfWidth, 129);
  assert.equal(132 + intervalHalfWidth, 135);
  assert(
    splitTestDays.has(6) && !splitTestDays.has(31),
    'the shuffled split fixture must put Jan 6 in test and Jan 31 in training',
  );
  assert.equal(alertStatuses[0], 'breach');
  assert.equal(alertStatuses[1], 'breach');
  assert.equal(alertStatuses[2], 'missing');
  assert.deepEqual(alertStatuses.slice(3), ['clean', 'clean']);
  const comparison = forecastComparisonGeometry();
  assert.equal(comparison.forecast, 132);
  assert.equal(comparison.observed, 160);
  assert.equal(comparison.difference, 28);
  assert.equal(comparison.forecastHeight, 330);
  assert.equal(comparison.observedHeight, 400);
  assert.equal(comparison.forecastTop, 500);
  assert.equal(comparison.observedTop, 430);
  assert(comparison.observedHeight > comparison.forecastHeight);
  assert.equal(comparison.forecastLabel, 'forecast · 132');
  assert.equal(comparison.observedLabel, 'observed · 160');
  const interval = intervalCalibrationGeometry();
  assert.equal(interval.observed, 160);
  assert.equal(interval.markerLabel, 'Friday actual 160');
  assert.equal(interval.lower, 129);
  assert.equal(interval.upper, 135);
  assert(
    interval.markerX > interval.x1,
    'the observed Friday point must stay outside the forecast band',
  );
  assert.equal(confusion.tp / (confusion.tp + confusion.fp), 2 / 3);
  assert.equal(confusion.tp / (confusion.tp + confusion.fn), 2 / 3);
  assert.equal((confusion.tp / (confusion.tp + confusion.fp)).toFixed(3), '0.667');
  assert.equal((confusion.tp / (confusion.tp + confusion.fn)).toFixed(3), '0.667');
  assert.deepEqual(
    alertUsefulnessCells().map((cell) => cell.count),
    [2, 1, 1, 1],
  );
  assert.equal(
    alertUsefulnessCells().reduce((sum, cell) => sum + cell.count, 0),
    5,
  );
  assert.equal(quietPeriodRevealOpacity(0, 0.88), 0);
  assert.equal(quietPeriodRevealOpacity(1, 0.88), 0);
  assert.equal(quietPeriodRevealOpacity(2, 0), 0);
  assert(quietPeriodRevealOpacity(2, 0.12) > 0 && quietPeriodRevealOpacity(2, 0.12) < 1);
  assert.equal(quietPeriodRevealOpacity(2, 0.33), 1);
  assert.equal(quietPeriodRevealOpacity(2, 0.88), 1);
  const earlyErrors = residualSnapshot(0, 0.5);
  assert.deepEqual(
    earlyErrors.bars.map((bar) => bar.height),
    [10, 30, 20, 10, 280, 10, 10],
  );
  assert.equal(earlyErrors.bars[4].opacity, 0);
  assert.equal(earlyErrors.meanVisible, false);
  for (const progress of [0, 0.12, 0.5, 0.88, 1]) {
    const snapshot = residualSnapshot(1, progress);
    assert.equal(snapshot.bars[4].height / snapshot.bars[1].height, 28 / 3);
    assert.equal(
      snapshot.absoluteSum,
      errors.slice(0, snapshot.collected).reduce((sum, value) => sum + Math.abs(value), 0),
    );
    assert(snapshot.bars.every((bar) => bar.opacity === 1));
  }
  const beforeAdd = residualSnapshot(
    1,
    (residualCues.addStart - 0.001) / residualCues.beatSpans[1],
  );
  assert.equal(beforeAdd.collected, 0);
  assert.equal(beforeAdd.absoluteSum, 0);
  const afterAdd = residualSnapshot(1, (residualCues.addEnd + 0.001) / residualCues.beatSpans[1]);
  assert.equal(afterAdd.collected, 7);
  assert.equal(afterAdd.absoluteSum, 37);
  assert.equal(afterAdd.meanVisible, false);
  assert.equal(residualSnapshot(1, 0.88).meanVisible, true);
  const alertTrace = alertStateTrace(alertStatuses);
  assert.deepEqual(
    alertTrace.map((step) => step.active),
    [false, true, true, true, false],
  );
  assert.deepEqual(
    alertTrace.map((step) => step.status),
    ['breach', 'breach', 'missing', 'clean', 'clean'],
  );
  assert.equal(alertTrace[2].active, alertTrace[1].active);
  assert.equal(alertTrace[2].breachRun + alertTrace[2].cleanRun, 0);
  assert.equal(alertTrace[3].active, true);
  assert.equal(alertTrace[4].active, false);
  validateExpandedForecast();
  return true;
}
export function validateExpandedForecast() {
  assert.deepEqual(
    FORECAST_ROWS.slice(14, 21).map((r) => r.volume),
    weeklyLagForecast,
  );
  assert.deepEqual(
    FORECAST_ROWS.slice(21).map((r) => r.volume),
    actual,
  );
  assert.deepEqual(
    FORECAST_ROWS.slice(21).map((_, i) => weeklyLookup(i + 21).value),
    weeklyLagForecast,
  );
  assert.equal(weeklyLookup(27, 20).value, 78);
  assert.throws(() => weeklyLookup(28, 20), /observed matching day/);
  assert.equal(FORECAST_ROWS[14].volume, 104);
  assert.equal(seasonalDescription(120).additive, 147);
  assert(Math.abs(seasonalDescription(120).proportional - 150.857142857) < 1e-8);
  assert.deepEqual(patchContract(), {
    lookback: 336,
    length: 16,
    stride: 8,
    unpadded: 41,
    tokens: 42,
    originalEntries: 112896,
    patchedEntries: 1764,
    mapRatio: 64,
  });
  assert.equal(patchContract(256).mapRatio, 64);
  assert.equal(pinball(110, 100, 0.9), 9);
  assert(Math.abs(pinball(90, 100, 0.9) - 1) < 1e-12);
  for (const p of [10, 19, 40, 100]) assert(Math.abs(expectedDiscreteLoss(p) - 8.1) < 1e-12);
  assert.equal(conformalRank(14).finite, false);
  assert.equal(conformalRank(19).finite, true);
  assert.equal(alphaUpdate(0.1, 0.1, 0.05, 1), 0.055);
  const trace = stateTrace([4, 5, null, 4, 2, 4, 0, -1]);
  assert.deepEqual(
    trace.filter((r) => r.transition).map((r) => [r.minute, r.transition]),
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
  assert.equal(diagonalProjection([1, -1]).score, 2);
  assert.equal(diagonalProjection([5, 5]).score, 0);
  return true;
}
