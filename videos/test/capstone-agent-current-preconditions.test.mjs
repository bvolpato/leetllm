import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, composedRepairFixture } from '../animations/capstone-production-llm-agent.mjs';

test('a matching unexpired review cannot override revoked current identity verification', () => {
  const effects = new Set();
  assert.equal(execute({ effects, currentVerified: false }), 'BLOCK: stale preconditions');
  assert.equal(effects.size, 0);
  assert.equal(execute({ effects, currentVerified: true }), 'Local effect committed');
  assert.equal(execute({ effects, currentVerified: true }), 'Duplicate ignored');
  assert.equal(effects.size, 1);
});

test('repairing expiry alone reveals the next failure before one commit and replay', () => {
  const trace = composedRepairFixture();
  assert.deepEqual(
    trace.steps.map((step) => step.result),
    [
      'BLOCK: packet changed',
      'BLOCK: stale preconditions',
      'Local effect committed',
      'Duplicate ignored',
    ],
  );
  assert.deepEqual(
    trace.steps.map((step) => step.effects),
    [0, 0, 1, 1],
  );
  assert.equal(new Set(trace.steps.map((step) => step.operation)).size, 1);
  assert.notEqual(trace.steps[0].storedDigest, trace.review);
  assert.equal(trace.steps[1].storedDigest, trace.review);
  assert.equal(trace.steps[1].currentVerified, false);
});
