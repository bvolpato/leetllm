import { deficit, deficitPlayback, quota, reserveWholePages, sum } from './arithmetic.mjs';
import {
  MULTITENANT_REQUESTS,
  duplicateCue,
  quotaReceipt,
  settlementEnd,
  settlementStart,
} from './fixtures.mjs';
import {
  applyQuotaCompletion,
  reconcileRecovery,
  recoveryCompletionEvidence,
} from './protocols.mjs';
import { multiTenantConstructionModel } from './model.mjs';
import { sampleModel } from './observations.mjs';
import { locatePosition, privateHistory } from './page-pool.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  for (const stage of [0, 1, 2]) {
    const s = quota(stage);
    assert.equal(s.available + s.held + s.settled, 1000);
  }
  assert.equal(quota(2).available, 580);
  for (const [beat, beatP, expected] of [
    [0, 0, [1000, 0, 0]],
    [0, 1, [300, 700, 0]],
    [1, 0, [300, 700, 0]],
    [1, 0.9, [580, 0, 420]],
  ]) {
    const s = sampleModel('quota', {
      beat,
      beatP,
    });
    assert.deepEqual([s.available, s.held, s.settled], expected);
    assert.equal(s.available + s.held + s.settled, 1000);
  }
  const initial = {
      balance: quota(1),
      receipt: null,
    },
    complete = applyQuotaCompletion(initial, quotaReceipt),
    duplicate = applyQuotaCompletion(complete, quotaReceipt);
  assert.deepEqual(complete.balance, quota(2));
  assert.deepEqual(duplicate.balance, complete.balance);
  assert(duplicate.duplicate);
  assert.equal(initial.balance.held, 700);
  assert.throws(
    () =>
      applyQuotaCompletion(initial, {
        ...quotaReceipt,
        fingerprint: 'another-request',
      }),
    /fingerprint/,
  );
  assert.throws(
    () =>
      applyQuotaCompletion(complete, {
        ...quotaReceipt,
        output: 121,
      }),
    /Conflicting completion usage/,
  );
  assert.throws(
    () =>
      applyQuotaCompletion(initial, {
        ...quotaReceipt,
        input: '300',
      }),
    /Invalid trusted usage/,
  );
  const before = sampleModel('quota', {
      beat: 1,
      beatP: duplicateCue - 0.001,
    }),
    after = sampleModel('quota', {
      beat: 1,
      beatP: duplicateCue + 0.001,
    });
  assert(!before.duplicate);
  assert(after.duplicate);
  for (const s of [
    before,
    after,
    sampleModel('quota', {
      beat: 1,
      beatP: settlementEnd + 0.001,
    }),
  ])
    assert.deepEqual([s.available, s.held, s.settled], [580, 0, 420]);
  const mid = sampleModel('quota', {
    beat: 1,
    beatP: (settlementStart + settlementEnd) / 2,
  });
  assert(mid.transition && mid.held > 0 && mid.settled > 0);
  for (let i = 0; i <= 100; i++) {
    const s = sampleModel('quota', {
      beat: 1,
      beatP: i / 100,
    });
    assert.equal(s.available + s.held + s.settled, 1000);
  }
  const s = sampleModel('pages', {
    beat: 0,
    beatP: 0.5,
  });
  assert.equal(sum(s.used), 78);
  assert.equal(s.pageMiB, 5);
  assert.deepEqual(deficit(3).served, {
    A: 12,
    B: 6,
  });
  assert.deepEqual(deficit(3).jobs, {
    A: 4,
    B: 6,
  });
  assert(
    !sampleModel('identity', {
      beat: 1,
      beatP: 0.2,
    }).allowed,
  );
  assert(
    sampleModel('identity', {
      beat: 1,
      beatP: 0.9,
    }).allowed,
  );
  const c = sampleModel('cost', {
    beat: 0,
    beatP: 0.5,
  });
  assert(Math.abs(c.a + c.b - c.cost) < 1e-15);
  assert.equal(c.wrong / c.cost, 4);
  assert.equal(
    sampleModel('recovery', {
      beat: 0,
      beatP: 0.9,
    }).held,
    700,
  );
  assert.equal(
    sampleModel('fairness', {
      beat: 0,
      beatP: 0.99,
    }).rounds,
    0,
  );
  const recovered = reconcileRecovery(
    {
      balance: quota(1),
      receipt: null,
    },
    recoveryCompletionEvidence(),
  );
  assert(recovered.accepted);
  assert.deepEqual(recovered.ledger.balance, quota(2));
  assert(
    !reconcileRecovery(
      {
        balance: quota(1),
        receipt: null,
      },
      {
        ...recoveryCompletionEvidence(),
        quiescent: false,
      },
    ).accepted,
  );
  for (const [beatP, rounds] of [
    [0, 0],
    [0.2, 1],
    [0.35, 2],
    [0.5, 3],
  ]) {
    const f = sampleModel('fairness', {
      beat: 1,
      beatP,
    });
    assert.equal(f.rounds, rounds);
    for (const tenant of ['A', 'B'])
      assert.equal(
        f.credit[tenant] + f.served[tenant],
        f.creditedRounds * (tenant === 'A' ? 4 : 2),
      );
  }
  for (let i = 0; i <= 300; i++) {
    const f = deficitPlayback(i / 100);
    for (const tenant of ['A', 'B'])
      assert.equal(
        f.credit[tenant] + f.served[tenant],
        f.creditedRounds * (tenant === 'A' ? 4 : 2),
      );
    assert(f.credit.A >= 0 && f.credit.B >= 0);
  }
  assert.deepEqual(deficitPlayback(3).served, deficit(3).served);
  assert.deepEqual(deficitPlayback(3).jobs, {
    A: 4,
    B: 6,
  });
  return true;
}
export function validateConstructionModel() {
  const initial = privateHistory();
  assert.equal(sum(initial.pages.map((p) => p.used)), 78);
  assert.deepEqual(locatePosition(initial.tables.B, 32), { page: 3, slot: 15 });
  const waiting = privateHistory({ bTokens: 32 });
  assert.equal(waiting.freePages, 0);
  assert.equal(waiting.pages[4].used, 15);
  assert.equal(locatePosition(waiting.tables.B, 33), null);
  assert.throws(() => privateHistory({ bTokens: 33 }), /owned page/);
  assert.throws(() => privateHistory({ bTokens: 32, reassigned: true }), /A reader/);
  assert.equal(privateHistory({ bTokens: 32, retired: true }).freePages, 3);
  const handedOff = privateHistory({ bTokens: 32, retired: true, reassigned: true });
  assert.equal(handedOff.pages[4].used, 0);
  const written = privateHistory({ bTokens: 33, retired: true, reassigned: true });
  assert.deepEqual(locatePosition(written.tables.B, 33), { page: 4, slot: 0 });
  assert.equal(written.pages[4].used, 1);
  assert.equal(written.freePages, 2);
  const fixed = {
    input: 240,
    outputCap: 360,
  };
  assert.equal(reserveWholePages(16n, 1n), 2n);
  assert.equal(reserveWholePages(2n ** 54n + 1n, 0n), 2n ** 50n + 1n);
  assert.equal(
    MULTITENANT_REQUESTS.filter((r) => r.complete && r.first <= 800 && r.gap <= 120).length,
    3,
  );
  for (const p of [0, 0.2, 0.9, 1, 0.3, 1])
    for (const beat of [0, 1, 2, 3]) {
      const s = multiTenantConstructionModel('fresh-design-gate', {
        beat,
        beatP: p,
      });
      assert.equal(s.balance.available + s.balance.held + s.balance.settled, 1500);
      assert.equal(s.input, fixed.input);
      assert.equal(s.outputCap, fixed.outputCap);
      if (beat === 2) assert.equal(s.physicalReusable, false);
    }
  const terminal = multiTenantConstructionModel('fresh-design-gate', {
    beat: 3,
    beatP: 1,
  });
  assert.deepEqual(terminal.balance, {
    available: 1170,
    held: 0,
    settled: 330,
  });
  assert.equal(terminal.pages, 38);
  assert.equal(terminal.refund, 270);
  for (const progress of [0.001, 0.9, 0.99999]) {
    const s = multiTenantConstructionModel('fresh-design-gate', {
      beat: 1,
      cues: Object.fromEntries(
        [
          [
            'mt-fresh-design-gate-s1-0',
            {
              phase: 'during',
              progress,
            },
          ],
          [
            'mt-fresh-design-gate-s1-2',
            {
              phase: 'before',
            },
          ],
          [
            'mt-fresh-design-gate-s2-2',
            {
              phase: 'before',
            },
          ],
          [
            'mt-fresh-design-gate-s3-2',
            {
              phase: 'before',
            },
          ],
          [
            'mt-fresh-design-gate-b1',
            {
              phase: 'during',
              progress,
            },
          ],
        ].map((x) => x),
      ),
    });
    assert.equal(s.reserved, false);
    assert.equal(s.pageAnswer, false);
  }
  return true;
}
export function validateModel() {
  validateOriginalModel();
  validateConstructionModel();
  return true;
}
