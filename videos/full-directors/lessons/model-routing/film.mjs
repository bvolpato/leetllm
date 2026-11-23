import assert from 'node:assert/strict';
import { opening, requirements, filter, ranking } from './selection.mjs';
import { deadlines, publication, breaker, streamState } from './attempts.mjs';
import { audit, lastMillisecond } from './records.mjs';
import {
  byId,
  checksFor,
  contract,
  early,
  edgeA,
  edgeB,
  fields,
  grant,
  healthyAfterSkips,
  jitters,
  larger,
  late,
  measured,
  passage,
  plan,
  policy,
  rank,
  ranked,
  relay,
  replays,
  retry,
  retryWindow,
  sampleD,
  tight,
  validate,
  waitExample,
  withHints,
  wrongD,
} from './examples.mjs';

const painters = [
  opening,
  requirements,
  filter,
  ranking,
  deadlines,
  publication,
  breaker,
  audit,
  lastMillisecond,
];

function check() {
  assert.deepEqual(withHints, contract);
  assert.deepEqual(
    [contract.data, contract.context, contract.citations, contract.review],
    ['private', 24000, true, true],
  );
  assert.deepEqual(
    fields.filter((_, j) => !checksFor(byId.F, contract)[j]),
    ['schema', 'citations', 'review'],
  );
  assert.deepEqual(
    fields.filter((_, j) => !checksFor(byId.A, contract)[j]),
    ['data', 'context', 'citations', 'review'],
  );
  assert.deepEqual(
    fields.filter((_, j) => !checksFor(byId.B, contract)[j]),
    ['data'],
  );
  assert.deepEqual(rank(larger), []);
  assert.deepEqual(
    ranked().map((l) => l.id),
    ['C', 'D', 'E'],
  );
  assert.deepEqual(
    ranked(true).map((l) => l.id),
    ['D', 'C', 'E'],
  );
  assert.deepEqual(
    measured.find((l) => l.id === 'D'),
    { ...byId.D, latency: 700 },
  );
  assert.equal(byId.F.cost * 3, byId.D.cost);
  assert.deepEqual(
    early.run.spans.map((s) => [s.lane.id, s.start, s.end, s.charge]),
    [
      ['C', 0, 940, 4200],
      ['D', 940, 2040, 4500],
    ],
  );
  assert.equal(early.run.remaining, 460);
  assert.equal(waitExample.remaining, 1560);
  assert(waitExample.delay > waitExample.remaining);
  assert.deepEqual(
    [late.available, late.finish, late.run.elapsed, late.run.spans.length, late.admitted],
    [700, 2900, 1800, 1, false],
  );
  assert.deepEqual(
    [tight.moneyLeft, tight.run.spent, tight.run.spans.length, tight.admitted],
    [3800, 4200, 1, false],
  );
  assert.equal(plan(940, byId.C.cost + policy.reservation).admitted, true);
  assert.equal(plan(940, byId.C.cost + policy.reservation - 1).admitted, false);
  for (const cause of ['timeout', 'throttle', 'auth', 'quota', 'refusal', 'drop']) {
    assert.equal(retry(cause, false), ['timeout', 'throttle'].includes(cause));
    assert.equal(retry(cause, true), false);
  }
  for (let n = 0; n <= 4; n++) {
    const events = ['Your access request', 'access request', 'request', 'Those three words'];
    const state = streamState({
      beat: { beatIndex: 1 },
      reveal: (key) => Number(events.indexOf(key) < n),
    });
    assert.equal(state.words.join(' '), ['Your', 'access', 'request'].slice(0, n).join(' '));
    assert.equal(state.failure, n === 4 ? 'drop' : null);
    assert.equal(state.eligible, false);
  }
  assert.equal(validate(sampleD).accepted, true);
  assert.deepEqual(sampleD.citations, [passage.id]);
  assert.deepEqual(validate(wrongD), {
    schema: true,
    citations: false,
    review: true,
    accepted: false,
  });
  assert.equal(validate({ ...sampleD, review: 'approved' }).accepted, false);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((n) => relay(n).state),
    ['closed', 'closed', 'open', 'half open', 'half open', 'closed', 'open'],
  );
  assert.deepEqual(
    [relay(2).until, relay(3).holder, relay(4).second, relay(5).holder, relay(6).until],
    [11, 'P1', false, null, 23.5],
  );
  assert.equal(healthyAfterSkips.id, 'E');
  assert.deepEqual(jitters, [24, 92, 166]);
  assert.deepEqual([0, 1, 2, 3, 4].map(retryWindow), [200, 400, 800, 1000, 1000]);
  assert.deepEqual(
    replays.map((r) => [r.spans.length, r.served?.id || null]),
    [
      [1, 'C'],
      [2, 'D'],
      [0, null],
    ],
  );
  assert.equal(grant.replay.receipt, grant.receipt);
  assert.deepEqual(
    [
      grant.first.status,
      grant.replay.status,
      grant.denied.status,
      grant.changed.status,
      grant.effects,
    ],
    ['committed', 'reused', 'denied', 'conflict', 1],
  );
  assert.equal(early.run.spent, 8700);
  for (const [edge, finish, dispatched] of [
    [edgeA, 2499, true],
    [edgeB, 2500, false],
  ]) {
    assert.equal(edge.finish, finish);
    assert.equal(edge.admitted, dispatched);
    assert.equal(edge.finish < policy.deadline, dispatched);
    assert.equal(edge.run.elapsed, dispatched ? finish : edge.start);
    assert.equal(edge.run.spans.length, dispatched ? 2 : 1);
  }
  return true;
}

// Give the host exact subtitle boundaries even when the picture waits for the
// complete result clause before it shows the value or verdict.
const resultSpeech = {
  'c04-b01': ['C is the cheapest'],
  'c05-b01': ['It finishes at two thousand'],
  'c05-b04': ['It would finish at twenty-nine hundred'],
  'c05-b07': ['Skip D'],
  'c06-b03': ['Withhold this reply'],
  'c08-b04': ['C cost point four two', 'Its final charge'],
  'c09-b03': ['The finish is', 'Send D'],
  'c09-b05': ['Skip D'],
};

export default {
  title: 'Choosing a Model Without Losing the Contract',
  draw(ctx, clock) {
    for (const phrase of resultSpeech[clock.beat.id] ?? []) clock.reveal(phrase, 0);
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
