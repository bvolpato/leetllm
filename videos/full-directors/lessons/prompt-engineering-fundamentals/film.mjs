import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';

import {
  boundaryDecision,
  boundaryIncident,
  experimentReply,
  decisionForScoring,
  jsonFields,
} from './experiment.mjs';
import {
  opening,
  baseline,
  revision,
  boundaryPractice,
  transfer,
  transferIncident,
  offeredDeadline,
  lateMinutes,
} from './clock-scenes.mjs';
import {
  probability,
  roles,
  assembly,
  routing,
  reasoning,
  voting,
  conditional,
  votes,
  routes,
} from './prompt-scenes.mjs';
import {
  reply,
  grammar,
  strict,
  replyState,
  grammars,
  distribution,
  calls,
} from './inspection-scenes.mjs';
import {
  provenance,
  execution,
  paired,
  changes,
  dispatch,
  pairs,
  staleVerdict,
  reviewFields,
} from './decision-scenes.mjs';
import {
  facts,
  good,
  nextTeamRule,
} from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import {
  expectedFields,
  responseChecks,
  triageDecision,
} from '../../../films/prompt-engineering-fundamentals/model.mjs';

const painters = [
  opening,
  probability,
  baseline,
  roles,
  assembly,
  routing,
  revision,
  reasoning,
  voting,
  reply,
  grammar,
  strict,
  provenance,
  execution,
  paired,
  changes,
  boundaryPractice,
  transfer,
];
function check() {
  assert.equal(offeredDeadline - facts.deadline, lateMinutes);
  assert.equal(lateMinutes, 60);
  assert.equal(conditional[0] * conditional[1], 0.24);
  assert.equal(triageDecision(facts).remaining, 18);
  const demo = '{' + jsonFields(boundaryDecision).join(', ') + '}';
  assert.deepEqual(JSON.parse(demo), { ...good, overdue: true });
  assert.ok(responseChecks(demo, boundaryIncident).accepted);
  assert.equal(responseChecks(demo, facts).policy, false);
  for (const explain of [false, true]) {
    const envelope = experimentReply(explain);
    assert.equal(Boolean(envelope.explanation), explain);
    assert.ok(responseChecks(JSON.stringify(decisionForScoring(envelope))).accepted);
    assert.equal(responseChecks(JSON.stringify(envelope)).schema, false);
    assert.equal(
      responseChecks(JSON.stringify({ ...envelope.decision, explanation: '' })).schema,
      false,
    );
    assert.throws(() => decisionForScoring({ ...envelope, explanation: 5 }));
    assert.throws(() => decisionForScoring({ ...envelope, extra: true }));
  }
  assert.deepEqual(
    routes.map((t) => t.route),
    ['docs', 'bug', 'feature'],
  );
  assert.equal(votes.filter((v) => v === offeredDeadline).length / votes.length, 0.8);
  const at = (beatIndex, reveal) => ({ beat: { beatIndex }, reveal });
  const prefix = replyState(at(0, (s) => Number(s !== 'The closing brace')));
  assert.deepEqual([prefix.lines, prefix.checks.parse], [5, false]);
  const intact = replyState(at(1, () => 1));
  const edited = replyState(at(2, () => 1));
  assert.deepEqual(intact.fields, good);
  assert.deepEqual(edited.fields, { ...intact.fields, deadline_minutes: 90 });
  assert.deepEqual(edited.checks, { parse: true, schema: true, policy: false, accepted: false });
  assert.ok(intact.checks.accepted);
  assert.deepEqual(
    distribution(grammars[0]).base.map((p) => (p * 100).toFixed(1)),
    ['63.1', '23.2', '8.5', '5.2'],
  );
  assert.deepEqual(distribution(grammars[0]).after, [1, 0, 0, 0]);
  const brace = distribution(grammars[0]);
  assert.deepEqual(brace.retained, [brace.base[0], 0, 0, 0]);
  const letters = distribution(grammars[1]);
  assert.deepEqual(letters.centered, [0, -1, -Infinity]);
  assert.deepEqual(letters.weights, [1, Math.exp(-1), 0]);
  for (const [values, after] of [
    [brace.retained, brace.after],
    [letters.weights, letters.after],
  ]) {
    const total = values.reduce((a, b) => a + b, 0);
    assert.deepEqual(
      values.map((v) => v / total),
      after,
    );
  }
  assert.deepEqual(
    distribution(grammars[1]).after.map((p) => p.toFixed(3)),
    ['0.731', '0.269', '0.000'],
  );
  assert.throws(() => distribution({ ...grammars[1], legal: [false, false, false] }));
  assert.deepEqual(
    calls.map((x) => x.verdict),
    ['ambiguous_json', 'invalid_deadline', 'accepted', 'contradicts_fixture', 'accepted'],
  );
  for (const row of calls.slice(2)) {
    assert.equal(
      responseChecks(row.raw, { ...facts, elapsed: row.elapsed }).accepted,
      row.verdict === 'accepted',
    );
  }
  assert.equal(staleVerdict.policy, false);
  assert.equal(responseChecks(JSON.stringify(reviewFields)).policy, false);
  const first = dispatch({ permission: true, policyCurrent: true, claimed: false });
  assert.deepEqual(first, { sent: true, claimed: true });
  assert.equal(
    dispatch({ permission: true, policyCurrent: true, claimed: first.claimed }).sent,
    false,
  );
  assert.equal(dispatch({ permission: false, policyCurrent: true, claimed: false }).sent, false);
  for (const key of ['old', 'revised']) assert.equal(pairs.filter((row) => row[key]).length, 4);
  assert.deepEqual(
    pairs.filter((r) => r.old !== r.revised).map((r) => r.name),
    ['overdue', 'prior page'],
  );
  assert.deepEqual(
    [30, 31].map((elapsed) => triageDecision({ ...facts, elapsed }).overdue),
    [false, true],
  );
  assert.equal(transferIncident.elapsed, 37);
  assert.deepEqual(expectedFields(transferIncident), { ...good, overdue: true });
  assert.deepEqual(expectedFields({ ...transferIncident, ruleAvailable: false }), reviewFields);
  const restored = { ...transferIncident, ...nextTeamRule };
  assert.deepEqual(expectedFields(restored), {
    ...good,
    deadline_minutes: 45,
    source_line_ids: ['IR-9'],
  });
  assert.equal(triageDecision(restored).remaining, 8);
  return true;
}
export default {
  title: 'Prompt Engineering Fundamentals',
  preparePicture: prepareCaptions,

  draw(c, k) {
    painters[k.beat.chapterIndex](c, k);
  },
  check,
};
