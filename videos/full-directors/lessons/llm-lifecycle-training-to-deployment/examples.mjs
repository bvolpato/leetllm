import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as source from '../../../films/llm-lifecycle-training-to-deployment/arithmetic.mjs';
import { policyCases } from '../../../films/llm-lifecycle-training-to-deployment/fixtures.mjs';

export { source, policyCases };
export const verdict = (eligible) => (eligible ? 'Eligible' : 'Ineligible');
export const eligible = (age, threshold, stale = true) =>
  stale && age >= threshold;
const keyFacts = source.policyShift(1).facts;
const checkerRun = (step, revision) => {
  const { checker } = source.policyDiagnosis(step);
  return {
    revision,
    cutoff: checker.threshold,
    verdict: verdict(
      eligible(keyFacts.ageDays, checker.threshold, keyFacts.stale),
    ),
  };
};
export const recordedRun = checkerRun(0, 'C1');
export const replayedRun = checkerRun(2, 'C2');
export const paragraph = 'A stale key needs a review.';
export const normalized = paragraph.toLowerCase().replace(/[.!?]/g, '');
export const digest = createHash('sha1')
  .update(normalized)
  .digest('hex')
  .slice(0, 16);
export const bpe = [source.bpeState(0), source.bpeState(1)];
export const compute = source.computeRows();
export const lifetime = (n) => [1 + 0.2 * n, 0.5 + 0.5 * n];
export const candidate = {
  eligible: true,
  policy_id: 'P-7',
  rotation_started: false,
};
export const labelGrades = [true, true, false, false, false];
export const grades = policyCases.map(source.scorePolicyCase);
export const evidenceAgreement = grades.filter(
  (grade, i) => grade === labelGrades[i],
).length;
export const weights = [-0.84, -0.22, 0.05, 0.41, 0.96];
export const quantize = (values) => {
  const step = Math.max(...values.map(Math.abs)) / 127 || 1;
  const codes = values.map((w) => Math.round(w / step));
  const restored = codes.map((q) => q * step);
  const errors = values.map((w, i) => Math.abs(w - restored[i]));
  return { step, codes, restored, maxError: Math.max(...errors) };
};
export const impact = (errors, activations) =>
  errors.map((e, i) => Math.abs(e * activations[i]));
export const quant = quantize(weights);
export const scaled = source.quantizationToy();
export const memory = source.weightMemory();
export const schedule = source.servingWindow();
export const pool = [0, 2, 3, 5, 7];
export const blocks = (tokens, size = 4) => ({
  count: Math.ceil(tokens / size),
  slack: Math.ceil(tokens / size) * size - tokens,
});
export const admission = (
  freeSlots,
  availableKV,
  needsKV,
  prefillReady,
  permitted,
) => freeSlots > 0 && availableKV >= needsKV && prefillReady && permitted;
export const timestamps = [0, 200, 240, 300];
export const gaps = timestamps.slice(1).map((t, i) => t - timestamps[i]);
export const draft = ['The', 'key', 'is', 'still', 'eligible'];
export function verifyDraft(accept, correction = 'ineligible', bonus = '.') {
  const failure = accept.indexOf(false);
  return failure === -1
    ? [...draft, bonus]
    : [...draft.slice(0, failure), correction];
}
export const callers = [
  { name: 'Production', scope: 'production', expires: 140 },
  { name: 'Expired', scope: 'production', expires: 97 },
  { name: 'Staging', scope: 'staging', expires: 140 },
];
export const allow = (caller, t = 100) =>
  caller.scope === 'production' && caller.expires > t;
export const route = (status, t) =>
  status === 503
    ? { next: 'Approved backup', probeAt: t + 10 }
    : status === 429
      ? { next: 'Return rate limit' }
      : { next: 'Primary' };
