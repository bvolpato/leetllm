import assert from 'node:assert/strict';
import {
  heartbeats,
  backlogUpdates,
  countPublications,
  countWindow,
  queueEvents,
  revisionRecords,
} from '../../../films/streaming-features/fixtures.mjs';
import {
  applyLatestState,
  availableHeartbeat,
  applyUpdate,
  pointInTime,
  publishWindow,
  eventRoute,
  sourceFreshness,
  typedParity,
} from '../../../films/streaming-features/arithmetic.mjs';
import {
  opening,
  delivery,
  repeatRead,
  joins,
  joinRules,
  batch,
  revisions,
  quarantine,
  conflicting,
  candidate,
  oldHeartbeatRetry,
} from './signal.mjs';
import {
  watermarks,
  geometry,
  trackWatermark,
  counts,
  countAt,
  groupSessions,
  sessionExample,
  diagnoseCount,
} from './windows.mjs';
import { dedupe, restart, horizon, journal, transaction, retentionTrial } from './queue.mjs';
import {
  policy,
  edges,
  pairs,
  fields,
  cached,
  final,
  finalRead,
  finalMode,
  boundaries,
  rowsAt,
  schemaExamples,
  correctionAges,
  practiceJob,
} from './decisions.mjs';

const scenes = [
  opening,
  delivery,
  repeatRead,
  joins,
  joinRules,
  batch,
  revisions,
  quarantine,
  watermarks,
  geometry,
  trackWatermark,
  counts,
  dedupe,
  restart,
  horizon,
  policy,
  edges,
  pairs,
  fields,
  diagnoseCount,
  cached,
  final,
];
function check() {
  const [h1, h2] = heartbeats;
  for (const [time, id, age] of [
    [540, 'H1', 8],
    [720, 'H2', 3.5],
    [900, 'H3', 3],
    [960, 'H3', 4],
  ]) {
    const r = availableHeartbeat(heartbeats, time);
    assert.deepEqual([r.id, r.ageHours], [id, age]);
  }
  assert.deepEqual(
    [542, 539, 540].map((available) => availableHeartbeat([h1, { ...h2, available }], 540).id),
    ['H1', 'H2', 'H2'],
  );
  assert.deepEqual(
    backlogUpdates.map((u) => pointInTime(u.job, u.time)),
    [5, 12, 8],
  );
  assert.equal(pointInTime('J-201', 540), 5);
  assert.equal(pointInTime('J-201', 570), 12);
  assert.equal(pointInTime('J-202', 570), 8);
  const store = new Map();
  assert.deepEqual(
    revisionRecords.map((r) => applyLatestState(store, r)),
    ['stored', 'stored', 'stale ignored'],
  );
  assert.deepEqual([store.get('J-204').version, store.get('J-204').event], [2, 630]);
  assert.deepEqual([oldHeartbeatRetry.event, oldHeartbeatRetry.available], [60, 665]);
  assert.equal(applyLatestState(store, oldHeartbeatRetry), 'stale ignored');
  assert.equal(store.get('J-204').id, 'H4-correction');
  for (const order of [
    ['Scaled up', 'Failed'],
    ['Failed', 'Scaled up'],
  ])
    assert(conflicting([...order, order[0]]));
  const conflictStore = new Map();
  for (const p of ['Scaled up', 'Failed', 'Failed']) applyLatestState(conflictStore, candidate(p));
  assert.equal(conflictStore.get('J-205').quarantined, true);
  applyLatestState(conflictStore, { ...candidate('Validated'), version: 8 });
  assert.equal(conflictStore.get('J-205').quarantined, false);
  const { pulses, latePulse, inactivityGap } = sessionExample;
  const sessions = groupSessions(pulses, inactivityGap);
  assert.deepEqual(sessions.map((a) => a.length), [2, 2]);
  const left = sessions[0].at(-1);
  const right = sessions[1][0];
  assert.deepEqual(
    [right - left, latePulse - left, right - latePulse],
    [20, 10, 10],
  );
  assert.deepEqual(
    groupSessions([...pulses, latePulse], inactivityGap).map((a) => a.length),
    [5],
  );
  const { end, watermark, allowance, replayEvent, members } = countWindow;
  for (const [wm, event, diff, route] of [
    [725, replayEvent, 60, 'replay'],
    [watermark, replayEvent, 75, 'replay'],
    [watermark, members[2].event, 30, 'accept'],
  ]) {
    assert(wm < end + allowance);
    assert.equal(wm - event, diff);
    assert.equal(eventRoute(event, wm), route);
  }
  assert.equal(eventRoute(watermark - 45, watermark), 'accept');
  assert.equal(eventRoute(watermark, watermark), 'on-time');
  const [v1, v2] = countPublications;
  assert.deepEqual(
    v1.members.map((m) => m.id),
    ['A', 'B'],
  );
  assert.deepEqual(v2.members.slice(0, 2), v1.members);
  assert.deepEqual(
    v2.members.map((m) => m.id),
    ['A', 'B', 'C'],
  );
  assert.equal(v1.count + v2.count, 5);
  assert.equal(countAt(741), null);
  assert.deepEqual(
    [742, 743, 744, 745].map((t) => [countAt(t).revision, countAt(t).count]),
    [
      [1, 2],
      [1, 2],
      [2, 3],
      [2, 3],
    ],
  );
  assert.throws(() => publishWindow(countAt(745), { ...v2, count: 4 }), /conflicting whole total/);
  const { state, trace } = journal([...queueEvents, { id: 'Q4', delta: 10 }, queueEvents[3]]);
  assert.deepEqual(
    trace.map((r) => r.backlog),
    [3, 3, 2, 2, 12, 12],
  );
  assert.deepEqual(
    trace.map((r) => r.status),
    [
      'applied',
      'duplicate skipped',
      'applied',
      'blocked negative backlog',
      'applied',
      'blocked negative backlog',
    ],
  );
  assert.throws(() => applyUpdate(state, { id: 'Q1', delta: 4 }), /different payload/);
  assert.deepEqual([7, 14].map(retentionTrial), [
    { days: 7, retryDay: 10, onFile: false, backlog: 6 },
    { days: 14, retryDay: 10, onFile: true, backlog: 3 },
  ]);
  assert.deepEqual(
    ['id', 'both', 'rollback', 'committed', 'retry'].map((s) => {
      const x = transaction(s);
      return [x.ledger, x.backlog];
    }),
    [
      ['Empty', 0],
      ['Empty', 0],
      ['Empty', 0],
      ['Q1 applied', 3],
      ['Q1 applied', 3],
    ],
  );
  assert.deepEqual(
    [712, 690, 630].map((t) => sourceFreshness(t * 60, 720 * 60).mode),
    ['normal', 'degraded', 'abstain'],
  );
  assert.deepEqual(
    boundaries.map((sec) => sourceFreshness(sec == null ? null : 3600 - sec, 3600).mode),
    ['normal', 'degraded', 'degraded', 'abstain', 'unknown / abstain', 'invalid clock'],
  );
  assert.deepEqual(
    rowsAt(false).map((r) => r.online),
    [18, 5],
  );
  assert.deepEqual(
    rowsAt(true).map((r) => [r.job, r.captured, r.online]),
    [['J-201', 18, 5], ['J-202', 5, 18]],
  );
  assert.deepEqual(correctionAges(), [10, 10]);
  assert.deepEqual(correctionAges([revisionRecords[0]]), [10, 10]);
  assert.deepEqual(typedParity({ flag: 0 }, { flag: false }), ['flag']);
  assert.deepEqual(typedParity({}, { flag: null }), ['flag']);
  const { floatPair, tolerance } = schemaExamples;
  assert.deepEqual(
    typedParity({ x: floatPair[0] }, { x: floatPair[1] }, { absolute: tolerance }),
    [],
  );
  assert.equal(practiceJob.id, 'J-206');
  assert.deepEqual(practiceJob.heartbeats.map((r) => r.id), ['H7', 'H8']);
  assert.equal(availableHeartbeat(heartbeats, 840).id, 'H3');
  assert.deepEqual(
    [840, 850].map((t) => {
      const r = finalRead(t);
      return [r.id, r.event, r.ageHours * 60];
    }),
    [
      ['H7', 660, 180],
      ['H8', 830, 20],
    ],
  );
  assert.deepEqual(
    [820, 835].map((t) => finalMode(t)),
    [
      { mode: 'degraded', lagSeconds: 1800 },
      { mode: 'normal', lagSeconds: 900 },
    ],
  );
  return true;
}
const captionStarts = {
  'c09-b04': [
    'The router sets this record aside for replay',
    'because its limit is forty-five minutes',
    'The window can still take',
    'until its cleanup boundary',
  ],
  'c11-b04': [
    'Twenty minutes have passed',
    'so the window still has its state',
    'Now measure from the heartbeat',
    'That gap is seventy-five minutes',
    'Send the heartbeat to replay',
  ],
  'c11-b06': [
    'It is thirty minutes behind the watermark',
    'inside the forty-five-minute limit',
    'Here the window can update',
    'Log which records took each route',
    'so batch can reproduce the count',
  ],
};

function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const starts = captionStarts[entry.beat.id];
    if (!starts) continue;
    for (const phrase of starts) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}

export default {
  title: 'Building Features While Events Arrive',
  draw(g, k) {
    scenes[k.beat.chapterIndex](g, k);
  },
  check,
  preparePicture: prepareCaptions,
};
