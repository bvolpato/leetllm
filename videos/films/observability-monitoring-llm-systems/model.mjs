import { EVENTS, fields, receipts } from './fixtures.mjs';
import {
  alert,
  estimate,
  guardedDispatch,
  joinReviews,
  sum,
  summarize,
  unsafeServeBounds,
} from './arithmetic.mjs';
import { costConstruction, denominatorConstruction, sampleModel } from './construction.mjs';
import { scoreReplays } from './stages/candidate-gate.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  for (const [delivered, unsafe, useful] of [
    [[], 0, 0],
    [['201'], 0, 1],
    [['205'], 1, 0],
  ]) {
    const trial = scoreReplays(delivered);
    assert.deepEqual(
      [trial.reviewed, trial.unsafe, trial.useful, trial.answerable],
      [2, unsafe, useful, 1],
    );
  }
  assert.equal(joinReviews(EVENTS, [receipts[0], receipts[0]]).length, 6);
  assert.throws(
    () =>
      joinReviews(EVENTS, [
        {
          id: '999',
          unsafe: false,
        },
      ]),
    /unrecognized/,
  );
  const full = summarize(EVENTS);
  assert.equal(full.unsafe, 2);
  assert.equal(full.reviewed, 6);
  assert.equal(full.conditional, 2 / 3);
  assert.equal(full.abstained, 3);
  assert.equal(EVENTS.filter((e) => e.stage === 'generation').length, 4);
  assert.equal(EVENTS.filter((e) => e.escape).length, 2);
  assert.equal(denominatorConstruction(1, 0).reviewed, 6);
  assert.equal(denominatorConstruction(1, 3 / 27.29).reviewed, 5);
  const partial = sampleModel('denominators', {
    beat: 1,
    beatP: 0.5,
  });
  assert.equal(partial.reviewed, 3);
  assert.equal(partial.rate, 2 / 3);
  assert.equal(partial.lower, 2 / 6);
  assert.equal(partial.upper, 2 / 6);
  assert.equal(partial.lowerCount, 2);
  assert.equal(partial.upperCount, 2);
  assert.equal(partial.knownWithheld, 3);
  assert.equal(partial.unknown, 3);
  assert.equal(partial.unreviewedPossibleServes, 0);
  const deliveryUnknown = partial.rows.map((e) =>
      e.unsafe === null
        ? {
            ...e,
            served: null,
          }
        : e,
    ),
    unreviewedServed = partial.rows.map((e) =>
      e.unsafe === null
        ? {
            ...e,
            served: true,
          }
        : e,
    );
  assert.equal(unsafeServeBounds(deliveryUnknown, 6).upperCount, 5);
  assert.equal(unsafeServeBounds(unreviewedServed, 6).upperCount, 5);
  assert.equal(unsafeServeBounds(partial.rows, 7).upperCount, 3);
  assert.equal(unsafeServeBounds(partial.rows, 7).lower, 2 / 7);
  assert.equal(unsafeServeBounds(partial.rows, 7).upper, 3 / 7);
  assert.equal(
    unsafeServeBounds(
      deliveryUnknown.map((e) =>
        e.unsafe === null
          ? {
              ...e,
              unsafe: false,
            }
          : e,
      ),
      6,
    ).upperCount,
    2,
  );
  assert.throws(
    () =>
      unsafeServeBounds([
        {
          ...EVENTS[5],
          served: false,
        },
      ]),
    /actual served payload/,
  );
  assert.throws(
    () =>
      unsafeServeBounds([
        {
          ...EVENTS[5],
          served: undefined,
        },
      ]),
    /delivery/,
  );
  assert.throws(() => unsafeServeBounds(EVENTS, 5), /ingress/);
  assert.equal(summarize(joinReviews(EVENTS, [])).rate, null);
  assert.equal(
    sampleModel('join', {
      beat: 0,
      beatP: 0.99,
    }).reviewed,
    4,
  );
  assert.equal(
    sampleModel('join', {
      beat: 1,
      beatP: 0.99,
    }).unsafe,
    2,
  );
  assert.equal(
    sampleModel('latency', {
      beat: 0,
      beatP: 0.99,
    }).arrivals.length,
    1,
  );
  const stream = sampleModel('latency', {
    beat: 1,
    beatP: 0.99,
  });
  assert.equal(stream.arrivals.length, 30);
  assert(Math.abs(stream.tps - 29 / 0.215) < 1e-9);
  assert.equal(
    sampleModel('latency', {
      beat: 1,
      beatP: 0.3,
    }).post.tokens,
    sampleModel('latency', {
      beat: 1,
      beatP: 0.3,
    }).arrivals.length - 1,
  );
  assert.equal(
    sampleModel('join', {
      beat: 1,
      beatP: 0.24,
    }).reviewed,
    4,
  );
  assert.equal(
    sampleModel('join', {
      beat: 1,
      beatP: 0.32,
    }).reviewed,
    5,
  );
  assert.equal(
    sampleModel('join', {
      beat: 1,
      beatP: 0.42,
    }).reviewed,
    6,
  );
  assert.equal(
    sampleModel('cost', {
      beat: 1,
      beatP: 0.1,
    }).error,
    null,
  );
  assert(
    sampleModel('cost', {
      beat: 1,
      beatP: 0.3,
    }).error,
  );
  for (let i = 0; i <= 100; i++) {
    const f = costConstruction(0, i / 100);
    assert.equal(f.allocated + f.unallocated, 201);
    assert(f.subtotal <= f.cost + 1e-12);
  }
  assert.equal(costConstruction(0, 10 / 20.618).unallocated, 121);
  assert.equal(costConstruction(0, 10 / 20.618).pricedTerms, 0);
  assert(Math.abs(estimate(EVENTS[5]) - 0.000279) < 1e-12);
  assert(Math.abs(sum(EVENTS.map(estimate)) - 0.0014274) < 1e-12);
  assert.throws(() =>
    estimate({
      ...EVENTS[5],
      cached: 202,
    }),
  );
  const clean = sampleModel('privacy', {
    beat: 0,
    beatP: 0,
  });
  assert.deepEqual(Object.keys(clean.exported), fields);
  assert(!('rawMessage' in clean.exported));
  assert(
    sampleModel('privacy', {
      beat: 1,
      beatP: 0,
    }).error,
  );
  assert.deepEqual(alert(EVENTS), ['PAGE: unsupported served claims']);
  assert.equal(
    alert(
      EVENTS.map((e, i) =>
        i === 5
          ? {
              ...e,
              ttft: NaN,
            }
          : e,
      ),
    ).length,
    2,
  );
  for (const output of [-30, NaN, undefined]) {
    assert.throws(() =>
      estimate({
        ...EVENTS[5],
        output,
      }),
    );
    assert(
      alert(
        EVENTS.map((e, i) =>
          i === 5
            ? {
                ...e,
                output,
              }
            : e,
        ),
      ).includes('UNKNOWN: usage measurement'),
    );
  }
  assert(
    alert(
      EVENTS.map((e, i) =>
        i === 5
          ? {
              ...e,
              ttft: 900,
            }
          : e,
      ),
    ).includes('WARN: first-token delay above policy'),
  );
  assert(
    alert(
      EVENTS.map((e, i) =>
        i === 5
          ? {
              ...e,
              output: 10000,
            }
          : e,
      ),
    ).includes('WARN: estimated cost above policy'),
  );
  let calls = 0;
  const same = Array.from(
      {
        length: 3,
      },
      () => ['lookup', '42', '17'],
    ),
    changed = [...same.slice(0, 2), ['lookup', '42', '18']];
  assert(!guardedDispatch(same, 3, 5, () => calls++).executed);
  assert(!guardedDispatch(changed, 5, 5, () => calls++).executed);
  assert.equal(calls, 0);
  assert(guardedDispatch(changed, 3, 5, () => calls++).executed);
  assert.equal(calls, 1);
  assert.equal(
    sampleModel('sampling', {
      beat: 0,
      beatP: 0.4,
    }).findings.length,
    1,
  );
  assert.equal(
    sampleModel('sampling', {
      beat: 0,
      beatP: 0.8,
    }).findings.length,
    2,
  );
  assert(
    sampleModel('budget', {
      beat: 0,
      beatP: 0.55,
    }).stopped,
  );
  assert(
    !sampleModel('budget', {
      beat: 0,
      beatP: 0.9,
    }).stopped,
  );
  assert(
    !sampleModel('budget', {
      beat: 1,
      beatP: 0,
    }).stopped,
  );
  return true;
}
