import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export { stableSoftmax };
export {
  CI_RUN,
  EOS,
  FAIL_PREFIX,
  LANGUAGE,
  OPENING_REPLIES,
  RUN_LOG,
  SUFFIX,
  VALUE_PREFIX,
} from '../../../films/structured-generation/fixtures.mjs';
export {
  ciOutcome,
  decode,
  digestIdentity,
  legal,
  masked,
  nullableRecord,
  rankedSteps,
  recursivePrefix,
  treeRelationships,
} from '../../../films/structured-generation/model.mjs';
export {
  maskStepTime,
  normalizedWeights,
  retryBudget,
} from '../../../films/structured-generation/arithmetic.mjs';
import {
  CI_RUN,
  EOS,
  LANGUAGE,
  OPENING_REPLIES,
  RUN_LOG,
  VALUE_PREFIX,
} from '../../../films/structured-generation/fixtures.mjs';
import {
  ciOutcome,
  decode,
  digestIdentity,
  legal,
  masked,
  nullableRecord,
  rankedSteps,
  recursivePrefix,
  treeRelationships,
} from '../../../films/structured-generation/model.mjs';
import {
  maskStepTime,
  normalizedWeights,
  retryBudget,
} from '../../../films/structured-generation/arithmetic.mjs';

export const firstTokens = ['The', '{', 'Sure', 'JSON'],
  scores = [0.45, 0.3, 0.15, 0.1];
export const rawFirst = stableSoftmax(scores),
  maskedFirst = masked(scores, '', firstTokens);
export const runTriage = {
  run_id: CI_RUN.run_id,
  status: CI_RUN.status,
  failing_job: CI_RUN.failing_job,
};
export const shopPrefix = VALUE_PREFIX + 'clo',
  shopToken = 'sed"}';
export const shopRecords = ['open', 'closed'].map((status) => JSON.stringify({ status }));
export const compareToken = (token, n) => {
  const trial = shopPrefix + token.slice(0, n);
  return {
    trial,
    viable: shopRecords.some((s) => s.startsWith(trial)),
    complete: shopRecords.includes(trial),
  };
};
export function trialAt(depth, token, count) {
  const prefix = '{"child":'.repeat(depth - 1) + '{';
  const original = recursivePrefix(prefix);
  const trial = recursivePrefix(prefix + token.slice(0, count));
  return { prefix, original, trial, legal: trial.valid, complete: trial.complete };
}
export const valueChoices = [
  { token: 'passed', weight: 2 },
  { token: 'fa', weight: 3 },
  { token: 'chatty', weight: 5 },
].map((choice) => ({ ...choice, eligible: legal(VALUE_PREFIX, choice.token) }));
const eligibleValueIndices = valueChoices.flatMap(({ eligible }, i) => (eligible ? [i] : []));
export const maxLegalWeight = Math.max(...eligibleValueIndices.map((i) => valueChoices[i].weight));
export const branch = (faWeight = valueChoices[1].weight) =>
  normalizedWeights(
    valueChoices.map(({ token, weight }) => (token === 'fa' ? faWeight : weight)),
    eligibleValueIndices,
  );
export function race(gpu, mask, overlap, time) {
  const beginMask = overlap ? 0 : gpu,
    join = maskStepTime(gpu, mask, 0, overlap);
  const job = (start, duration) => ({
    start,
    duration,
    done: Math.min(duration, Math.max(0, time - start)),
  });
  return { lanes: [job(0, gpu), job(beginMask, mask), job(join, 1)], join, end: join + 1 };
}
export const baseRecord = { run_id: CI_RUN.run_id, status: 'failed' };
export const jobRows = [
  baseRecord,
  { ...baseRecord, failing_job: null },
  { ...baseRecord, failing_job: 'tests' },
];
export const durationField = 'duration_s';
export const durationSchema = { type: 'number', minimum: 0 };
export const durationReply = { [durationField]: -0.5 };
// This is llama.cpp's number production for the value token, without surrounding whitespace.
const gbnfNumber = /^-?(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,16})?(?:[eE][-+]?(?:0|[1-9][0-9]{0,15}))?$/u;
export function durationChecks(reply) {
  const value = reply[durationField];
  return {
    grammar: gbnfNumber.test(JSON.stringify(value)),
    local: typeof value === durationSchema.type && Number.isFinite(value) && value >= durationSchema.minimum,
  };
}
export const wireValue = -1;
export const acceptsRetry = (value, minimum) =>
  Number.isInteger(value) && (minimum === undefined || value >= minimum);
