import {
  BUS_ROUTE,
  REPLAN_ANSWER_PROGRESS,
  REPLAN_QUESTION_PROGRESS,
  VISIT_HOURS,
} from './fixtures.mjs';
import { contextLedger, submittedTokens, uctRows } from './arithmetic.mjs';
import {
  changedItinerary,
  nextAction,
  planSnapshot,
  reactTrace,
  ready,
  recommendationState,
  replanSnapshot,
  visitSchedule,
} from './model.mjs';
import { approvalReplay, dependencyState, recoveryVerdict } from './protocols.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateAgentConstruction();
  assert.equal(reactTrace(0, 0.759).observations.length, 0);
  assert.equal(reactTrace(0, 0.76).observations[0].callId, 'hours-17');
  assert.equal(reactTrace(0, 0.809).action, 'check-hours');
  assert.equal(reactTrace(0, 0.81).action, 'find-alternative');
  assert.deepEqual(visitSchedule(), {
    arrival: 875,
    finish: 965,
    deadline: 1020,
    visitMinutes: 90,
    feasible: true,
  });
  assert.equal(
    visitSchedule(VISIT_HOURS, {
      ...BUS_ROUTE,
      venue: 'Art',
    }).feasible,
    false,
  );
  assert.equal(
    visitSchedule(VISIT_HOURS, {
      ...BUS_ROUTE,
      day: 'tomorrow',
    }).feasible,
    false,
  );
  assert.equal(
    visitSchedule(VISIT_HOURS, {
      ...BUS_ROUTE,
      minutes: 150,
    }).feasible,
    false,
  );
  assert.equal(recommendationState(1, 0.399).ready, false);
  assert.equal(recommendationState(1, 0.4).ready, true);
  const late = recommendationState(2, 1, VISIT_HOURS, {
    ...BUS_ROUTE,
    minutes: 150,
  });
  assert.equal(late.arrival, 1000);
  assert.equal(late.finish, 1090);
  assert.equal(late.feasible, false);
  assert.equal(late.ready, false);
  assert.match(late.status, /18:10.*fail/);
  assert.doesNotMatch(late.recommendation, /16:05|Take the/);
  assert.match(recommendationState(2, 1).recommendation, /14:10.*16:05/);
  assert.equal(
    recommendationState(2, 1, VISIT_HOURS, {
      ...BUS_ROUTE,
      venue: 'Art',
    }).ready,
    false,
  );
  assert.equal(
    recommendationState(2, 1, VISIT_HOURS, {
      ...BUS_ROUTE,
      day: 'tomorrow',
    }).ready,
    false,
  );
  assert.equal(planSnapshot(0, 1).complete, false);
  assert.equal(planSnapshot(1, 0.9).complete, false);
  assert.equal(planSnapshot(2, 0.119).complete, false);
  assert.equal(planSnapshot(2, 0.12).complete, true);
  assert.equal(planSnapshot(2, 0.6).complete, true);
  assert.equal(replanSnapshot(1, 0.3).journeyValid, false);
  assert.equal(replanSnapshot(1, 0.8).journeyValid, true);
  const beforeQuestion = replanSnapshot(2, REPLAN_QUESTION_PROGRESS - 0.001),
    question = replanSnapshot(2, REPLAN_QUESTION_PROGRESS),
    prediction = replanSnapshot(2, (REPLAN_QUESTION_PROGRESS + REPLAN_ANSWER_PROGRESS) / 2),
    beforeAnswer = replanSnapshot(2, REPLAN_ANSWER_PROGRESS - 0.001),
    answer = replanSnapshot(2, REPLAN_ANSWER_PROGRESS),
    replacement = replanSnapshot(2, 0.8);
  assert.equal(beforeQuestion.cancelled, true);
  assert.equal(beforeQuestion.predictionAsked, false);
  assert.equal(beforeQuestion.decisionLabel, 'Decision pending');
  assert.equal(beforeQuestion.footer, 'Check each result against its resource identity');
  assert.equal(question.predictionAsked, true);
  assert.equal(question.decisionText, 'Which receipt remains useful?');
  assert.equal(question.footer, 'Predict which dependency the cancellation invalidates');
  assert.equal(prediction.answerRevealed, false);
  assert.equal(prediction.decisionLabel, 'Decision pending');
  assert.doesNotMatch(prediction.decisionText, /Preserve History hours/);
  assert.equal(prediction.footer, 'Predict which dependency the cancellation invalidates');
  assert.equal(beforeAnswer.answerRevealed, false);
  assert.equal(beforeAnswer.decisionLabel, 'Decision pending');
  assert.equal(beforeAnswer.footer, 'Predict which dependency the cancellation invalidates');
  assert.equal(answer.answerRevealed, true);
  assert.equal(answer.decisionLabel, 'Travel invalid: refresh');
  assert.equal(answer.decisionText, 'Preserve History hours; invalidate only the train journey');
  assert.equal(
    answer.footer,
    'Venue hours remain valid while the cancelled journey needs fresh evidence',
  );
  assert.equal(replacement.cancelled, false);
  assert.equal(replacement.journeyValid, true);
  assert.equal(replacement.decisionLabel, 'New route checked');
  assert.equal(replacement.footer, 'The replacement journey uses current History evidence');
  for (let step = 0; step <= 100; step++) {
    const p = step / 100,
      s = replanSnapshot(2, p);
    if (p < REPLAN_ANSWER_PROGRESS) assert.equal(s.answerRevealed, false);
    else assert.equal(s.answerRevealed, true);
    if (p >= 0.22 && p < 0.7) assert.equal(s.cancelled, true);
  }
  assert.equal(nextAction([]), 'check-hours');
  assert.equal(
    ready({
      hours: { venue: 'History', day: 'today', status: 'open' },
      journey: { venue: 'History', day: 'tomorrow', feasible: true },
    }),
    false,
  );
  assert.equal(
    nextAction([
      {
        status: 'closed',
      },
    ]),
    'find-alternative',
  );
  assert.equal(
    nextAction([
      {
        status: 'open',
      },
    ]),
    'check-journey',
  );
  assert(
    ready({
      hours: {
        venue: 'Art',
        status: 'open',
      },
      journey: {
        venue: 'Art',
        feasible: true,
      },
    }),
  );
  assert.equal(
    ready({
      hours: {
        venue: 'History',
        status: 'open',
      },
      journey: {
        venue: 'Art',
        feasible: true,
      },
    }),
    false,
  );
  assert.equal(
    ready({
      hours: {
        venue: 'Art',
        status: 'closed',
      },
      journey: {
        venue: 'Art',
        feasible: true,
      },
    }),
    false,
  );
  assert.equal(
    ready({
      hours: {
        venue: 'History',
        status: 'open',
      },
      journey: {
        venue: 'History',
        feasible: false,
      },
    }),
    false,
  );
  assert.deepEqual(submittedTokens(1000, 200, 4), [1000, 1200, 1400, 1600]);
  assert.equal(
    submittedTokens(1000, 200, 4).reduce((a, b) => a + b, 0),
    5200,
  );
}
export function validateAgentConstruction() {
  assert.deepEqual(
    contextLedger().calls,
    [2000, 3500, 5000, 6500, 8000, 9500, 11000, 12500, 14000, 15500],
  );
  assert.equal(contextLedger().total, 87500);
  assert.equal(contextLedger().read, 72000);
  assert.equal(contextLedger(2000, 1500, 10, 2).total, 45500);
  const r = {
    ci: {
      revision: 'c1842',
      until: 1200,
      version: 1,
    },
    diff: {
      revision: 'c1842',
      until: 1200,
      version: 1,
    },
    health: {
      revision: 'c1842',
      until: 1100,
      version: 1,
    },
    decision: {
      revision: 'c1842',
      until: 1200,
      version: 1,
      consumed: {
        ci: 1,
        diff: 1,
        health: 1,
      },
    },
  };
  assert.equal(dependencyState(r, 'c1842', 1099).valid.decision, true);
  assert.deepEqual(dependencyState(r, 'c1842', 1100).ready, ['health']);
  r.health = {
    ...r.health,
    until: 1200,
    version: 2,
  };
  assert.equal(dependencyState(r, 'c1842', 1100).valid.decision, false);
  assert.deepEqual(dependencyState(r, 'c1843', 1100).ready, ['ci', 'diff', 'health']);
  assert.deepEqual(
    uctRows().map((r) => r.score.toFixed(3)),
    ['1.373', '1.860', '2.246'],
  );
  assert.equal(
    uctRows(10, [
      {
        id: 'new',
        N: 0,
        W: 0,
      },
    ])[0].score,
    Infinity,
  );
  assert.equal(changedItinerary().finish, 1035);
  assert.equal(changedItinerary().feasible, false);
  assert.equal(changedItinerary(70).finish, 1015);
  assert.equal(changedItinerary(70).feasible, true);
  const request = {
    type: 'request',
    key: 'operation-17',
    actor: 'release-bot',
    release: 'R1842',
    revision: 'c1841',
  };
  assert.deepEqual(
    approvalReplay([
      request,
      request,
      {
        ...request,
        release: 'R2099',
      },
    ]).outcomes,
    ['created RB2041', 'replay RB2041', 'conflict'],
  );
  assert.equal(
    approvalReplay([
      request,
      {
        type: 'grant',
        allowed: false,
      },
      request,
    ]).records.length,
    1,
  );
  assert.equal(
    recoveryVerdict(
      {
        region: 'us-east',
        revision: 'def456',
        at: 990,
        p95: 200,
      },
      {
        approved: true,
      },
    ),
    'closed',
  );
  assert.equal(
    recoveryVerdict(
      {
        region: 'us-east',
        revision: 'def456',
        at: 940,
        p95: 120,
      },
      {
        approved: true,
      },
    ),
    'stale or future',
  );
  return true;
}
