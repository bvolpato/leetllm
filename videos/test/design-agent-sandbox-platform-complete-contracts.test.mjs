import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sandboxPages,
  sandboxReadiness,
  sandboxAck,
  sandboxCapacity,
  sandboxRetirement,
  sandboxReconcile,
} from '../animations/design-agent-sandbox-platform.mjs';
test('each clone owns its private entry, and replacing one does not allocate another', () => {
  const base = [4, 8, 12],
    m = sandboxPages(base, [
      { clone: 'A', index: 0, value: 99 },
      { clone: 'A', index: 2, value: 41 },
      { clone: 'B', index: 0, value: 0 },
      { clone: 'A', index: 0, value: 77 },
    ]);
  assert.deepEqual(base, [4, 8, 12]);
  assert.deepEqual(m.a, [77, 8, 41]);
  assert.deepEqual(m.b, [0, 8, 12]);
  assert.equal(m.privateCount, 3);
  assert.equal(m.kib, 24);
  assert.throws(() => sandboxPages(base, [{ clone: 'A', index: -1, value: 9 }]), /out of range/);
});
test('five current clone observations are required and a later failure supersedes a pass', () => {
  const names = ['clock', 'kernel randomness', 'application state', 'network', 'control'],
    rows = names.map((name) => ({ name, generation: 4, status: 'Pass' }));
  assert.equal(sandboxReadiness(rows).ready, true);
  assert.equal(sandboxReadiness(rows.slice(0, 4)).ready, false);
  assert.equal(sandboxReadiness(rows.map((x) => ({ ...x, generation: 3 }))).ready, false);
  assert.equal(
    sandboxReadiness([...rows, { name: 'control', generation: 4, status: 'Fail' }]).ready,
    false,
  );
});
test('ACK stops at its delimiter and independently enforces line shape, port and length', () => {
  const valid = sandboxAck('OK 1073741824\nDATA');
  assert.equal(valid.port, 2 ** 30);
  assert.equal(valid.leftover, 'DATA');
  assert.equal(valid.consumed, 14);
  for (const x of ['OK 1073741823\n', 'OK 2147483648\n', 'OK 1073741824 junk\n', 'OK 1073741824'])
    assert.notEqual(sandboxAck(x).status, 'valid');
  assert.equal(sandboxAck('OK ' + '0'.repeat(50) + '1073741824\n').status, 'valid');
  assert.equal(sandboxAck('OK ' + '0'.repeat(51) + '1073741824\n').status, 'length');
});
test('the whole ACK shares one deadline rather than resetting on each byte', () => {
  const bytes = 'OK 1073741824\n';
  const arrival = [...bytes].map((_, i) => i * 0.16);
  assert.equal(sandboxAck(bytes, { arrival }).status, 'deadline');
  assert.equal(sandboxAck(bytes, { arrival: arrival.map((x) => x * 0.5) }).status, 'valid');
});
test('memory-only slots and synchronized CPU queues use separate resource bounds', () => {
  assert.deepEqual(sandboxCapacity(), {
    poolMiB: 229376,
    fullSlots: 112,
    privateSlots: 4587,
    sessions: 3840,
    mean: 115.19999999999999,
    admitted: 128,
    queued: 3712,
  });
  const fresh = sandboxCapacity({ cores: 96, sessionsPerCore: 20, duty: 0.04 });
  assert.equal(fresh.sessions, 1920);
  assert.equal(fresh.mean, 76.8);
  assert.equal(fresh.queued, 1824);
});
test('generation match and last reference closure are both required before capacity is free', () => {
  assert.equal(sandboxRetirement({ noticeGeneration: 5 }).retired, false);
  assert.equal(sandboxRetirement({ refs: 1 }).free, false);
  assert.equal(sandboxRetirement({ cancelled: false }).free, false);
  assert.equal(sandboxRetirement({ refs: 0 }).free, true);
});

test('reconciliation cannot free a wrong generation or an execution with one retained resource', () => {
  const owner = { tenant: 'A', id: 'S8', generation: 4 },
    done = {
      tenant: 'A',
      id: 'S8',
      generation: 4,
      running: false,
      refs: 0,
      mounted: false,
      network: false,
    };
  assert.equal(sandboxReconcile(owner, done).free, true);
  for (const delta of [
    { tenant: 'B' },
    { id: 'S9' },
    { generation: 5 },
    { running: true },
    { refs: 1 },
    { mounted: true },
    { network: true },
  ])
    assert.equal(sandboxReconcile(owner, { ...done, ...delta }).free, false);
});
