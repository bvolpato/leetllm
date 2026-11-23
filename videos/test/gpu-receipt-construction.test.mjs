import test from 'node:test';
import assert from 'node:assert/strict';
import {
  admissionChecks,
  classifyGpuReceipt,
  gpuReceiptFixtures,
  freshGpuReceipt,
  memoryReceipt,
  historyRing,
  gpuIncident,
  readmission,
  gpuFrame,
} from '../animations/gpu-failure-operations.mjs';
test('the displayed actual receipt hypotheses retain independent process obligations', () => {
  assert.deepEqual(
    gpuReceiptFixtures.map((r) => classifyGpuReceipt(r).hypothesis),
    [
      'allocator-fragmentation',
      'application-capacity',
      'outside-pytorch',
      'device-memory-fault',
      'fabric-fault',
      'clock-limited',
      'process-corrupted',
      'driver-runtime',
    ],
  );
  const joined = classifyGpuReceipt(
    freshGpuReceipt({ new_xids: [31], cuda_error: 'launch_failure' }),
  );
  assert.equal(joined.hypothesis, 'xid-event');
  assert(joined.mustRelaunch);
  const memory = classifyGpuReceipt(
    freshGpuReceipt({ dcgm_findings: ['memory'], cuda_error: 'illegal_address' }),
  );
  assert.equal(memory.hypothesis, 'device-memory-fault');
  assert(memory.mustRelaunch);
});
test('identical memory can describe success,unresolved OOM or backend-specific evidence', () => {
  const row = freshGpuReceipt();
  assert.equal(classifyGpuReceipt(row).hypothesis, 'allocator-fragmentation');
  assert.equal(classifyGpuReceipt({ ...row, cuda_error: 'success' }).hypothesis, 'unclassified');
  assert.equal(classifyGpuReceipt({ ...row, oom_request_gib: null }).hypothesis, 'oom-unresolved');
  assert.equal(
    classifyGpuReceipt({ ...row, allocator_backend: 'cudaMallocAsync' }).hypothesis,
    'oom-unresolved',
  );
  assert.deepEqual(memoryReceipt(row), { gap: 6, other: 1, outside: 3.5, free: 2.5, deficit: 0.5 });
  assert.equal(classifyGpuReceipt({ ...row, nvml_device_used_gib: null }).outside, null);
  assert.throws(() => classifyGpuReceipt({ ...row, oom_request_gib: true }));
  assert.throws(() => classifyGpuReceipt({ ...row, pytorch_allocated_gib: 27 }));
});
test('finite history overwrites oldest occurrences and quiet windows do not clear incident state', () => {
  const ring = historyRing(['A', 'B', 'C', 'D', 'E', 'F'], 4);
  assert.deepEqual(ring.retained, ['C', 'D', 'E', 'F']);
  assert.deepEqual(ring.overwritten, ['A', 'B']);
  assert.equal(ring.pointer, 2);
  let records = [];
  for (const key of ['A', 'A', 'B', 'A', 'B'])
    records = gpuIncident(records, { key, kind: 'fault' });
  assert.deepEqual(
    records.map((r) => [r.key, r.recurrence, r.quarantined]),
    [
      ['A', 3, true],
      ['B', 2, true],
    ],
  );
  assert.deepEqual(gpuIncident(records, { key: 'A', kind: 'quiet' }), records);
  assert.deepEqual(gpuIncident(records, { key: 'A', kind: 'unknown' }), records);
});
test('all eight gate groups and both owner approvals precede a distinct readmission transition', () => {
  assert.equal(admissionChecks.length, 8);
  const owner = 'GPU-0/new-process',
    receipts = admissionChecks.map((check) => ({ owner, check, status: 'Pass' })),
    approval = { workload: true, platform: true };
  assert.equal(readmission(receipts, owner).eligible, true);
  assert.equal(readmission(receipts, owner).quarantined, true);
  assert(readmission(receipts, owner, { workload: true }).quarantined);
  assert(!readmission(receipts, owner, approval).quarantined);
  assert(readmission(receipts.slice(0, -1), owner, approval).quarantined);
  assert(readmission(receipts, 'other-process', approval).quarantined);
  const held = gpuIncident([], { key: 'A', kind: 'fault' });
  assert(gpuIncident(held, { key: 'A', kind: 'readmit', receipts, owner })[0].quarantined);
  assert.equal(
    gpuIncident(held, { key: 'A', kind: 'readmit', receipts, owner, approval })[0].quarantined,
    false,
  );
});
test('fresh computed answers stay behind their exact narration cues', () => {
  const f = gpuFrame({
    beat: 1,
    beatP: 0.9,
    cues: {
      'gpu-fresh-free': { phase: 'after', progress: 1 },
      'gpu-fresh-hypothesis': { phase: 'before', progress: 0 },
    },
  });
  assert(f.started('gpu-fresh-free', 1));
  assert.equal(f.started('gpu-fresh-hypothesis', 1), false);
});
