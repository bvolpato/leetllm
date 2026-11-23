import assert from 'node:assert/strict';
import test from 'node:test';
import {
  exactBrokerRequest,
  freshSandboxDecision,
  helperAllows,
  layeredWrite,
  sanitizeBrokerReply,
} from '../animations/local-agent-sandboxing-seatbelt-landlock.mjs';

test('same-layer broad write survives a child read grant while an independent restriction removes metadata writes', () => {
  const resources = [
    '/workspace/src/app.py',
    '/workspace/out/report.json',
    '/workspace/.git/config',
    '/workspace/.git/hooks/post-checkout',
  ];
  assert.deepEqual(
    resources.map((path) => layeredWrite(path, { broad: true })),
    [true, true, true, true],
  );
  assert.deepEqual(
    resources.map((path) => layeredWrite(path, { broad: true, narrow: true })),
    [true, true, false, false],
  );
  assert.deepEqual(
    resources.map((path) => layeredWrite(path, { broad: true, metadataReadOnly: true })),
    [true, true, false, false],
  );
  assert.equal(layeredWrite('/workspace/src/../../outside', { broad: true }), false);
});

test('the exact Python-helper policy differs from the source-only policy and resolves aliases before admission', () => {
  for (const path of ['/workspace/.git', '/workspace/.env.local', '/workspace/.git/config.bak']) {
    assert.equal(helperAllows(path), true);
    assert.equal(layeredWrite(path, { broad: false, narrow: true }), false);
  }
  const links = { '/workspace/src/cache': '/workspace/.git', '/workspace/src/home': '/home/dev' };
  assert.equal(helperAllows('/workspace/src/cache/hooks/post-checkout', links), false);
  assert.equal(helperAllows('/workspace/src/home/../secret', links), false);
  assert.equal(helperAllows('/workspace/.git/hooks-old'), true);
  const fresh = freshSandboxDecision();
  assert.equal(fresh.actual, '/workspace/.git/config');
  assert.equal(fresh.allowed, false);
});

test('broker admission checks the exact operation before dispatch and reply filtering excludes upstream extras', () => {
  assert.equal(exactBrokerRequest('GET', 'owner/repo', 42), true);
  for (const args of [
    ['POST', 'owner/repo', 42],
    ['DELETE', 'owner/repo', 42],
    ['GET', 'other/repo', 42],
    ['GET', 'owner/repo', 43],
    ['GET', 'owner/repo', '42'],
  ]) {
    assert.equal(exactBrokerRequest(...args), false);
  }
  const reply = {
    number: 42,
    state: 'open',
    debug_token: 'TEST_ONLY',
    nested: { token: 'TEST_ONLY' },
  };
  assert.deepEqual(sanitizeBrokerReply(reply), { number: 42, state: 'open' });
  assert.equal(reply.debug_token, 'TEST_ONLY');
});
