import { facts, good, nextTeamRule, spans } from './fixtures.mjs';
import { assembledResponse, clockElapsed, regressionState } from './construction.mjs';
import { freshIncidentContract, promptSections, responseChecks, triageDecision } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(triageDecision(facts), {
    action: 'page_on_call',
    deadline_minutes: 30,
    overdue: false,
    remaining: 18,
  });
  assert.equal(
    triageDecision({
      ...facts,
      elapsed: 30,
    }).overdue,
    false,
  );
  assert.equal(
    triageDecision({
      ...facts,
      elapsed: 31,
    }).overdue,
    true,
  );
  for (const f of [
    {
      ...facts,
      elapsed: true,
    },
    {
      ...facts,
      pageSent: null,
    },
    {
      ...facts,
      ruleAvailable: false,
    },
  ])
    assert.equal(triageDecision(f).action, 'needs_review');
  assert.deepEqual(responseChecks(JSON.stringify(good)), {
    parse: true,
    schema: true,
    policy: true,
    accepted: true,
  });
  assert.deepEqual(
    responseChecks(
      JSON.stringify({
        ...good,
        deadline_minutes: 90,
      }),
    ),
    {
      parse: true,
      schema: true,
      policy: false,
      accepted: false,
    },
  );
  assert.equal(responseChecks('{').parse, false);
  const newTeam = { ...facts, ...nextTeamRule };
  const fresh = freshIncidentContract(true, newTeam);
  const missing = freshIncidentContract(false, newTeam);
  assert.deepEqual(fresh.fields, {
    action: 'page_on_call',
    deadline_minutes: 45,
    overdue: false,
    source_line_ids: ['IR-9'],
  });
  assert.deepEqual(missing.fields, {
    action: 'needs_review',
    deadline_minutes: null,
    overdue: null,
    source_line_ids: [],
  });
  for (const incident of [fresh, missing]) {
    assert.equal(responseChecks(JSON.stringify(incident.fields), incident.facts).accepted, true);
  }
  assert.equal(responseChecks(JSON.stringify(fresh.fields), missing.facts).policy, false);
  assert.equal(responseChecks(JSON.stringify(missing.fields), fresh.facts).policy, false);
  assert.equal(triageDecision({ ...fresh.facts, sourceId: undefined }).action, 'needs_review');
  assert.equal(
    responseChecks(
      JSON.stringify({
        ...good,
        overdue: 'false',
      }),
    ).schema,
    false,
  );
  assert.equal(
    responseChecks(
      JSON.stringify({
        ...good,
        source_line_ids: ['IR-9'],
      }),
    ).policy,
    false,
  );
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    const r = assembledResponse(0, p);
    if (!r.complete) assert.equal(r.checks.parse, false);
    assert.equal(assembledResponse(1, p).complete, true);
    assert.equal(assembledResponse(1, p).checks.accepted, true);
  }
  assert.equal(assembledResponse(2, 1.6 / spans.wrong).checks.accepted, true);
  assert.equal(assembledResponse(2, 0.5).checks.accepted, false);
  assert.deepEqual(
    [
      regressionState(1, 0.12).inspected,
      regressionState(1, 0.5).inspected,
      regressionState(1, 0.88).inspected,
    ],
    [3, 6, 6],
  );
  for (const p of [0, 0.12, 0.5, 0.88, 1]) {
    const r = regressionState(1, p);
    assert.equal(r.oldTotal, r.rows.filter((x) => x.old).length);
    assert.equal(r.newTotal, r.rows.filter((x) => x.next).length);
  }
  assert.deepEqual([regressionState(2, 0).oldTotal, regressionState(2, 0).newTotal], [4, 4]);
  assert.equal(clockElapsed(1, 5.725 / spans.clock), 30);
  assert.equal(clockElapsed(1, 7.925 / spans.clock), 30);
  assert.equal(clockElapsed(1, 8.875 / spans.clock), 31);
  assert.equal(assembledResponse(0, 11.57 / spans.response).complete, false);
  assert.equal(assembledResponse(0, 11.58 / spans.response).complete, true);
  assert.equal(assembledResponse(1, 3.7 / spans.checks).checkCount, 2);
  assert.equal(assembledResponse(1, 8.4 / spans.checks).checkCount, 3);
  assert.equal(assembledResponse(2, 1.62 / spans.wrong).current.deadline_minutes, 90);
  assert.equal(assembledResponse(2, 2.5 / spans.wrong).checkCount, 2);
  assert.equal(assembledResponse(2, 7 / spans.wrong).checkCount, 3);
  assert.equal(regressionState(1, 4.2875 / spans.regression).inspected, 6);
  assert.equal(
    promptSections(false).filter(
      (x, i) => JSON.stringify(x) !== JSON.stringify(promptSections(true)[i]),
    ).length,
    1,
  );
  return true;
}