export const suppliedQuote = RUN_LOG,
  inventedQuote = 'RUN-842 needs immediate rollback.';
export const exactQuote = (s, id) => RUN_LOG.includes(s) && s.split(/[^A-Za-z0-9-]+/u).includes(id);
export const nodes = (cyclic) => [
  { id: 'R', parent: null },
  { id: 'A', parent: cyclic ? 'B' : 'R' },
  { id: 'B', parent: cyclic ? 'A' : 'R' },
];
export const toolName = 'get_run_status';
export const scopeCase = (project, status, scope = 'project-alpha') =>
  ciOutcome({ project, status, run_id: CI_RUN.run_id }, scope, {
    ['project-alpha/' + CI_RUN.run_id]: CI_RUN.status,
  });
export const actionMatch = (p, grant) =>
  p.action === 'retry_tests' && !!grant && p.action === grant.action && p.run_id === grant.run_id;
export const authCases = [
  null,
  { run_id: 'RUN-999', action: 'retry_tests' },
  { run_id: CI_RUN.run_id, action: 'retry_tests' },
];
export const mentions = [
  { service: 'auth-api', status: 'healthy' },
  { service: 'vector-indexer', status: 'degraded' },
  { service: 'report-worker', status: 'unknown' },
];
export const dupe = [mentions[0], { service: 'auth-api', status: 'outage' }];
export const catalog = ['auth-api', 'vector-indexer', 'billing-export'];
export const forcedKey = ['{"', 'status', '":"'];
export const joinedTokens = ['{"', 'outer', '"', ':{', '"', 'status', '":"'];
export const deadTokens = ['!', ']'];
export const lowTokens = ['!', '}}}}'];
export const lowWeights = stableSoftmax([-1000]);
export const shiftedWeights = valueChoices.map(({ weight, eligible }) =>
  eligible ? Math.exp(Math.log(weight) - Math.log(maxLegalWeight)) : 0,
);
export const budget = (elapsed, spent = 4, status = 'length') =>
  retryBudget({
    status,
    elapsed,
    spent,
    call: 3,
    validation: 1,
    cost: 3,
    deadline: 12,
    limit: 8,
    output: 500,
    modelLimit: 600,
  });
export const finalRecord = {
  project: 'project-gamma',
  run_id: 'RUN-915',
  status: 'failed',
  failing_job: null,
};
export const finalProposal = { action: 'rollback', approved: true, run_id: finalRecord.run_id };
export const finalGrants = [];
export const finalRead = (scope) =>
  ciOutcome(finalRecord, scope, { ['project-gamma/' + finalRecord.run_id]: 'failed' });
