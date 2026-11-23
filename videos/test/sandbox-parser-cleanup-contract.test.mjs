import test from 'node:test';
import assert from 'node:assert/strict';
import { parserIdentities, cleanupTransition } from '../animations/sandbox-execution.mjs';

test('parser follows the root namespace, direct children and skipped precedence', () => {
  const xml =
    '<testsuite xmlns="urn:other-fixture" xmlns:e="urn:extension"><testcase classname="A" name="x"><failure/><error/></testcase><testcase classname="A" name="x"><failure/></testcase><testcase classname="A" name="skip"><skipped/><error/></testcase><testcase classname="A" name="nested"><details><failure/></details></testcase><testcase classname="A" name="foreign"><e:failure/></testcase></testsuite>';
  assert.deepEqual(parserIdentities(xml), ['A::x']);
  assert.throws(
    () =>
      parserIdentities(
        '<testsuite><testcase classname="A" name=" "><error/></testcase></testsuite>',
      ),
    /classname and name/,
  );
  assert.throws(() => parserIdentities('<testsuite>'));
});

test('a stale reset acknowledgement cannot free another terminated generation', () => {
  const replacement = { runtimeId: 'worker-8', generation: 8, status: 'terminated' };
  assert.equal(
    cleanupTransition(replacement, { type: 'reset-ok', runtimeId: 'worker-7', generation: 7 })
      .status,
    'terminated',
  );
  assert.equal(
    cleanupTransition(replacement, { type: 'reset-ok', runtimeId: 'worker-8', generation: 8 })
      .status,
    'reusable',
  );
});
