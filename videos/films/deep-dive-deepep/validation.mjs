import {
  bf16,
  communicationBudget,
  deferredWaitTrace,
  destinationExpectation,
  redundantGradient,
} from './arithmetic.mjs';
import {
  chapterModel,
  combineTrace,
  dispatchExpansionSnapshot,
  sampleModel,
} from './construction.mjs';
import {
  combine,
  expertThreeReplay,
  ledger,
  resolveAlignedSlot,
  routeReplayComparison,
  roundTripAligned,
  weightedExpertRow,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateChapterModel();
  const { cached, rebuilt } = routeReplayComparison();
  assert.deepEqual([cached.returnedRows, rebuilt.returnedRows], [8, 8]);
  assert.deepEqual([cached.destinations, rebuilt.destinations], [8, 7]);
  assert.deepEqual(rebuilt.counts, [1, 2, 3, 2]);
  assert.deepEqual(cached.restored.a, [1.9, 0]);
  assert.deepEqual(rebuilt.restored.a, [3.3, 0]);
  const replay = expertThreeReplay();
  assert.deepEqual(replay.paired.a, cached.restored.a);
  assert.deepEqual(replay.detached.a, [2.5, 1.8]);
  assert.equal(combineTrace(2, 0).count, 0);
  assert.deepEqual(
    combineTrace(2, 1).output,
    sampleModel('combine', {
      beat: 2,
      beatP: 0,
    }).output,
  );
  assert.equal(dispatchExpansionSnapshot(0.1).rows, 0);
  assert.equal(dispatchExpansionSnapshot(0.3).rows, 1);
  assert.equal(dispatchExpansionSnapshot(0.45).expanded, 1);
  assert.deepEqual(dispatchExpansionSnapshot(0.6).expertRows, [2, 3]);
  assert.equal(ledger().slots.length, 8);
  assert.equal(ledger().destinations, 8);
  assert.equal(
    sampleModel('dispatch', {
      beat: 1,
      beatP: 0,
    }).destinations,
    7,
  );
  assert.equal(
    sampleModel('dispatch', {
      beat: 1,
      beatP: 0,
    }).slots.length,
    8,
  );
  assert.equal(
    sampleModel('dispatch', {
      beat: 2,
      beatP: 0,
    }).slots.length,
    7,
  );
  for (const beatP of [0, 0.5, 0.99]) {
    const masked = sampleModel('dispatch', {
      beat: 2,
      beatP,
    });
    assert.deepEqual(masked.choices.a, [
      [2, 0.7],
      [-1, 0.3],
    ]);
    assert.equal(masked.destinations, 7);
    assert.deepEqual(masked.counts, [1, 2, 3, 1]);
  }
  const layout = sampleModel('layout', {
    beat: 1,
    beatP: 0,
  });
  assert.deepEqual(layout.starts, [0, 4]);
  assert.deepEqual(layout.endpoints, [3, 5]);
  assert.equal(layout.capacity, 8);
  assert.equal(layout.valid.filter(Boolean).length, 4);
  assert.equal(layout.valid[3], false);
  assert.deepEqual(
    [...layout.inverse],
    [
      [0, 'T0'],
      [1, 'T1'],
      [2, 'T2'],
      [4, 'T3'],
    ],
  );
  assert.throws(() => resolveAlignedSlot(layout, 3, 999), {
    message: 'No source identity for aligned slot 3',
  });
  assert.deepEqual(resolveAlignedSlot(layout, 4, 40), {
    token: 'T3',
    value: 40,
  });
  const validResults = layout.records.map((record) => ({
    slot: record.slot,
    value: record.value,
  }));
  assert.deepEqual(roundTripAligned(layout, validResults), {
    T0: 10,
    T1: 20,
    T2: 30,
    T3: 40,
  });
  assert.deepEqual(roundTripAligned(layout, [...validResults].reverse()), {
    T0: 10,
    T1: 20,
    T2: 30,
    T3: 40,
  });
  assert.throws(
    () =>
      roundTripAligned(layout, [
        ...validResults,
        {
          slot: 3,
          value: 999,
        },
      ]),
    {
      message: 'No source identity for aligned slot 3',
    },
  );
  assert.equal(
    sampleModel('layout', {
      beat: 0,
      beatP: 0,
    }).attempt.accepted,
    true,
  );
  for (const beatP of [0, 0.5, 0.99]) {
    const padded = sampleModel('layout', {
      beat: 2,
      beatP,
    });
    assert.equal(padded.attempt.slot, 3);
    assert.equal(padded.rejectedPadding, true);
    assert.equal(padded.attempt.error, 'No source identity for aligned slot 3');
    assert.deepEqual(padded.restored, {
      T0: 10,
      T1: 20,
      T2: 30,
      T3: 40,
    });
  }
  const result = sampleModel('combine', {
    beat: 2,
    beatP: 0,
  }).output;
  assert(Math.abs(result.a[0] - 1.9) < 1e-12);
  assert(Math.abs(result.b[1] - 2.4) < 1e-12);
  assert.deepEqual(result.d, [5, -2.5]);
  assert.deepEqual(
    result,
    sampleModel('combine', {
      beat: 1,
      beatP: 0,
    }).output,
  );
  const data = ledger(),
    inverse = new Map(data.slots.map((v) => [v.key, v.token])),
    rows = data.slots.map((v) => ({
      key: v.key,
      value: v.raw,
    }));
  assert.throws(() => combine(rows.slice(1), inverse));
  assert.throws(() => combine([...rows, rows[0]], inverse));
  assert.throws(() =>
    combine(
      [
        ...rows.slice(0, -1),
        {
          key: '0:3',
          value: [999, 999],
        },
      ],
      inverse,
    ),
  );
  assert.equal(bf16(257), 256);
  assert.equal(bf16(bf16(257) - 256), 0);
  assert.equal(bf16(257 - 256), 1);
  for (const beatP of [0, 0.5, 0.99]) {
    const accounting = sampleModel('topology', {
      beat: 2,
      beatP,
    });
    assert.equal(accounting.logical, 100 * 2 ** 20);
    assert.equal(accounting.remoteRate, 52.4288);
    assert.equal(accounting.logicalRate, 104.8576);
  }
  const precision = sampleModel('precision', {
    beat: 1,
    beatP: 0,
  });
  assert.equal(precision.scaleBytes, 224);
  assert.equal(precision.fp8, 7392);
  const events = sampleModel('events', {
    beat: 2,
    beatP: 0,
  });
  assert.equal(events.first.length, 4);
  assert.equal(events.second, null);
  assert.equal(events.waitCalls, 2);
  const resources = sampleModel('resources', {
    beat: 1,
    beatP: 0,
  });
  assert.equal(resources.expected, 5 / 3);
  assert.equal(resources.direct, 9);
  assert.equal(resources.hybridRequested, 193);
  assert.equal(resources.hybrid, 128);
  return true;
}
export function validateChapterModel() {
  assert.deepEqual(
    weightedExpertRow([2, -1], [1, 2], [0.2, 0.8]).output,
    [5.6000000000000005, -2.8000000000000003],
  );
  assert.deepEqual(
    weightedExpertRow([2, -1], [0, 3], [0.2, 0.8]).output,
    [6.800000000000001, -3.4000000000000004],
  );
  assert.deepEqual(
    chapterModel('backward-operators', {
      beat: 1,
    }).inputGradient,
    [3.8, 1.9],
  );
  assert.deepEqual(
    chapterModel('backward-operators', {
      beat: 1,
    }).gateGradient,
    [2, 8],
  );
  assert.equal(destinationExpectation(4, 2, 2), 5 / 3);
  assert(Math.abs(destinationExpectation(6, 3, 2) - 1.8) < 1e-12);
  assert.equal(destinationExpectation(6, 3, 0), 0);
  assert.equal(communicationBudget(15.2).sms, 20);
  assert.equal(
    communicationBudget(15.2, {
      preferOverlap: false,
    }).sms,
    64,
  );
  assert.equal(
    communicationBudget(15.2, {
      deviceSMs: 8,
    }).sms,
    8,
  );
  assert.deepEqual(deferredWaitTrace(2), {
    dependencyCalls: 2,
    hookCalls: 1,
    results: [['rows', 'indices', 'gates', 'handle'], null],
  });
  assert.throws(() => redundantGradient([2], [3], [0], [0, 1]));
  return true;
}
