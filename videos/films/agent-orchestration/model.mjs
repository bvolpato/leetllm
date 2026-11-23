import { digest, readSchedule } from './arithmetic.mjs';
import { RECEIPTS, REQUEST, values } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function merge(receipts, now = 1000, request = REQUEST) {
  assert.equal(receipts.length, 3);
  assert.equal(new Set(receipts.map((r) => r.branch)).size, 3);
  for (const receipt of receipts) {
    assert(Object.hasOwn(values, receipt.branch));
    for (const key of ['tenant', 'request', 'release', 'version'])
      assert.equal(receipt[key], request[key]);
    assert(now - receipt.time >= 0 && now - receipt.time <= 60);
    assert.equal(receipt.digest, digest(values[receipt.branch]));
    assert.deepEqual(receipt.value, values[receipt.branch]);
  }
  const by = Object.fromEntries(receipts.map((r) => [r.branch, r.value]));
  return (
    Number.isInteger(request.traffic) &&
    request.traffic >= 0 &&
    request.traffic <= 100 &&
    by.eval.failures / by.eval.cases <= 0.03 &&
    by.health.errors / by.health.requests <= 0.001 &&
    request.traffic <= by.policy.maxTraffic
  );
}
export function proposal(receipts = RECEIPTS, request = REQUEST) {
  assert(merge(receipts, 1000, request), 'Evidence must pass the proposal policy');
  const evidence = [...receipts]
    .sort((a, b) => a.branch.localeCompare(b.branch))
    .map((receipt) => ({
      branch: receipt.branch,
      tenant: receipt.tenant,
      request: receipt.request,
      release: receipt.release,
      version: receipt.version,
      time: receipt.time,
      value: receipt.value,
      digest: receipt.digest,
    }));
  return {
    ...request,
    evidenceDigest: digest(evidence),
  };
}
export function canWrite(approval, liveVersion, request = proposal()) {
  return (
    typeof request.evidenceDigest === 'string' &&
    /^[a-f0-9]{64}$/.test(request.evidenceDigest) &&
    ['tenant', 'request', 'release', 'version', 'traffic', 'evidenceDigest'].every(
      (key) => approval?.[key] === request[key],
    ) &&
    approval.approved === true &&
    liveVersion === request.version
  );
}
export function operationTarget() {
  const saved = new Map();
  let effects = 0;
  return {
    apply(key, packet, approval, live) {
      const fingerprint = digest(packet);
      if (saved.has(key)) {
        const entry = saved.get(key);
        assert.equal(entry.fingerprint, fingerprint);
        return entry.result;
      }
      assert(canWrite(approval, live, packet));
      const result = {
        operation: key,
        change: 'change-' + ++effects,
        version: live,
        traffic: packet.traffic,
      };
      saved.set(key, {
        fingerprint,
        result,
      });
      return result;
    },
    get effects() {
      return effects;
    },
  };
}
export const freshPacket = proposal(
  RECEIPTS.map((receipt) => ({
    ...receipt,
    version: 4,
  })),
  {
    ...REQUEST,
    version: 4,
  },
);
export const target = operationTarget();
export const recorded = target.apply(
  'op-18',
  freshPacket,
  {
    ...freshPacket,
    approved: true,
  },
  4,
);
export const recordedEffects = target.effects;
export const reconciled = target.apply(
  'op-18',
  freshPacket,
  {
    ...freshPacket,
    approved: true,
  },
  4,
);
export const reconciledEffects = target.effects;
export function validateModel() {
  assert.deepEqual(
    readSchedule(1)
      .branches.filter((row) => row.complete)
      .map((row) => row.id),
    ['Policy'],
  );
  assert.equal(readSchedule(2.5).allReads, false);
  assert.equal(readSchedule(3).allReads, true);
  assert.equal(readSchedule(3).mergeComplete, false);
  assert.equal(readSchedule(3.5).mergeComplete, true);
  assert.deepEqual(recorded, reconciled);
  assert.equal(recordedEffects, 1);
  assert.equal(reconciledEffects, 1);
  assert.throws(() =>
    target.apply(
      'op-18',
      {
        ...freshPacket,
        traffic: 50,
      },
      {
        ...freshPacket,
        approved: true,
      },
      4,
    ),
  );
  const deniedTarget = operationTarget();
  assert.throws(() =>
    deniedTarget.apply(
      'denied',
      freshPacket,
      {
        ...freshPacket,
        approved: false,
      },
      4,
    ),
  );
  assert.equal(deniedTarget.effects, 0);
  assert(merge(RECEIPTS));
  assert.equal(
    merge(RECEIPTS, 1000, {
      ...REQUEST,
      traffic: -1,
    }),
    false,
  );
  assert.equal(
    merge(RECEIPTS, 1000, {
      ...REQUEST,
      traffic: 1.5,
    }),
    false,
  );
  assert.throws(() => merge(RECEIPTS.slice(0, 2)));
  assert.throws(() => merge([RECEIPTS[0], RECEIPTS[0], RECEIPTS[2]]));
  assert.throws(() =>
    merge(
      RECEIPTS.map((r, i) =>
        i === 1
          ? {
              ...r,
              tenant: 'tenant9',
            }
          : r,
      ),
    ),
  );
  assert.throws(() => merge(RECEIPTS, 1200));
  assert.equal([2, 3, 1].reduce((a, b) => a + b, 0) + 0.5, 6.5);
  assert.equal(Math.max(2, 3, 1) + 0.5, 3.5);
  const packet = proposal(),
    approval = {
      ...packet,
      approved: true,
    };
  assert.deepEqual(proposal([...RECEIPTS].reverse()), packet);
  assert(canWrite(approval, 3));
  assert.equal(canWrite(approval, 4), false);
  assert.equal(
    canWrite(
      {
        ...approval,
        traffic: 50,
      },
      3,
    ),
    false,
  );
  assert.equal(
    canWrite(approval, 3, {
      ...packet,
      request: 'release-18',
    }),
    false,
  );
  assert.equal(
    canWrite(approval, 3, {
      ...packet,
      evidenceDigest: '0'.repeat(64),
    }),
    false,
  );
  assert.equal(
    canWrite(
      {
        ...approval,
        evidenceDigest: undefined,
      },
      3,
    ),
    false,
  );
  const fresh = proposal(
    RECEIPTS.map((receipt) => ({
      ...receipt,
      version: 4,
    })),
    {
      ...REQUEST,
      version: 4,
    },
  );
  assert(
    canWrite(
      {
        ...fresh,
        approved: true,
      },
      4,
      fresh,
    ),
  );
  assert.equal(canWrite(approval, 4, fresh), false);
  assert.equal(4 / 10000, 0.0004);
}
