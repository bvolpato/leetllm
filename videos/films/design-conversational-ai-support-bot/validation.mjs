import { hash, supportCost } from './arithmetic.mjs';
import { confirmed, documents, freshExpectedPayload, original, small } from './fixtures.mjs';
import { freshSupportCase } from './construction.mjs';
import {
  acknowledgmentMatches,
  cases,
  confirmationFrame,
  decide,
  enqueue,
  evidenceErrors,
  mergeObservation,
  packet,
  payload,
  replay,
  sampleModel,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert(
    sampleModel('state', {
      beat: 0,
      beatP: 0.9,
    }).accepted,
  );
  assert.equal(
    sampleModel('state', {
      beat: 1,
      beatP: 0.9,
    }).accepted,
    false,
  );
  assert(
    sampleModel('state', {
      beat: 2,
      beatP: 0.9,
    }).accepted,
  );
  assert.equal(
    mergeObservation(original, {
      success: true,
      customer: 'Jordan',
      invoice: original.invoice,
      revision: 4,
    }),
    false,
  );
  assert.equal(
    sampleModel('evidence', {
      beat: 0,
      beatP: 0.9,
    }).admitted.length,
    1,
  );
  assert.equal(
    sampleModel('evidence', {
      beat: 1,
      beatP: 0.9,
    }).admitted.length,
    0,
  );
  assert.equal(
    sampleModel('evidence', {
      beat: 2,
      beatP: 0.9,
    }).admitted.length,
    0,
  );
  for (const value of ['false', 'true', 1, null, undefined]) {
    assert(
      evidenceErrors(
        {
          ...documents[0],
          publisher: value,
        },
        original,
      ).includes('publication'),
    );
    assert(
      evidenceErrors(
        {
          ...documents[0],
          current: value,
        },
        original,
      ).includes('version'),
    );
  }
  assert.equal(decide(original).outcome, 'HANDOFF');
  assert.equal(decide(confirmed, false).outcome, 'ABSTAIN');
  assert.equal(
    decide({
      ...confirmed,
      age: NaN,
    }).outcome,
    'HANDOFF',
  );
  assert.equal(
    decide({
      ...original,
      amount: 50000,
    }).outcome,
    'HANDOFF',
  );
  assert.equal(decide(small).outcome, 'CONFIRM');
  assert.equal(decide(confirmed).outcome, 'QUEUE ELIGIBLE');
  assert.equal(
    decide({
      ...confirmed,
      amount: 4000,
    }).outcome,
    'CONFIRM',
  );
  assert.equal(
    decide({
      ...confirmed,
      policy: 'US-v4',
    }).outcome,
    'ABSTAIN',
  );
  assert.equal(confirmationFrame(2, 0.5).outcome, 'QUEUE ELIGIBLE');
  assert.equal(confirmationFrame(2, 0.8).outcome, 'CONFIRM');
  assert.equal(confirmationFrame(2, 0.8).confirmation.amount, 3500);
  assert.equal(confirmationFrame(2, 0.8).current.amount, 4000);
  assert.equal(
    sampleModel('parallel', {
      beat: 0,
      beatP: 0.99,
    }).duration,
    6,
  );
  assert.equal(
    sampleModel('parallel', {
      beat: 1,
      beatP: 0.99,
    }).duration,
    4,
  );
  assert(
    sampleModel('parallel', {
      beat: 1,
      beatP: 0.99,
    }).ready,
  );
  assert.equal(
    sampleModel('parallel', {
      beat: 2,
      beatP: 0.99,
    }).ready,
    false,
  );
  const timeoutCues = {
      'timeout-reads': {
        progress: 1,
      },
      'read-timeout': {
        progress: 0,
      },
    },
    timeoutApproach = sampleModel('parallel', {
      beat: 2,
      beatP: 0,
      cues: timeoutCues,
    }),
    timeoutAtCue = sampleModel('parallel', {
      beat: 2,
      beatP: 0,
      cues: {
        ...timeoutCues,
        'read-timeout': {
          progress: 0.5,
        },
      },
    }),
    timeoutRecap = sampleModel('parallel', {
      beat: 2,
      beatP: 1,
      cues: {
        ...timeoutCues,
        'read-timeout': {
          progress: 1,
        },
      },
    });
  assert.equal(timeoutApproach.time, 2);
  assert.deepEqual(
    timeoutApproach.completed.map((value) => value.id),
    ['policy'],
  );
  assert.equal(timeoutAtCue.time, 3);
  assert.equal(timeoutAtCue.duration, 3);
  assert(timeoutAtCue.timedOut);
  assert.equal(timeoutAtCue.ready, false);
  assert.deepEqual(
    timeoutAtCue.schedule.map((value) => value.lane),
    ['policy', 'invoice'],
  );
  assert.deepEqual(
    timeoutAtCue.completed.map((value) => value.id),
    ['policy'],
  );
  assert.equal(timeoutRecap.time, 3);
  assert(timeoutRecap.timedOut);
  assert.equal(timeoutRecap.ready, false);
  const store = [];
  assert.equal(enqueue(store, 'one', payload(confirmed)).status, 'INSERTED');
  assert.equal(enqueue(store, 'one', payload(confirmed)).status, 'RECOVERED');
  assert.equal(
    enqueue(store, 'one', Object.fromEntries(Object.entries(payload(confirmed)).reverse())).status,
    'RECOVERED',
  );
  assert.equal(
    enqueue(store, 'one', {
      ...payload(confirmed),
      amount: 4000,
    }).status,
    'CONFLICT',
  );
  assert.equal(enqueue(store, 'two', payload(confirmed)).status, 'DUPLICATE INVOICE');
  assert.equal(store.length, 1);
  assert.equal(
    hash({
      b: 2,
      a: {
        d: 4,
        c: [3, 2],
      },
    }),
    hash({
      a: {
        c: [3, 2],
        d: 4,
      },
      b: 2,
    }),
  );
  assert.notEqual(hash([3, 2]), hash([2, 3]));
  const sent = sampleModel('handoff', {
    beat: 1,
    beatP: 0.99,
  });
  assert(sent.acknowledged);
  assert.equal(
    acknowledgmentMatches(
      {
        ...sent.value,
        amount: 50000,
      },
      sent.receipt,
    ),
    false,
  );
  for (const reference of ['', '   ', ' REV-48291 ', undefined])
    assert.equal(
      acknowledgmentMatches(sent.value, {
        ...sent.receipt,
        reference,
      }),
      false,
    );
  for (const authenticated of [false, 'false', 'true', 1, null, undefined]) {
    const redacted = packet({
      ...original,
      authenticated,
    });
    assert.equal('customer' in redacted, false);
    assert.equal('invoice' in redacted, false);
  }
  for (let count = 0; count <= cases().length; count++) {
    const prefix = replay('normal', count);
    assert.equal(prefix.rows.length, count);
    assert.equal(prefix.labelsPass, count);
    assert.equal(prefix.actual.length, count >= 4 ? 1 : 0);
    assert.equal(prefix.expected.length, prefix.actual.length);
    assert.equal(prefix.unexpected.length + prefix.missing.length, 0);
    assert.equal(prefix.ready, count === 12);
  }
  assert.throws(() => replay('normal', 13));
  const normal = replay();
  assert.deepEqual(Object.values(normal.counts), [6, 3, 1, 1, 1]);
  assert(normal.ready);
  assert.equal(normal.actual.length, 1);
  assert.equal(replay('extra').unexpected.length, 1);
  assert.equal(replay('extra').labelsPass, 12);
  assert.equal(replay('extra').ready, false);
  assert.equal(replay('missing').missing.length, 1);
  assert.equal(replay('missing').ready, false);
  const firstBill = supportCost(2000, 1280, 130),
    secondBill = supportCost(2170, 1920, 130);
  assert(Math.abs(firstBill.total - 0.00407) < 1e-12);
  assert(Math.abs(secondBill.total - 0.003055) < 1e-12);
  assert(Math.abs(firstBill.reserve - 0.0095) < 1e-12);
  assert.equal(freshSupportCase(31, true).decision.outcome, 'HANDOFF');
  assert.equal(freshSupportCase(30, false).decision.outcome, 'CONFIRM');
  const fresh = freshSupportCase(30, true);
  assert.equal(fresh.pending, 1);
  assert.equal(fresh.applied, 0);
  assert.deepEqual(fresh.store[0].payload, freshExpectedPayload);
  assert.equal(enqueue(fresh.store, 'credit:M9', payload(fresh.value)).status, 'RECOVERED');
  assert.equal(fresh.store.length, 1);
  return true;
}
