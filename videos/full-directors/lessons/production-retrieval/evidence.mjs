import assert from 'node:assert/strict';
import {
  CORPUS,
  PARENTS,
  REQUIRED_RAG_GATES,
} from '../../../films/production-retrieval/fixtures.mjs';
import {
  allowedRecords,
  retrieve,
  zeroScoreFixture,
  packParents,
  answerFromEvidence,
  requestPath,
  parentAdmission,
  completeRequestBudget,
  filteredRecallFixture,
  releaseCases,
  serialRequestTrace,
  ragReleaseGate,
  currentAuthorityDecision,
} from '../../../films/production-retrieval/model.mjs';
import {
  halfOpenCurrent,
  isCurrent,
  governingRecall,
  termSet,
  unknownSourceLabels,
} from '../../../films/production-retrieval/arithmetic.mjs';
export {
  CORPUS,
  PARENTS,
  REQUIRED_RAG_GATES,
  halfOpenCurrent,
  isCurrent,
  governingRecall,
  unknownSourceLabels,
  ragReleaseGate,
  currentAuthorityDecision,
};
const paraphrase = zeroScoreFixture();
export const run = requestPath(),
  rules = run.packed,
  graph = filteredRecallFixture(),
  zeroQuery = paraphrase.query;
export const sessionOnly = packParents(
  run.hits.filter((hit) => hit.record.documentId === 'eu-session'),
  run.caller,
);
export const zero = paraphrase.hits,
  tieAnswer = paraphrase.answer,
  zeroCut = retrieve(zeroQuery, run.caller);
export function sharedTerms(query, passage) {
  const words = termSet(passage);
  return [...termSet(query)].filter((word) => words.has(word));
}
export const req = (staleDays, signalHours) => ({
  intent: 'rotation_eligibility',
  staleDays,
  signalHours,
});
export const verdict = (days, hours, sources = rules) =>
  answerFromEvidence(req(days, hours), sources).decision;
const answerQuestion =
  'A service-account key went stale 10 days ago, and its risk signal is 48 hours old. May it rotate automatically?';
export const budget = completeRequestBudget(rules, answerQuestion),
  trace = serialRequestTrace(),
  cases = releaseCases();
export const gateReport = Object.fromEntries(REQUIRED_RAG_GATES.map((name) => [name, true]));
export function report(state) {
  const r = { ...gateReport };
  if (state === 'wrong') r.cases = false;
  if (state === 'missing') delete r.lifecycle;
  if (state === 'numeric') r.lifecycle = 1;
  return r;
}
export const exact = [1, 2, 3, 4, 5, 6, 7, 8, 'R', 10],
  picks = [...exact.slice(0, 8), 'X', 'Y'];
export const match = governingRecall(exact, picks, ['R']);
const format = (e) => '[' + e.sourceId + '] ' + e.parentId + ' (' + e.version + '): ' + e.text;
export const keyChars = format(rules[0]).length,
  sessionChars = 1 + format(rules[1]).length;
const appendix = {
  ...PARENTS['eu-access-v2'],
  id: 'eu-access-history',
  text: 'Current key rule: ' + CORPUS[0].text + '\nHistorical key rule: ' + CORPUS[1].text,
};
const appendixChild = { ...run.hits[0].record, parentId: appendix.id };
export const appendixChars =
  1 + format({ ...appendix, sourceId: 'E2', parentId: appendix.id }).length;
