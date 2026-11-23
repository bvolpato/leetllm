import assert from 'node:assert/strict';
import {
  replay, queuedReplay, replayEvidence, raceTrace, inScope,
  freshConcurrentLedger, strictWorkflowReceipt, runnerCapability,
} from '../../../films/ai-coding-workflow-with-agents/model.mjs';
import { EVENT, OTHER, owned, REQUIRED_WORKFLOW_CHECKS } from '../../../films/ai-coding-workflow-with-agents/fixtures.mjs';

export { EVENT, OTHER, owned, inScope, runnerCapability, replay, replayEvidence, raceTrace };
export const jobs = {
  [EVENT]: { name: 'Wheel truing', key: '78291', color: '#245994', tint: '#dbeafa' },
  [OTHER]: { name: 'Chain wax', key: '99002', color: '#894515', tint: '#f8e4c4' },
};
export const deliveries = [EVENT, EVENT, OTHER];
export const idOf = (invoice) => '#' + invoice.split(' ').at(-1);
export const dirtyPaths = [...owned, 'checkout/PayButton.tsx', 'pnpm-lock.yaml'];
export const workingTree = { index: 1, working: 2, untracked: 'local-input.json' };

export const repairRuns = [replay(false, 3), queuedReplay(), replay(true, 3)];
export function repairView(attempt, drained = true, setupError = false) {
  if (setupError) return { returns: [], rows: [], verdict: 'SETUP ERROR', reason: 'Import failed before test' };
  const run = repairRuns[attempt];
  const checks = replayEvidence(run).map((r) => r.passed);
  const rows = attempt === 1 && !drained ? run.invoices.slice(0, -1) : run.invoices;
  return {
    returns: run.deliveries.map((d) => idOf(d.invoice)),
    rows,
    verdict: !drained ? 'PENDING' : checks.every(Boolean) ? 'PASS' : 'FAIL',
    reason: !drained ? 'Queued write pending' : !checks[0] ? 'Retry returned a new ID'
      : !checks[2] ? 'Expected 2 stored rows' : 'Retry, new job, count',
  };
}
const required = ['Same-event replay', 'New-event creation'];
export function receipt(source, skipped = false) {
  return {
    source, verifier: 'K', environment: 'shop-fixture', collected: [...required],
    outcomes: required.map((test, i) => ({ test, result: skipped && !i ? 'SKIP' : 'PASS' })),
    exit: 0,
  };
}
export function receiptVerdict(r, head) {
  if (r.source !== head) return 'Older source';
  if (r.verifier !== 'K' || r.environment !== 'shop-fixture') return 'Inputs differ';
  if (r.exit !== 0) return 'No passing run';
  return required.every((name) => r.collected.includes(name) &&
    r.outcomes.some((item) => item.test === name && item.result === 'PASS'))
    ? 'Checks verified' : 'Missing execution';
}

export const practiceKeys = [43017, 43017, 43017, 88104];
export const practice = freshConcurrentLedger(practiceKeys);
export const practiceReceipts = ['E', 'F', 'F'].map((source, i) => ({
  source, verifier: 'K', base: 'expected assertion failure', terminal: 'pass', exitCode: 0,
  executed: REQUIRED_WORKFLOW_CHECKS.filter((name) => name !== 'concurrent replay' || i !== 1),
}));
export const matchesF = (r) => strictWorkflowReceipt(r, 'F', 'K');

export function checkEvidence() {
  for (const [i, returns] of [[0, ['#1', '#2', '#3']], [1, ['#1', '#1', '#2']], [2, ['#1', '#1', '#2']]]) {
    assert.deepEqual(repairView(i).returns, returns);
    assert.deepEqual(repairRuns[i].deliveries.map((d) => d.event), deliveries);
    assert.equal(repairView(i).rows.length, repairRuns[i].count);
  }
  assert.deepEqual(repairRuns.map((r) => replayEvidence(r).map((c) => c.passed)),
    [[false, true, false], [true, true, false], [true, true, true]]);
  assert.equal(repairView(1, false).verdict, 'PENDING');
  assert.equal(repairView(1, false).rows.length, 2);
  assert.equal(repairView(1).rows.at(-1).event, EVENT);
  assert.equal(repairView(2, true, true).rows.length, 0);
  assert.equal(repairView(2, true, true).verdict, 'SETUP ERROR');
  assert(!inScope(dirtyPaths));
  assert(inScope([...owned]));
  assert(runnerCapability('read', 'fixtures/retry.json'));
  assert(runnerCapability('write', '/tmp/runner/result.json'));
  assert(!runnerCapability('network', 'payment API'));
  for (const atomic of [false, true]) {
    assert.equal(raceTrace(atomic, 2).count, 0);
    assert.equal(raceTrace(atomic, 3).rows[0].id, 'invoice 1');
    const final = raceTrace(atomic, 4);
    assert.equal(final.count, atomic ? 1 : 2);
    assert.equal(final.events.at(-1), atomic ? 'B returns invoice 1' : 'B commits invoice 2');
  }
  assert.equal(receiptVerdict(receipt('B'), 'C'), 'Older source');
  assert.equal(receiptVerdict(receipt('C', true), 'C'), 'Missing execution');
  assert.equal(receiptVerdict(receipt('C'), 'C'), 'Checks verified');
  assert.equal(receiptVerdict({ ...receipt('C'), exit: false }, 'C'), 'No passing run');
  assert.equal(receiptVerdict({ ...receipt('C'), verifier: 'J' }, 'C'), 'Inputs differ');
  assert.deepEqual(practice.returned, [1, 1, 1, 2]);
  assert.equal(practice.count, 2);
  assert.deepEqual(practiceReceipts.map(matchesF), [false, false, true]);
}
