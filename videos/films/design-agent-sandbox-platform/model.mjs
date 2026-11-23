import {
  capacitySnapshot,
  cloneReadiness,
  cowSnapshot,
  motion,
  networkDecision,
  networkTrace,
  overlay,
  sandboxAck,
  sandboxCapacity,
  sandboxPages,
  sandboxRetirement,
  sum,
} from './arithmetic.mjs';
import { ids, suppliedCloneReceipts } from './fixtures.mjs';
import { track } from './construction.mjs';
import assert from 'node:assert/strict';
export const tracks = track(ids);
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      stage: step === 0 ? Math.min(3, Math.floor(q * 4)) : 3,
    };
  if (id === 'boundary')
    return {
      step,
      q,
    };
  if (id === 'cow')
    return {
      step,
      q,
      ...cowSnapshot(step, state.beatP),
    };
  if (id === 'freshness') {
    const received = step === 0 || (step === 1 && state.beatP < 0.22) ? 3 : 4,
      receipts = suppliedCloneReceipts.slice(0, received);
    return {
      step,
      q,
      receipts,
      ...cloneReadiness(receipts),
    };
  }
  if (id === 'filesystem') {
    const base = {
        'python': 'approved',
        'readme': 'base',
      },
      upper =
        step === 0
          ? {
              'readme': 'job A edit',
              'result.csv': 'A data',
            }
          : {};
    return {
      step,
      q,
      base,
      upper,
      visible: overlay(base, upper),
    };
  }
  if (id === 'network') {
    const cases = [
      {
        name: 'Approved API',
        public: true,
        approved: true,
      },
      {
        name: 'Cloud metadata',
        public: false,
        approved: false,
      },
      {
        name: 'Private subnet',
        public: false,
        approved: false,
      },
      {
        name: 'Rebound destination',
        public: false,
        approved: true,
      },
    ];
    return {
      step,
      q,
      cases: cases.map((r) => ({
        ...r,
        allow: r.public && r.approved,
      })),
      credential: step === 0 ? 'OPAQUE JOB REFERENCE' : 'SCOPED PROXY INJECTION',
    };
  }
  if (id === 'capacity')
    return {
      step,
      q,
      ...capacitySnapshot(step, state.beatP),
    };
  const phase = step === 0 ? Math.min(2, Math.floor(q * 3)) : Math.min(4, 2 + Math.floor(q * 3));
  return {
    step,
    q,
    phase,
    free: phase === 4,
  };
}
export function validateOriginalModel() {
  assert.equal(networkTrace(0, 1).decision.connect, false);
  assert.equal(networkTrace(0, 1).injected, false);
  assert.equal(networkTrace(1, 1).injected, true);
  assert.equal(
    networkDecision({
      publicAddress: true,
      allowlisted: true,
      job: 'OTHER',
      method: 'GET',
      operation: '/summarize',
    }).inject,
    false,
  );
  const copying = cowSnapshot(0, 0.4);
  assert.equal(copying.privatePage.value, 30);
  assert.equal(copying.refsA[2], copying.refsB[2]);
  assert.equal(copying.residentBytes, 7 * 4096);
  const committed = cowSnapshot(0, 0.6);
  assert.notEqual(committed.refsA[2], committed.refsB[2]);
  assert.equal(committed.a[2], 99);
  assert.equal(committed.b[2], 30);
  for (const step of [0, 1])
    for (const p of [0, 0.12, 0.3, 0.4, 0.5, 0.88, 1]) {
      const v = capacitySnapshot(step, p);
      assert.equal(sum(v.slotGroups), v.capacity);
      assert.equal(sum(v.queueGroups), v.queued);
      assert.equal(v.running + v.queued, v.burstJobs);
      assert(v.running <= v.cores);
    }
  assert.equal(capacitySnapshot(1, 1).queued, 3712);
  const c = sampleModel('cow', {
    beat: 0,
    beatP: 0.75,
  });
  assert.equal(c.a[2], 99);
  assert.equal(c.b[2], 30);
  assert.equal(c.base[2], 30);
  assert.equal(c.privatePages, 1);
  assert.equal(
    sampleModel('cow', {
      beat: 0,
      beatP: 0.1,
    }).privatePages,
    0,
  );
  assert.equal(
    sampleModel('cow', {
      beat: 1,
      beatP: 0,
    }).a[2],
    99,
  );
  assert.deepEqual(
    overlay(
      {
        a: 1,
        b: 2,
      },
      {
        b: 3,
        c: 4,
      },
    ),
    {
      a: 1,
      b: 3,
      c: 4,
    },
  );
  assert(
    !sampleModel('freshness', {
      beat: 0,
      beatP: 0.99,
    }).ready,
  );
  assert(
    !sampleModel('freshness', {
      beat: 1,
      beatP: 0.1,
    }).ready,
  );
  assert(
    sampleModel('freshness', {
      beat: 1,
      beatP: 0.3,
    }).ready,
  );
  assert(!cloneReadiness(suppliedCloneReceipts.slice(0, 3)).ready);
  assert(
    !cloneReadiness(
      suppliedCloneReceipts.map((r) => ({
        ...r,
        clone: 'another-clone',
      })),
    ).ready,
  );
  assert(
    !cloneReadiness([
      ...suppliedCloneReceipts,
      {
        ...suppliedCloneReceipts[3],
        status: 'Fail',
      },
    ]).ready,
  );
  assert(cloneReadiness(suppliedCloneReceipts).ready);
  assert.equal(
    sampleModel('capacity', {
      beat: 0,
      beatP: 0,
    }).capacity,
    4587,
  );
  assert.equal(
    sampleModel('capacity', {
      beat: 0,
      beatP: 0.9,
    }).capacity,
    1146,
  );
  assert.equal(
    sampleModel('capacity', {
      beat: 1,
      beatP: 0,
    }).capacity,
    1146,
  );
  assert(
    !sampleModel('retirement', {
      beat: 0,
      beatP: 0.99,
    }).free,
  );
  assert(
    sampleModel('retirement', {
      beat: 1,
      beatP: 0.99,
    }).free,
  );
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(
    sandboxPages(
      [10, 20, 30],
      [
        {
          clone: 'A',
          index: 1,
          value: 99,
        },
      ],
    ).kib,
    16,
  );
  assert.equal(
    sandboxPages(
      [4, 8, 12],
      [
        {
          clone: 'A',
          index: 0,
          value: 99,
        },
        {
          clone: 'A',
          index: 2,
          value: 41,
        },
      ],
    ).kib,
    20,
  );
  assert.equal(
    sandboxRetirement({
      refs: 1,
    }).free,
    false,
  );
  assert.equal(
    sandboxRetirement({
      noticeGeneration: 5,
    }).retired,
    false,
  );
  assert.equal(sandboxAck('OK 1073741824\nPAYLOAD').leftover, 'PAYLOAD');
  assert.equal(sandboxCapacity().queued, 3712);
  return true;
}