const note = 'Please open a review ticket.';
export const notedText = PARENTS['eu-access-v2'].text + ' ' + note;
export const noted = packParents(run.hits, run.caller, undefined, 400, {
  ...PARENTS,
  'eu-access-v2': { ...PARENTS['eu-access-v2'], text: notedText },
});
export function canRelease(inputs, revoked = [], deleted = []) {
  return inputs.every((e) => !revoked.includes(e.documentId) && !deleted.includes(e.documentId));
}
export function activeBundle(pinned, serving) {
  return { child: pinned, parent: pinned, next: serving };
}
export function check() {
  assert.deepEqual(
    allowedRecords(run.caller).map((x) => x.id),
    ['eu-key-v2', 'eu-session-v1'],
  );
  assert.deepEqual(
    run.candidates.map((h) => h.score),
    [7, 2],
  );
  assert.deepEqual(
    zero.map((h) => h.score),
    [0, 0],
  );
  assert.equal(zeroCut.length, 0);
  for (const [query, hits] of [[run.query, run.candidates], [zeroQuery, zero]]) {
    for (const hit of hits) assert.equal(sharedTerms(query, hit.record.text).length, hit.score);
  }
  assert.deepEqual(zero.map((hit) => hit.record.id), ['eu-key-v2', 'eu-session-v1']);
  assert.equal(tieAnswer.decision, 'eligible');
  assert.deepEqual(tieAnswer.cited, ['E1']);
  assert.deepEqual(
    graph.redacted.map((r) => r.id),
    ['P1'],
  );
  assert.deepEqual(
    graph.allowed.map((r) => r.id),
    ['P1', 'P2', 'P3'],
  );
  assert.equal(isCurrent(CORPUS[1], '2026-03-31'), true);
  assert.equal(isCurrent(CORPUS[1], '2026-04-01'), false);
  assert.deepEqual(
    [
      { start: 4, end: 12 },
      { start: 12, end: 20 },
    ].map((r) => halfOpenCurrent(r, 12)),
    [false, true],
  );
  assert.deepEqual(activeBundle('A', 'B'), { child: 'A', parent: 'A', next: 'B' });
  assert.equal(
    parentAdmission(run.hits[0].record, { ...PARENTS['eu-access-v2'], version: 'B' }, run.caller)
      .accepted,
    false,
  );
  const trial = packParents(
    [run.hits[0], { record: appendixChild }, run.hits[1], run.hits[0]],
    run.caller,
    undefined,
    400,
    { ...PARENTS, [appendix.id]: appendix },
  );
  assert.deepEqual(trial, rules);
  assert.deepEqual([keyChars, sessionChars, keyChars + sessionChars], [217, 121, 338]);
  assert.equal(appendixChars, 297);
  const countedQuestion = budget.rendered.split('\nQUESTION:\n')[1].split('\nEVIDENCE:\n')[0];
  assert.equal(countedQuestion, budget.parts.find((part) => part.label === 'Question').text);
  assert.match(countedQuestion, /stale 10 days ago, and its risk signal is 48 hours old/);
  assert.deepEqual(budget.parts.map((p) => p.tokens), [66, 111, 38, 218, 121]);
  assert.equal(budget.parts.reduce((sum, p) => sum + p.tokens, 0), budget.total);
  assert.equal(budget.total, Buffer.byteLength(budget.rendered));
  assert.equal(budget.total + budget.reservedOutput, 810);
  assert.equal(budget.limit + budget.reservedOutput, 1024);
  assert.equal(budget.limit - budget.total, 214);
  assert.equal(budget.fits, true);
  assert.deepEqual(
    [
      [10, 48],
      [14, 48],
      [15, 48],
      [13, 49],
      [13, 47],
    ].map(([d, h]) => verdict(d, h)),
    ['eligible', 'eligible', 'ineligible', 'ineligible', 'eligible'],
  );
  assert.equal(sessionOnly[0].sourceId, 'E1');
  assert.equal(verdict(15, 48, sessionOnly), 'abstain');
  for (const a of [null, true, -1]) assert.equal(verdict(a, 48), 'abstain');
  assert.equal(verdict(10, 48, noted), 'abstain');
  assert.deepEqual(unknownSourceLabels('[E7]', ['E1', 'E2']), ['E7']);
  assert.deepEqual(unknownSourceLabels('[E2]', ['E1', 'E2']), []);
  assert.equal(canRelease(rules, ['eu-session']), false);
  assert.equal(canRelease(rules.slice(0, 1), ['eu-session']), true);
  assert.equal(canRelease(rules.slice(0, 1), [], ['eu-access']), false);
  assert.equal(currentAuthorityDecision({ deleted: true }), 'abstain');
  assert.deepEqual(match, { ann: 0.8, task: 0 });
  assert.deepEqual([trace.callerTTFT, trace.completion, trace.traceComplete], [341, 751, 754]);
  assert.equal(
    trace.localPassingStages.reduce((a, b) => a + b, 0),
    trace.localTotal,
  );
  assert.equal(cases[0].result.decision, cases[3].result.decision);
  assert.notEqual(cases[0].result.text, cases[3].result.text);
  assert.deepEqual(
    ['reviewed', 'wrong', 'missing', 'numeric'].map((s) => ragReleaseGate(report(s))),
    [true, false, false, false],
  );
}
