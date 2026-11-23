import assert from 'node:assert/strict';
import { opening, generator, traffic } from './load.mjs';
import { stream, chunksScene } from './stream.mjs';
import { accounting, sweep, statistics, closing } from './decisions.mjs';
import {
  cohort,
  rates,
  tokenTimes,
  comparisonTokenTimes,
  desk,
  counts,
  lagLimit,
  averageResidenceMs,
  timedArrivalsMs,
  meanInFlight,
  inFlightAt,
  rowAtSend,
  servingRequestMetrics,
  fixedPlayback,
  alternative,
  chunks,
  screenAt,
  scored,
  missing,
  unsent,
  chosen,
  poolSize,
  observedBudget,
  strictBudget,
  replicaEstimate,
  paced,
  clumped,
  lifetimeMs,
  scheduleSpans,
  slotProbeMs,
  spansAt,
  pool,
  worst,
  nearestRank,
  wilsonLower,
  fresh,
  freshReplay,
  servingReceipt,
} from './samples.mjs';

const scenes = [
  opening,
  generator,
  traffic,
  stream,
  chunksScene,
  accounting,
  sweep,
  statistics,
  closing,
];

function check() {
  for (const [ms, n] of [
    [0, 1],
    [333, 1],
    [334, 2],
    [667, 3],
    [1999, 6],
    [2000, 6],
  ]) {
    assert.deepEqual(desk(ms, true), { due: n, sent: n, waiting: n - 1 });
    assert.deepEqual(desk(ms, false), { due: n, sent: 1, waiting: 0 });
  }
  assert.deepEqual(
    cohort.map((r) => r.scheduled),
    [0, 120, 700, 760, 800, 1900],
  );
  for (const [sent, lag, ttft, pass] of [
    [765, 5, 285, true],
    [780, 20, 270, true],
    [781, 21, 269, false],
    [800, 40, 250, false],
  ]) {
    const row = rowAtSend(sent),
      m = servingRequestMetrics(row);
    assert.deepEqual(
      [row.scheduled, row.sent, row.tokens[0], m.lag, m.ttft, m.lag + m.ttft, m.lag <= lagLimit],
      [760, sent, 1050, lag, ttft, 290, pass],
    );
  }
  assert.equal(meanInFlight(0, 3000).toFixed(2), '2.70');
  for (const [arrivals, lifetime, lanes] of [
    [paced, lifetimeMs, [0, 0, 0, 0, 0, 0]],
    [clumped, lifetimeMs, [0, 1, 0, 1, 2, 0]],
    [clumped, 10, [0, 0, 0, 0, 0, 0]],
  ]) {
    const spans = scheduleSpans(arrivals, lifetime);
    assert.deepEqual(spans.map((s) => s.lane), lanes);
    assert.deepEqual(spans.map((s) => s.end - s.start), arrivals.map(() => lifetime));
  }
  const replaySpans = scheduleSpans(clumped, lifetimeMs);
  assert.equal(slotProbeMs, 800);
  assert.deepEqual(spansAt(replaySpans, slotProbeMs, false).map((s) => s.start), [700, 760]);
  assert.deepEqual(spansAt(replaySpans, slotProbeMs, true).map((s) => s.start), [700, 760, 800]);
  assert.equal(spansAt(scheduleSpans(paced, lifetimeMs), slotProbeMs, true).length, 1);
  assert.equal(spansAt(replaySpans, 850, true).length, 2);
  for (const t of [0, 233, 1200, 2000, 2999]) {
    const visible = timedArrivalsMs.filter(
      (start) => start < 3000 && start + averageResidenceMs > 0,
    );
    assert.equal(
      inFlightAt(t),
      visible.filter((start) => start <= t && t < start + averageResidenceMs).length,
    );
  }
  assert.deepEqual(counts(cohort, 2000), { scheduled: 6, sent: 6, completed: 5, pending: 1 });
  assert.deepEqual(counts(cohort, 2500), { scheduled: 6, sent: 6, completed: 6, pending: 0 });
  const m = servingRequestMetrics(cohort[0]);
  assert.deepEqual([m.ttft, m.tpot, cohort[0].terminal - cohort[0].sent], [240, 60, 500]);
  assert.deepEqual(
    tokenTimes.slice(1).map((v, i) => v - tokenTimes[i]),
    [40, 40, 120, 40],
  );
  assert.equal(servingRequestMetrics(cohort[1]).tpot, null);
  assert.equal(servingRequestMetrics(cohort[1]).ttft, 170);
  assert.deepEqual(fixedPlayback(tokenTimes).late, [0, 0, 0, 0, 0]);
  assert.deepEqual(fixedPlayback(comparisonTokenTimes).late, [0, 0, 0, 40, 0]);
  assert.equal(fixedPlayback(comparisonTokenTimes).meanTpot, 80);
  assert.deepEqual(chunks(tokenTimes), [
    { ms: 320, word: 'The answer is' },
    { ms: 480, word: ' 42.' },
  ]);
  assert.deepEqual(chunks(alternative), chunks(tokenTimes));
  for (const t of [159, 160, 239, 240, 319, 320, 479, 480, 500]) {
    assert.equal(screenAt(t, alternative), screenAt(t));
    assert.equal(screenAt(t), t < 320 ? '' : t < 480 ? 'The answer is' : 'The answer is 42.');
  }
  assert.deepEqual(
    cohort.filter((r) => servingRequestMetrics(r).qualified).map((r) => r.id),
    ['r01', 'r02', 'r04'],
  );
  assert.deepEqual(scored(missing), { exit: 1, report: null });
  for (const [rows, exit] of [
    [cohort, 0],
    [unsent, 2],
  ]) {
    const result = scored(rows),
      v = result.report;
    assert.equal(result.exit, exit);
    assert.deepEqual(
      [
        v.offered,
        v.success,
        v.qualified,
        v.horizon,
        v.attainment,
        v.offeredRps,
        v.successRps,
        v.qualifiedRps,
      ],
      [6, 5, 3, 2500, 0.5, 3, 2, 1.2],
    );
  }
  assert.deepEqual(
    rates.map((r) => [Math.round(r.attainment * 200), r.maxLag, r.backlog]),
    [
      [200, 8, 'flat'],
      [200, 9, 'flat'],
      [190, 11, 'flat'],
      [160, 12, 'growing'],
      [116, 16, 'growing'],
    ],
  );
  assert.equal(poolSize, 3);
  assert.deepEqual(observedBudget, { admittedRps: 1.5, active: 15, perReplica: 5, replicas: 20 });
  assert.deepEqual(strictBudget, { admittedRps: 1, active: 10, perReplica: 10 / 3, replicas: 30 });
  const fewerAdmitted = replicaEstimate(chosen.rps, 190);
  assert.deepEqual([fewerAdmitted.admittedRps, fewerAdmitted.active, fewerAdmitted.replicas], [1.425, 14.25, 22]);
  assert.deepEqual(
    [
      [190, 200],
      [200, 200],
      [20, 20],
    ].map(([x, n]) => (100 * wilsonLower(x, n)).toFixed(1)),
    ['91.8', '98.7', '88.1'],
  );
  assert.deepEqual([nearestRank(pool, 0.95), nearestRank(worst, 0.95)], [1, 100]);
  const final = servingReceipt(fresh, [0, 2500]);
  for (const [sent, lag, ttft, exit] of [
    [300, 0, 100, 0],
    [320, 20, 80, 0],
    [321, 21, 79, 2],
    [345, 45, 55, 2],
  ]) {
    const v = freshReplay(sent);
    assert.deepEqual(
      [
        v.row.scheduled,
        v.row.tokens[0],
        v.metrics.lag,
        v.metrics.ttft,
        v.exit,
        v.receipt.qualified,
        v.receipt.attainment,
      ],
      [300, 400, lag, ttft, exit, 6, 0.75],
    );
  }
  assert.deepEqual(
    [
      final.offered,
      final.success,
      final.qualified,
      final.horizon,
      final.attainment,
      final.offeredRps,
      final.successRps,
      final.qualifiedRps,
      final.capacity,
    ],
    [8, 7, 6, 4000, 0.75, 3.2, 1.75, 1.5, null],
  );
  return true;
}
export default {
  title: 'Measuring the Experience of a Model Server',
  draw(c, clock) {
    scenes[clock.beat.chapterIndex](c, clock);
  },
  check,
};
