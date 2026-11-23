import { sum } from './arithmetic.mjs';
import { ids, scans } from './fixtures.mjs';
import { estimate, freshOrder, noonOrder, propose, scanAt } from './shipment.mjs';
import { costSnapshot, sampleModel } from './construction.mjs';
import { admitted, decisions, historySummary } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal((noonOrder.doorstep - noonOrder.promise) * 60, 30);
  assert.equal(scanAt(scans, 12).age, 1);
  const earlierHubReport = scans.map((row) =>
    row.name === 'Hub scan' ? { ...row, available: 11.75 } : row,
  );
  assert.equal(scanAt(earlierHubReport, 12).age, 0.5);
  assert.equal(propose(4, 12, 0.75, 0.4).reason, 'stale_backlog_features');
  assert.equal(propose(4, 7, 0.75, 0.4).reason, 'late_risk_threshold');
  assert.equal(propose(31, 2, 0.81, 0.4).reason, 'stale_scan_features');
  const freshScan = scanAt(freshOrder.scans, freshOrder.snapshot);
  assert.equal(freshScan.age, 1.5);
  assert.deepEqual(estimate(freshOrder.pickup, freshOrder.durations), {
    median: 11,
    arrival: '20:00',
    first: '15:00',
    last: '01:00',
  });
  for (const [cutoff, reason] of [
    [0.4, 'late_risk_threshold'],
    [0.6, 'below_threshold'],
  ]) {
    assert.equal(
      propose(freshScan.age, freshOrder.backlogAge, freshOrder.risk, cutoff).reason,
      reason,
    );
  }
  assert.equal(costSnapshot(0, 0.9).ageRows[0].warn, false);
  assert.equal(costSnapshot(1, 0.5).candidateTotal, 8);
  assert.equal(costSnapshot(1, 0).candidatePriced, 0);
  assert.equal(admitted(12).length, 1);
  assert.equal(admitted(12.5).length, 2);
  assert.equal(sum(decisions(0.4).map((row) => row.penalty)), 8);
  assert.equal(sum(decisions(0, true).map((row) => row.penalty)), 150);
  assert.equal(sum(decisions(0.8).map((row) => row.penalty)), 210);
  assert.equal(
    sampleModel('history', {
      beat: 1,
      beatP: 0,
    }).median,
    11,
  );
  for (const [count, latest] of [
    [1, '18:00'],
    [2, '20:00'],
    [3, '22:00'],
    [4, '00:00'],
  ]) {
    assert.deepEqual(historySummary([8, 10, 12, 14].slice(0, count)), {
      count,
      earliest: '18:00',
      latest,
    });
  }
  for (const id of ids)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.08, 0.4, 0.8, 0.999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert(s.rows.every((row) => row.warn === row.risk >= s.threshold));
        assert.equal(s.penalty, sum(s.rows.map((row) => row.penalty)));
      }
  return true;
}
