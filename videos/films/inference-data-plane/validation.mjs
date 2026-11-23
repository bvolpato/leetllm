import { allocate, eligibleWorker, sameLayout, traceWithQueue } from './arithmetic.mjs';
import {
  cacheBytes,
  compatible,
  completedAttempt,
  events,
  expectedBlockIds,
  expiredAttempt,
  fullyQuiescentAttempt,
  segmentData,
} from './fixtures.mjs';
import { lifecycleSnapshot, payloadProduct } from './construction.mjs';
import {
  acceptCompletion,
  completeUniqueCoverage,
  localityRouteSnapshot,
  mayCommit,
  mayReclaim,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(localityRouteSnapshot(0).selected.id, 'A');
  assert.equal(localityRouteSnapshot(1, 'P8').selected.id, 'A');
  assert(localityRouteSnapshot(1, 'P8').rows.every((row) => row.reused === 0));
  const localChoice = localityRouteSnapshot(1);
  assert.equal(localChoice.selected.id, 'C');
  assert.equal(localChoice.selected.reused, 36);
  assert.equal(localChoice.selected.missing, 12);
  assert(Math.abs(localChoice.selected.cost - 2.8) < 1e-12);
  for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
    const model = localityRouteSnapshot(progress);
    assert(model.selected.eligible);
    assert.equal(model.rows[1].eligible, false);
    assert.equal(model.rows[1].cost, null);
    for (const row of model.rows.filter((row) => row.eligible)) {
      assert.equal(row.reused + row.missing, 48);
      assert.equal(row.cost, row.setup + row.missing / row.rate);
    }
  }
  assert.deepEqual(lifecycleSnapshot(0, 0.5).completed, [
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
  assert.deepEqual(lifecycleSnapshot(0, 0.7).completed, [
    true,
    true,
    true,
    true,
    false,
    false,
    false,
  ]);
  assert.equal(lifecycleSnapshot(1, 0.5).current, 5);
  assert.equal(lifecycleSnapshot(1, 0.8).current, 6);
  for (let beat = 0; beat < 3; beat++)
    for (let i = 0; i <= 100; i++) {
      const trace = lifecycleSnapshot(beat, i / 100);
      for (let j = 1; j < 7; j++) if (trace.completed[j]) assert(trace.completed[j - 1]);
    }
  assert.equal(payloadProduct(0, 0.99).visible, 6);
  assert.equal(payloadProduct(1, 0).product, null);
  assert.equal(payloadProduct(1, 0.5).product, 32768);
  assert.equal(payloadProduct(2, 0).complete, true);
  assert.equal(cacheBytes, 32768);
  assert.equal(cacheBytes / 1024, 32);
  assert.equal(sameLayout(compatible.source, compatible.workerA), true);
  assert.equal(sameLayout(compatible.source, compatible.workerB), false);
  assert.equal(eligibleWorker(compatible.source, compatible.workerA, 48), true);
  assert.equal(eligibleWorker(compatible.source, compatible.workerA, 61), false);
  assert.equal(eligibleWorker(compatible.source, compatible.workerB, 48), false);
  assert.deepEqual(allocate(64, [48, 24]), [true, false]);
  assert.deepEqual(events, [
    'queued',
    'reserved',
    'transferring',
    'transfer-complete',
    'decode-ready',
    'generated',
    'delivered',
  ]);
  assert.equal(completeUniqueCoverage(completedAttempt), true);
  assert.equal(mayCommit(completedAttempt), true);
  for (const [key, value] of [
    ['layout', 'TP1'],
    ['dtype', 'fp16'],
    ['blocks', 'dense-v1'],
  ]) {
    assert.equal(
      mayCommit({
        ...completedAttempt,
        manifest: {
          ...completedAttempt.manifest,
          [key]: value,
        },
      }),
      false,
    );
  }
  assert.equal(
    mayCommit({
      ...completedAttempt,
      visibility: 'pending',
    }),
    false,
  );
  assert.equal(
    mayCommit({
      ...completedAttempt,
      segmentData: {
        ...segmentData,
        [expectedBlockIds[0]]: Buffer.from('corrupted bytes'),
      },
    }),
    false,
  );
  assert.equal(completeUniqueCoverage(expiredAttempt), false);
  assert.equal(
    mayCommit({
      ...completedAttempt,
      expected: expectedBlockIds.slice(0, 4),
      received: expectedBlockIds.slice(0, 4),
    }),
    false,
  );
  assert.equal(
    mayCommit({
      ...completedAttempt,
      expected: [...expectedBlockIds.slice(0, 5), 'foreign-segment'],
    }),
    false,
  );
  assert.equal(mayCommit(expiredAttempt), false);
  assert.equal(mayReclaim(expiredAttempt), false);
  assert.equal(mayReclaim(fullyQuiescentAttempt), true);
  assert.equal(expiredAttempt.chargedBlocks, 48);
  assert.equal(
    mayCommit({
      ...completedAttempt,
      received: [...expectedBlockIds.slice(0, 5), expectedBlockIds[0]],
    }),
    false,
  );
  assert.equal(
    mayCommit({
      ...completedAttempt,
      received: [...expectedBlockIds, expectedBlockIds[0]],
    }),
    false,
  );
  const owner = {
    request: '4219',
    operation: 'op-17',
    generation: 4,
    model: 'M17/rev5',
    reservation: 'lease-12',
  };
  const receipt = {
    ...completedAttempt,
    ...owner,
  };
  assert.equal(acceptCompletion(owner, receipt), true);
  for (const key of Object.keys(owner))
    assert.equal(
      acceptCompletion(owner, {
        ...receipt,
        [key]: 'stale',
      }),
      false,
    );
  assert.equal(
    mayReclaim({
      ...expiredAttempt,
      transportQuiescent: true,
    }),
    false,
  );
  assert.equal(
    mayReclaim({
      ...expiredAttempt,
      consumersQuiescent: true,
    }),
    false,
  );
  const baseline = traceWithQueue(0),
    delayed = traceWithQueue(25);
  assert.equal(baseline.at(-1).end, 400);
  assert.equal(delayed.at(-1).end - baseline.at(-1).end, 25);
  assert.equal(baseline[0].end, 180);
  assert.equal(baseline[0].end > baseline[3].start, true);
  assert.ok(baseline[3].start >= 150);
  assert.equal(delayed[3].start - baseline[3].start, 25);
  assert.equal(delayed[3].end - baseline[3].end, 25);
  for (const delay of [0, 0.5, 6.25, 12.5, 18.75, 25]) {
    const trace = traceWithQueue(delay);
    assert.equal(trace[2].end - trace[2].start, delay);
    assert.equal(trace.at(-1).end - baseline.at(-1).end, delay);
  }
  assert.equal(delayed[3].end - delayed[3].start, baseline[3].end - baseline[3].start);
  return true;
}
