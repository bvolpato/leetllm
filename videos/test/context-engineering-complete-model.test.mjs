import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requiredPacking,
  CONTEXT_REQUIRED,
  CONTEXT_FRESH,
  pruneContextResults,
  completeWorkerBoundary,
  contextPrefixExample,
  commonContextPrefix,
  contextRelease,
  CONTEXT_RELEASE_CASES,
  completeResume,
  contextResumeFixture,
  contextFreshResumeFixture,
  freshContextState,
  contextOperationLedger,
} from '../animations/context-engineering.mjs';
const encode = (value) => new TextEncoder().encode(value);
test('required-first traversal skips an oversized optional item and still admits a smaller useful one', () => {
  const m = requiredPacking(CONTEXT_FRESH, 2600);
  assert.deepEqual(m.selected, ['task', 'trace', 'authorization', 'runbook']);
  assert.equal(m.used, 2200);
  assert.equal(m.remaining, 400);
  assert.equal(m.events.find((e) => e.id === 'old export').attempted, 2800);
  assert.equal(m.events.find((e) => e.id === 'old export').fits, false);
  assert.deepEqual(requiredPacking(CONTEXT_REQUIRED, 3000).selected, ['alert', 'trace', 'runbook']);
  assert.throws(
    () => requiredPacking([{ id: 'required', units: 4, priority: 1, required: true }], 3),
    /required item does not fit/,
  );
  for (const patch of [{ units: true }, { priority: false }, { required: 1 }])
    assert.throws(() =>
      requiredPacking([{ id: 'x', units: 1, priority: 1, required: false, ...patch }], 3),
    );
});
test('pruning changes only old recorded content and preserves ordered call identities', () => {
  const rows = [true, false, true, true].map((recorded, i) => ({
      id: 'C' + i,
      raw: 'payload' + i,
      recorded,
      source: 'S' + i,
      finding: 'finding' + i,
    })),
    m = pruneContextResults(rows, 2);
  assert.equal(m.cutoff, 2);
  assert.deepEqual(
    m.rows.map((r) => r.id),
    rows.map((r) => r.id),
  );
  assert.deepEqual(
    m.rows.map((r) => r.replaced),
    [true, false, false, false],
  );
  assert.equal(m.rows[1].content, 'payload1');
  assert.equal(m.rows[3].content, 'payload3');
});
test('the byte receiver rejects duplicate decoded keys, invalid UTF-8, unknown source and oversize input independently', () => {
  const good = JSON.stringify({
    claim: 'callback error',
    source_ids: ['trace-17'],
    next_check: 'inspect dependency',
  });
  assert(completeWorkerBoundary(encode(good)).accepted);
  assert(
    !completeWorkerBoundary(
      encode(
        '{"claim":"first","\\u0063laim":"second","source_ids":["trace-17"],"next_check":"inspect"}',
      ),
    ).accepted,
  );
  assert(!completeWorkerBoundary(new Uint8Array([255])).decoded);
  assert(!completeWorkerBoundary(encode(good.replace('trace-17', 'missing'))).known);
  assert(!completeWorkerBoundary(new Uint8Array(1601)).size);
  const falseClaim = completeWorkerBoundary(
    encode(good.replace('callback error', 'request succeeded')),
  );
  assert(
    falseClaim.accepted,
    'This boundary certifies structure and source membership; semantic support remains a separate test',
  );
});
test('moving only a variable first header token behind a fixed document changes the common prefix without reducing input', () => {
  const before = contextPrefixExample(false),
    after = contextPrefixExample(true);
  assert.equal(before.common, 96);
  assert.equal(after.common, 352);
  assert.equal(before.length, 364);
  assert.equal(after.length, 364);
  assert.equal(commonContextPrefix(['a', 'b', 'x'], ['a', 'b', 'y']), 2);
});
test('done status cannot bypass cycles, exact input membership or literal passed true', () => {
  const f = contextResumeFixture();
  assert.equal(completeResume(f.tasks, f.files, f.receipts).next, 'verify cause');
  f.tasks[0].depends = ['verify cause'];
  f.tasks[1].depends = ['collect'];
  assert.throws(() => completeResume(f.tasks, f.files, f.receipts), /dependency cycle/);
  const missing = contextResumeFixture();
  missing.tasks[0].inputs.push('authorization.json');
  assert.throws(
    () => completeResume(missing.tasks, missing.files, missing.receipts),
    /input set differs/,
  );
  const wrong = contextResumeFixture();
  wrong.receipts['collect-receipt'].passed = 'true';
  assert.throws(() => completeResume(wrong.tasks, wrong.files, wrong.receipts), /does not certify/);
});
test('the fresh repair validates the changed trace and then restores required authorization before continuation', () => {
  const f = contextFreshResumeFixture();
  assert.deepEqual(f.tasks[0].inputs, ['trace.json', 'authorization.json']);
  f.files['trace.json'] = 'changed';
  assert.throws(() => completeResume(f.tasks, f.files, f.receipts), /input changed/);
  const state = (after) => ({
    beat: 2,
    beatP: 0.99,
    cues: Object.fromEntries(
      ['ce-earned-receipt', 'ce-earned-authorizer', 'ce-earned-next'].map((id) => [
        id,
        { phase: after.includes(id) ? 'after' : 'before', progress: after.includes(id) ? 1 : 0 },
      ]),
    ),
  });
  const stale = freshContextState(state([]));
  assert(!stale.receiptValid);
  assert.equal(stale.next, null);
  const current = freshContextState(state(['ce-earned-receipt', 'ce-earned-next']));
  assert(current.receiptValid);
  assert.equal(current.next, null);
  assert(!current.packet.includes('authorization'));
  assert.equal(current.renderedUnits, 1900);
  const ready = freshContextState(
    state(['ce-earned-receipt', 'ce-earned-authorizer', 'ce-earned-next']),
  );
  assert.equal(ready.next, 'verify cause');
  assert(ready.packet.includes('authorization'));
  assert.equal(ready.renderedUnits, 2200);
});
test('better aggregate outcomes cannot override a protected regression or malformed release flags', () => {
  const m = contextRelease();
  assert.equal(m.raw, 7);
  assert.equal(m.curated, 8);
  assert.equal(m.gains, 2);
  assert.equal(m.regressions, 1);
  assert.equal(m.approved, false);
  assert(Math.abs(m.percent - 73.09424252171116) < 1e-10);
  assert.equal(
    contextRelease(CONTEXT_RELEASE_CASES.map((r) => ({ ...r, critical: false }))).approved,
    true,
  );
  assert.equal(contextRelease([]).approved, false);
  assert.throws(() =>
    contextRelease([{ raw: true, curated: true, critical: false, poison: true }]),
  );
});
test('an unknown effect stays pending under a repeated operation key and an old fence never advances it', () => {
  const m = contextOperationLedger([
    { key: 'K17', fence: 12, confirmed: false },
    { key: 'K17', fence: 12, confirmed: true },
    { key: 'K18', fence: 11, confirmed: true },
    { key: 'K19', fence: 12, confirmed: true },
  ]);
  assert.deepEqual(
    m.map((r) => r.effects),
    [0, 0, 0, 1],
  );
  assert.deepEqual(
    m.map((r) => r.status),
    ['unknown; reconcile', 'already pending; reconcile', 'stale fence', 'confirmed'],
  );
});
