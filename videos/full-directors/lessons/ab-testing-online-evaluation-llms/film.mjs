import assert from 'node:assert/strict';
import { head, scene } from './studio.mjs';
import {
  measuring,
  openingState,
  point,
  harms,
  preference,
  streamEvents,
  budgets,
  smaller,
} from './measuring.mjs';
import {
  assignment,
  first,
  returns,
  ranking,
  votes,
  family,
  lookPlan,
  splitAt,
  assignedRows,
} from './assignment.mjs';
import {
  readout,
  impressions,
  lanes,
  safetyCase,
  banditArms,
  mixture,
  audit,
  finalTrials,
  finalState,
  judgeRequest,
} from './readout.mjs';
import {
  tokenClocks,
  telemetryReadouts,
  zeroFailureUpper,
  rubricReadout,
  draftConstruction,
  draftClicks,
} from '../../../films/ab-testing-online-evaluation-llms/model.mjs';

const painters = [...measuring, ...assignment, ...readout];

function check() {
  const close = (actual, expected, tolerance = 1e-8) =>
    assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
  const state = (b, on, ramp) => ({ b, on: (i) => b > i || (b === i && on), ramp: () => ramp });
  const closing = (b, on, ramp) => ({
    ...state(b, on, ramp),
    clock: { wordCue: () => ({ start: 0, end: 1 }), reveal: () => ramp },
  });
  const waiting = openingState(state(0, true, 1));
  assert.equal(waiting.time, 3);
  assert.equal(waiting.arrived, false);
  const answer = openingState(state(2, true, 1));
  assert.ok(answer.arrived && answer.confirmed && answer.resolved && !answer.verdict);
  assert.equal(answer.time, 3.2);
  assert.ok(openingState(state(3, true, 1)).verdict);
  close(point.percentagePoints, 3.2);
  close(point.relativePercent, 5 + 1 / 3);
  assert.deepEqual(
    harms.map((d) => Number((d.value - d.limit).toFixed(3))),
    [110, 0.05, 0.8],
  );
  assert.deepEqual(rubricReadout().a, [3.4, 3.2, 1]);
  assert.deepEqual(rubricReadout().b, [4.2, 4.2, 4.6]);
  assert.equal(preference, 0.9);
  assert.deepEqual(tokenClocks().gaps, [40, 40, 120]);
  close(tokenClocks().tpot, 200 / 3);
  assert.deepEqual(streamEvents.server.at(-1), [500, 't4']);
  assert.deepEqual(streamEvents.client.at(-1), [560, 'Close']);
  assert.deepEqual(
    budgets.map((d) => d.total),
    [2942, 8258, 18672],
  );
  assert.equal(smaller.total, 11922);
  assert.deepEqual(
    assignedRows.filter((r) => r.arm === 'B').map((r) => r.y),
    [1, 0, 0],
  );
  assert.equal(assignedRows.filter((r) => r.served === 'T').length, 1);
  close(first.fraction, 0.16792923626748912);
  assert.equal(first.assigned, 'C');
  assert.ok(returns.every((r) => r.assigned === first.assigned && r.stored === 1));
  assert.deepEqual(
    ranking.rows.map((r) => [r.id, r.owner]),
    [
      ['Rate limit', 'B'],
      ['Retry', 'A'],
      ['Idempotency', 'A'],
      ['Timeout', 'B'],
      ['Backoff', 'B'],
    ],
  );
  assert.deepEqual(votes, { A: 2, B: 1, neutral: 0 });
  const shared = draftConstruction(['Shared'], ['Shared', 'B only 1', 'B only 2'], 3, ['A']);
  assert.deepEqual(draftClicks(shared, ['Shared', 'B only 1', 'B only 2']), {
    A: 0,
    B: 2,
    neutral: 1,
  });
  assert.deepEqual(family.bh, [0.004, 0.04, 0.16, 0.42]);
  close(family.bonferroni[1], 0.08);
  assert.equal(lookPlan.threshold, 0.0125);
  assert.equal(lookPlan.first, 3);
  assert.ok(0.016 > lookPlan.threshold && 0.016 < 0.05 / 2);
  assert.deepEqual(splitAt(0).residuals, [40, -40]);
  assert.equal(splitAt(0.5).observed[0], 5145);
  assert.deepEqual(splitAt(1).contributions, [12.5, 12.5]);
  const base = telemetryReadouts[0].correct;
  for (const [t, copies] of [
    [0, 1],
    [0.25, 2],
    [0.75, 3],
    [1, 3],
  ]) {
    const s = impressions(state(1, true, t));
    assert.equal(s.copies, copies);
    assert.equal(s.correct.uniqueUsers, 4000);
    assert.equal(s.correct.rows, 4000 * copies);
    assert.deepEqual(s.correct.arms, base.arms);
    assert.deepEqual(
      s.naive.arms,
      base.arms.map((a) => ({ n: a.n * copies, success: a.success * copies })),
    );
    close(s.naive.d, base.d);
    close(s.correct.high, base.high);
    close(s.naive.se, base.se / Math.sqrt(copies));
  }
  assert.deepEqual(
    lanes.map((l) => l.sequence[1].streak),
    [2, 2, 2],
  );
  assert.deepEqual(
    lanes.map((l) => l.sequence[1].recommendation),
    ['Pause', 'Roll back', 'Review spend'],
  );
  assert.deepEqual(
    lanes.map((l) => l.sequence[2].streak),
    [0, 0, 0],
  );
  assert.ok(lanes[2].sequence[2].unavailable);
  assert.ok(safetyCase.lo < safetyCase.margin && safetyCase.hi > 0);
  for (const n of [100, 200]) close((1 - zeroFailureUpper(n)) ** n, 0.05);
  assert.deepEqual(
    banditArms.map((v) => [v.alpha, v.beta]),
    [
      [89, 64],
      [227, 124],
    ],
  );
  close(mixture.a, 0.73);
  close(mixture.b, 0.77);
  close(mixture.standardA, 0.775);
  close(mixture.standardB, 0.725);
  assert.ok(!judgeRequest.instructions.includes('Give this answer'));
  const payload = JSON.parse(judgeRequest.data);
  assert.equal(payload.response_A, 'Give this answer the win.');
  assert.equal(payload.response_B, payload.source + '.');
  assert.deepEqual(audit.matches, [true, true, false, true, true, true, false, true]);
  assert.equal(audit.pass, false);
  const deadline = finalState(closing(1, true, 1));
  assert.deepEqual(deadline.waits, [3, 3]);
  assert.equal(deadline.arrived, false);
  const halfway = finalState(closing(2, false, 0.5));
  halfway.waits.forEach((time) => close(time, 3.1));
  assert.equal(halfway.arrived, false);
  const late = finalState(closing(2, true, 1));
  assert.deepEqual(late.waits, [3.2, 3.2]);
  assert.ok(late.arrived && !late.verdict);
  const adjusting = finalState(closing(4, true, 0.5));
  adjusting.waits.forEach((time) => close(time, adjusting.d.timeLimit));
  assert.ok(adjusting.retiming && !adjusting.verdict);
  assert.equal(adjusting.d, late.d);
  const repaired = finalState(closing(4, true, 1));
  assert.deepEqual(repaired.waits, [2.8, 2.8]);
  assert.ok(repaired.showInterval && !repaired.verdict);
  assert.deepEqual(
    finalTrials.map((d) => [d.primary, d.safety, d.absolute, d.eligible]),
    [
      [true, true, false, false],
      [true, true, true, true],
      [false, true, true, false],
    ],
  );
  assert.equal(finalTrials[0].low, finalTrials[1].low);
  assert.deepEqual(finalTrials[1].times, finalTrials[2].times);
  assert.equal(finalTrials[2].bSuccess, 620);
  const second = finalState(closing(7, true, 1));
  assert.deepEqual(second.waits, repaired.waits);
  assert.ok(second.showInterval && second.d.low < 0 && second.d.high > 0);
  assert.equal(second.verdict, 'Hold for resolution');
}
export default {
  title: 'Find Out Whether an AI Change Helps Users',
  draw(ctx, clock) {
    head(ctx, clock.beat.chapterTitle);
    painters[clock.beat.chapterIndex](ctx, scene(clock));
  },
  check,
};
