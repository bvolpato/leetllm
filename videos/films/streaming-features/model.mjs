import {
  applyLatestState,
  availableHeartbeat,
  eligibleEvents,
  eventRoute,
  freshnessMode,
  heartbeatAge,
  pointInTime,
  publishWindow,
  replayQueue,
  sameMarginals,
  sourceFreshness,
  typedParity,
} from './arithmetic.mjs';
import {
  afternoonHeartbeats,
  countPublications,
  countWindow,
  cutoff09,
  heartbeats,
  pairedRows,
  revisionRecords,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.equal(
    eligibleEvents(cutoff09)
      .map((row) => row.id)
      .join(','),
    'H1',
  );
  assert.deepEqual(
    eligibleEvents(12 * 60).map((row) => row.id),
    ['H1', 'H2'],
  );
  assert.equal(heartbeatAge(540), 8);
  assert.equal(heartbeatAge(720), 3.5);
  assert.equal(heartbeatAge(960), 4);
  assert.equal(pointInTime('J-201', 540), 5);
  assert.equal(pointInTime('J-202', 570), 8);
  assert.equal(pointInTime('J-201', 570), 12);
  const maxEvent = 12 * 60 + 20,
    delay = 15,
    watermark = maxEvent - delay;
  assert.equal(watermark, 12 * 60 + 5);
  assert.equal(eventRoute(11 * 60 + 5, watermark), 'replay');
  assert.equal(watermark - (11 * 60 + 5), 60);
  assert.equal(12 * 60 + 20 < 12 * 60 + 30, true);
  const { state, trace } = replayQueue();
  assert.deepEqual(
    trace.map((row) => row.status),
    ['applied', 'duplicate skipped', 'applied', 'blocked negative backlog'],
  );
  assert.equal(state.backlog, 2);
  assert.equal(freshnessMode(15), 'normal');
  assert.equal(freshnessMode(16), 'degraded');
  assert.equal(freshnessMode(45), 'degraded');
  assert.equal(freshnessMode(46), 'abstain');
  assert.deepEqual(
    pairedRows.map((row) => row.offline).sort(),
    pairedRows.map((row) => row.online).sort(),
  );
  assert.equal(
    pairedRows.some((row) => row.offline !== row.online),
    true,
  );
  assert.equal(sameMarginals(pairedRows.map((row) => row.online)), true);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const [h1, h2] = heartbeats;
  assert.equal(cutoff09 - h2.event, 30);
  assert.equal(availableHeartbeat([h1, { ...h2, available: 542 }], cutoff09).id, 'H1');
  assert.equal(availableHeartbeat([h1, { ...h2, available: 539 }], cutoff09).ageHours, 0.5);

  const { start, end, watermark, allowance, replayEvent, members } = countWindow;
  assert(members.every(({ event }) => event >= start && event < end));
  assert(start <= replayEvent && replayEvent < end);
  assert(watermark < end + allowance);
  assert.equal(watermark - end, 20);
  assert.deepEqual(
    [replayEvent, members[2].event].map((time) => [watermark - time, eventRoute(time, watermark)]),
    [
      [75, 'replay'],
      [30, 'accept'],
    ],
  );
  const [first, revision, retry] = countPublications;
  const captured = publishWindow(null, first);
  const later = publishWindow(captured, revision);
  assert(first.time <= 743 && revision.time > 743);
  assert.deepEqual([captured.count, later.count, publishWindow(later, retry).count], [2, 3, 3]);
  assert.equal(first.count + revision.count, 5);
  assert.throws(() => publishWindow(later, { ...revision, count: 4 }), /conflicting whole total/);

  const firstRead = availableHeartbeat(afternoonHeartbeats, 840);
  const secondRead = availableHeartbeat(afternoonHeartbeats, 850);
  assert.deepEqual([firstRead.id, firstRead.ageHours], ['H7', 3]);
  assert.deepEqual([secondRead.id, secondRead.ageHours * 60], ['H8', 20]);
  assert.deepEqual(
    [820, 835].map((time) => sourceFreshness(time * 60, 850 * 60)),
    [
      { mode: 'degraded', lagSeconds: 1800 },
      { mode: 'normal', lagSeconds: 900 },
    ],
  );
  const store = new Map();
  for (const r of revisionRecords) applyLatestState(store, r);
  assert.equal(store.get('J-204').version, 2);
  assert.equal(store.get('J-204').phase, 'worker_scaled_corrected');
  assert.equal(sourceFreshness(0, 901).mode, 'degraded');
  assert.deepEqual(
    typedParity(
      {
        flag: 0,
      },
      {
        flag: false,
      },
    ),
    ['flag'],
  );
  return true;
}