export const checkRun = (scope) => ({
  read: finalRead(scope),
  approved: finalGrants.some((g) => actionMatch(finalProposal, g)),
});
export const duplicatePairs = [
  ['run_id', 'RUN-842'],
  ['run_id', 'RUN-999'],
];
export const seenTwice = (pairs) => new Set(pairs.map(([key]) => key)).size !== pairs.length;
export function check() {
  assert.throws(() => JSON.parse(OPENING_REPLIES[0]));
  assert.equal(JSON.parse(OPENING_REPLIES[1]).status, 'passed');
  assert.notEqual(JSON.parse(OPENING_REPLIES[1]).status, CI_RUN.status);
  assert.deepEqual(
    LANGUAGE.filter((s) => s.startsWith(VALUE_PREFIX + 'fa')),
    [LANGUAGE[1]],
  );
  assert.deepEqual(maskedFirst, [0, 1, 0, 0]);
  assert.equal(Math.max(...rawFirst), rawFirst[0]);
  assert.deepEqual(branch(), [0.4, 0.6, 0]);
  assert.deepEqual(branch(6), [0.25, 0.75, 0]);
  assert(compareToken(shopToken, 5).complete);
  assert(!compareToken(shopToken + '!', 6).viable);
  const threeDraws = rankedSteps(3), fourDraws = rankedSteps(4);
  assert.deepEqual(threeDraws, [VALUE_PREFIX, 'fa', 'iled"}']);
  assert.deepEqual(fourDraws, [...threeDraws, EOS]);
  assert.equal(threeDraws.join(''), LANGUAGE[1]);
  assert(legal(threeDraws.join(''), EOS));
  assert.throws(() => decode(threeDraws), /token budget ended/);
  assert.equal(decode(fourDraws), threeDraws.join(''));
  for (const depth of [3, 4]) {
    const bad = '}'.repeat(depth - 1) + (depth === 4 ? '!' : ']');
    for (let n = 0; n <= depth; n++) {
      const a = trialAt(depth, '}'.repeat(depth), n),
        b = trialAt(depth, bad, n);
      assert.equal(a.trial.frames.length, depth - n);
      assert.equal(a.complete, n === depth);
      assert.equal(b.original.frames.length, depth);
      assert.equal(b.legal, n < depth);
      assert.equal(b.trial.frames.length, Math.max(1, depth - n));
    }
  }
  for (const [mask, overlap, join, end] of [
    [3, false, 11, 12],
    [3, true, 8, 9],
    [10, true, 10, 11],
  ]) {
    assert.equal(race(8, mask, overlap, join - 0.01).lanes[2].done, 0);
    assert.equal(race(8, mask, overlap, join + 0.5).lanes[2].done, 0.5);
    assert.equal(race(8, mask, overlap, end).end, end);
  }
  assert(seenTwice(duplicatePairs));
  assert.equal(Object.fromEntries(duplicatePairs).run_id, 'RUN-999');
  assert.equal(Number.isFinite(Number('1e999')), false);
  assert.deepEqual(jobRows.map(nullableRecord), [false, true, true]);
  assert(nullableRecord(runTriage));
  assert.equal(joinedTokens.join(''), '{"outer":' + forcedKey.join(''));
  assert(deadTokens.every((t) => !trialAt(4, t, t.length).legal));
  assert.equal(trialAt(4, lowTokens[1], lowTokens[1].length).legal, true);
  assert.deepEqual(lowWeights, [1]);
  assert(Math.abs(shiftedWeights[0] - 2 / 3) < 1e-12);
  assert.equal(shiftedWeights[1], 1);
  assert.equal(shiftedWeights[2], 0);
  assert(Math.abs(shiftedWeights[1] / shiftedWeights.reduce((a, b) => a + b, 0) - 0.6) < 1e-12);
  assert.deepEqual(durationChecks(durationReply), { grammar: true, local: false });
  assert.deepEqual(durationChecks({ [durationField]: 0 }), { grammar: true, local: true });
  assert.deepEqual(durationChecks({ [durationField]: '-0.5' }), { grammar: false, local: false });
  assert(acceptsRetry(wireValue));
  assert(!acceptsRetry(wireValue, 0));
  assert(exactQuote(suppliedQuote, CI_RUN.run_id));
  assert(!exactQuote(inventedQuote, CI_RUN.run_id));
  assert(!exactQuote(suppliedQuote, 'RUN-84'));
  assert.deepEqual(scopeCase('project-beta', 'failed'), { outcome: 'deny', queried: false });
  assert.equal(scopeCase('project-alpha', 'passed').outcome, 'review');
  assert.equal(scopeCase('project-alpha', 'failed').outcome, 'show snapshot');
  assert.equal(treeRelationships(nodes(false)).visited.length, 3);
  assert.deepEqual(treeRelationships(nodes(true)).visited, ['R']);
  assert(!treeRelationships(nodes(true)).valid);
  assert.deepEqual(
    authCases.map((g) => actionMatch({ action: 'retry_tests', run_id: 'RUN-842' }, g)),
    [false, false, true],
  );
  assert(!actionMatch(finalProposal, authCases[2]));
  assert.deepEqual(digestIdentity(mentions, catalog).unknown, ['report-worker']);
  assert.deepEqual(digestIdentity(dupe, catalog).duplicates, ['auth-api']);
  assert(digestIdentity([], catalog).valid);
  assert.equal(budget(7).totalTime, 11);
  assert.equal(budget(8.5).totalTime, 12.5);
  assert.deepEqual(
    [budget(7), budget(8.5), budget(7, 6), budget(7, 4, 'refusal')].map((r) => r.allowed),
    [true, false, false, false],
  );
  assert.deepEqual(checkRun('project-gamma'), {
    read: { outcome: 'show snapshot', queried: true },
    approved: false,
  });
  assert.deepEqual(checkRun('project-delta'), {
    read: { outcome: 'deny', queried: false },
    approved: false,
  });
  assert(!legal('', EOS));
}