export const ballots = [
  ['A', 'B'],
  ['B', 'A'],
];
export const firstPicks = ballots.map((order) => order[0]);
export const savedOld = source.replayShortKey(
  source.replyRequest,
  source.replyRequest,
);
export const live = source.checkReply(source.replyRequest);
export const edge = (age) => source.checkReply({ ...source.replyRequest, age });
export const savedBoundaryReply = source.storeReply(
  edge(source.activeRule.threshold),
);
export const current = source.checkReply(
  { ...source.replyRequest, age: source.activeRule.threshold, stale: false },
  savedBoundaryReply,
);
export const templateReport = (template, passed = 20) => {
  const { report, bundle } = source.releaseExample;
  return {
    metrics: source.releaseGate({ ...report, policyCasesPassed: passed }),
    applies: source.reportMatchesRelease(bundle, { ...bundle, template }),
  };
};
export function checkExamples() {
  assert.equal(source.policyShift(1).decision, 'ineligible');
  assert.equal(source.policyShift(1).checkerDecision, 'eligible');
  assert.equal(eligible(42, 60), false);
  assert.equal(eligible(42, 30), true);
  assert.deepEqual(recordedRun, {
    revision: 'C1',
    cutoff: 30,
    verdict: 'Eligible',
  });
  assert.deepEqual(replayedRun, {
    revision: 'C2',
    cutoff: 60,
    verdict: 'Ineligible',
  });
  assert.equal(new Set(Array(10).fill(digest)).size, 1);
  assert.equal(bpe[0].selected, 't|a');
  assert.equal(bpe[0].selectedCount, 5);
  assert.deepEqual(bpe[1].rows[1].tokens, ['s', 'ta', 'l', 'e']);
  assert.equal(bpe[0].lossLow.toFixed(3), '1.609');
  assert.equal(bpe[0].lossHigh.toFixed(3), '0.223');
  assert.equal(compute[1].flops.toExponential(2), '5.88e+23');
  assert.deepEqual(lifetime(20), [5, 10.5]);
  assert.deepEqual(lifetime(2), [1.4, 1.5]);
  assert.equal(
    source.verifierScore({ ...candidate, text: 'Rotation finished.' }),
    1,
  );
  assert.equal(
    source.verifierScore({ ...candidate, rotation_started: true }),
    0,
  );
  assert.deepEqual(firstPicks, ['A', 'B']);
  assert.deepEqual(grades, labelGrades);
  assert.equal(evidenceAgreement, 5);
  assert.equal(source.fixtureReport().policyCasesPassed, 2);
  assert.equal(source.releaseGate(source.fixtureReport()).verdict, 'BLOCK');
  assert.equal(templateReport('4').metrics.verdict, 'PROMOTE');
  assert.equal(templateReport('4', 21).metrics.verdict, 'BLOCK');
  assert.equal(templateReport('5').applies, false);
  assert.equal(templateReport('4').applies, true);
  assert.equal(memory.bytes[0].toFixed(1), '130.4');
  assert.equal((memory.bytes[2] + memory.cachePerRequest).toFixed(1), '42.6');
  assert.equal(memory.twoRequestSubtotal.toFixed(1), '52.6');
  assert.equal(source.weightMemory(16384).cachePerRequest, 5);
  assert.equal(memory.shortfallAt48.toFixed(1), '4.6');
  assert.equal(memory.remainingAt60.toFixed(1), '7.4');
  assert.equal(quant.maxError.toFixed(4), '0.0029');
  assert.deepEqual(quantize([0, 0]).restored, [0, 0]);
  assert.deepEqual(impact([0.01, 0.04], [10, 1]), [0.1, 0.04]);
  assert.equal(scaled.exact, scaled.scaledExact);
  assert.equal(scaled.plain.toFixed(2), '2.40');
  assert.equal(scaled.scaled.toFixed(2), '2.90');
  assert.equal(schedule.staticIdle, 585);
  assert.deepEqual(blocks(17), { count: 5, slack: 3 });
  assert.equal(admission(1, 4, 4, true, true), true);
  assert.equal(admission(1, 3, 4, true, true), false);
  assert.equal(admission(1, 4, 4, false, true), false);
  assert.equal(pool[blocks(17).count - 1], 7);
  assert.deepEqual(gaps, [200, 40, 60]);
  assert.equal(blocks(6).slack, 2);
  assert.deepEqual(verifyDraft([true, true, true, true, false]), [
    ...draft.slice(0, 4),
    'ineligible',
  ]);
  assert.deepEqual(verifyDraft([true, false, true, true, true]), [
    'The',
    'ineligible',
  ]);
  assert.equal(verifyDraft(Array(5).fill(true)).length, 6);
  assert.deepEqual(
    callers.map((c) => allow(c)),
    [true, false, false],
  );
  assert.equal(route(503, 100).probeAt, 110);
  assert.equal(route(429, 100).next, 'Return rate limit');
  assert.deepEqual(
    source.policyDiagnosis(2).boundary.map((r) => r.decision),
    ['ineligible', 'eligible'],
  );
  assert.equal(savedOld.eligible, true);
  assert.equal(live.eligible, false);
  assert.equal(
    source.checkReply(source.replyRequest, source.storeReply(live)).kind,
    'hit',
  );
  assert.deepEqual(
    [edge(89).eligible, edge(90).eligible, current.eligible],
    [false, true, false],
  );
  assert.equal(
    source.checkReply({ ...source.replyRequest, age: 90 }, savedBoundaryReply)
      .kind,
    'hit',
  );
  assert.equal(savedBoundaryReply.identity, 'K10234|90|true|v4|P-7 v3|C3');
  assert.equal(savedBoundaryReply.answer.eligible, true);
  assert.equal(current.identity, 'K10234|90|false|v4|P-7 v3|C3');
  assert.equal(current.kind, 'recompute');
  assert.equal(current.executed, false);
  return true;
}
