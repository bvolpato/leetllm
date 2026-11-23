// Scene `replay-contract`: how far the promise of a replay goes.
//
// The picture: the line of the operation, three times. First the SQLite fixture: two workers
// send one second key, a lock lets one in, and both get the same job. Then a service contract
// with versions: a stored 500 comes back, a retention bar runs out, and a pruned key makes a
// new request. Then a replica that lags says "not found" while the row is in the primary.
import {
  assertEqual,
  beside,
  between,
  boxOf,
  column,
  delay,
  dynamic,
  fadeIn,
  fadeOut,
  grid,
  indicate,
  lagged,
  moveTo,
  par,
  pictogram,
  place,
  rect,
  seq,
  shake,
  vanish,
} from 'vizmatic/stage';
import { dispatchOperation } from '../../../films/agent-recovery/model.mjs';
import { chip, heading, label, note } from '../../kit-narrated.mjs';
import { COLOR, OP, board, docked, record, token, travel, wall } from '../parts.mjs';

/** The second key of the fixture, and the keys of the service example. */
const SECOND = 'key-2';
const KEYS = { kept: 'key-A', failed: 'key-B', invalid: 'key-C' };

export default function replayContract(s, c) {
  // The fixture: the operation of the lesson, then two workers with one second key.
  const database = { operations: new Map(), jobs: new Map() };
  const payload = { run: 'RUN-842', revision: OP.revision };
  dispatchOperation(database, OP.key, payload, 'normal');
  const workers = [1, 2].map(() => dispatchOperation(database, SECOND, payload, 'normal'));
  assertEqual(
    [workers[0].job, workers[1].job, database.jobs.size],
    ['job-2', 'job-2', 2],
    'both workers get one job, and two operations own two jobs',
  );

  const b = board();
  const laneY = b.out[1];
  const start = (node) => docked(node, b.out, 'right');
  // A send that the controller refuses waits under the lane, at its start.
  const parked = (node) => [start(node)[0], laneY + node.height + 24];
  const row = (index, cells, color = COLOR.sure) =>
    cells.map((parts, column) =>
      record(parts, b.recordWidth(column), { color }).moveTo(b.durableAt(column, index)),
    );
  const send = (tag, words) => {
    const node = token(words, COLOR.attempt, { tag });
    return node.moveTo(start(node));
  };
  // What the controller is in each part, beside its name.
  const kinds = [
    'a SQLite file',
    'a service contract, version 1',
    'a service contract, version 2',
    'the primary',
  ].map((words) => beside(note(words), b.name, 'right', 'normal'));

  // Part 1. The rows of the two operations, the lock at the door, and the two workers.
  const own = row(0, [
    [
      [OP.key, COLOR.op],
      ['→', 'dim'],
      [OP.job, COLOR.sure],
    ],
    [
      [OP.job, COLOR.sure],
      [OP.state, 'ink'],
    ],
  ]);
  const around = boxOf(own).grow('tight');
  const transaction = rect(around.width, around.height, {
    radius: 16,
    stroke: COLOR.mark,
    fill: null,
    width: 3,
    dash: [10, 8],
  }).moveTo(around.point());
  const other = row(0, [
    [
      [SECOND, 'ink'],
      ['→', 'dim'],
      [workers[0].job, COLOR.sure],
    ],
    [
      [workers[0].job, COLOR.sure],
      [OP.state, 'ink'],
    ],
  ]);
  other.forEach((made, column) => made.moveTo(b.stagedAt(column)));
  const lock = beside(
    pictogram('lock', { size: 64, color: COLOR.mark, accent: COLOR.mark }),
    b.door,
    'above',
    'wide',
    'right',
  );
  const w1 = send('worker-1', [[SECOND, 'ink']]);
  const w2 = send('worker-2', [[SECOND, 'ink']]);
  const w3 = send('worker-3', [[SECOND, 'ink']]);
  const queued = (node, ahead) => [
    docked(ahead, b.door)[0] - ahead.width / 2 - 12 - node.width / 2,
    laneY,
  ];
  const replies = [0, 1].map(() => {
    const node = token(workers[0].job, COLOR.sure);
    return node.moveTo(docked(node, b.exit));
  });
  w3.moveTo(parked(w3));
  const busy = beside(
    chip('SQLITE_BUSY', { color: COLOR.fail, stroke: COLOR.fail, font: 'mono' }),
    w3,
    'under',
    'tight',
    'left',
  );
  const again = beside(
    note('retry: same key, same deadline', { color: COLOR.mark }),
    busy,
    'under',
    'tight',
    'left',
  );
  w3.moveTo(start(w3));
  // Part 2. A service contract: a key, and the first response that the service keeps for it.
  const heads = ['idempotency key', 'first response'].map((words, column) =>
    note(words).moveTo(b.heads[column].center).alignTo(b.heads[column], 'left'),
  );
  const updatedHead = note('updated response').moveTo(heads[1].center).alignTo(heads[1], 'left');
  const updated = token('200', COLOR.sure);
  updated.moveTo(docked(updated, b.exit));
  const kept = row(0, [[[KEYS.kept, 'ink']], [['200', COLOR.sure]]]);
  const failed = row(1, [[[KEYS.failed, 'ink']], [['500', COLOR.fail]]]);
  const completed = record([['200', COLOR.sure]], b.recordWidth(1)).moveTo(b.durableAt(1, 1));
  const fresh = row(0, [[[KEYS.kept, 'ink']], [['new request', COLOR.fail]]], COLOR.fail);
  const terms = ['key scope', 'payload comparison', 'retention window', 'error rules'].map(
    (words) => chip(words, { color: COLOR.mark, stroke: COLOR.mark }),
  );
  // The four terms are over the commit line, under the place where a request goes in.
  place(
    grid(terms, { columns: 2, gap: 'tight' }),
    b.store.rows(2, 'none')[0].inset('normal'),
    'bottom',
  );
  const replay = send('retry', [[KEYS.failed, 'ink']]);
  const invalid = send('', [[KEYS.invalid, 'ink']]);
  const reuse = send('later', [[KEYS.kept, 'ink']]);
  const error = token('500', COLOR.fail);
  error.moveTo(docked(error, b.exit));
  invalid.moveTo(parked(invalid));
  const unsaved = beside(
    chip('400: no result is kept', { color: COLOR.fail, stroke: COLOR.fail }),
    invalid,
    'under',
    'tight',
    'left',
  );
  invalid.moveTo(start(invalid));
  // The retention window: a bar that runs out, under the two rows.
  const retention = s.value(1);
  const window = b.durableBox(0, 2);
  const windowName = place(note('retention window'), window, 'top left');
  const track = window.beside(windowName, 'under', 'tight');
  const bar = dynamic(() =>
    retention.value < 0.01
      ? null
      : rect(window.width * retention.value, 18, {
          radius: 9,
          fill: COLOR.controller,
          stroke: null,
        }).at(window.left + (window.width * retention.value) / 2, track.top + 9),
  );

  // Part 3. A replica that lags, between the lanes, and the gate that a new target must pass.
  const middle = between(b.request, b.reply).inset('none', 'loose');
  // The replica has the lower three quarters of the room between the lanes. A read stops over it.
  const [overReplica, replicaRoom] = middle.rows([1, 3], 'none');
  const replica = place(
    rect(400, replicaRoom.height, {
      radius: 18,
      stroke: COLOR.controller,
      fill: 'surface',
      width: 3,
      dash: [12, 10],
    }),
    replicaRoom,
    'left',
  );
  const replicaBox = boxOf(replica).inset('normal');
  const replicaName = place(label('replica', { color: COLOR.controller }), replicaBox, 'top left');
  const behind = beside(note('it lags'), replicaName, 'right', 'normal');
  const empty = place(
    record([['no row yet', 'dim']], replicaBox.width, { color: 'dim', dash: [10, 8] }),
    replicaBox,
    'bottom',
  );
  const read = send('', 'status?');
  const over = [replica.center[0], overReplica.cy];
  const absent = token('not found', 'ink');
  absent.moveTo([
    boxOf(replica).left + absent.width / 2,
    boxOf(replica).bottom + absent.height / 2 + 14,
  ]);
  const unknown = label('unknown', { color: COLOR.mark }).moveTo(b.viewBox.point());
  const notAbsent = beside(
    note('replica still catching up', { color: COLOR.mark }),
    b.view,
    'under',
    'normal',
    'left',
  );
  const at = [b.out[0] + (b.door[0] - b.out[0]) * 0.72, laneY];
  const gate = wall(s, { at, top: b.region.top, bottom: laneY + 70 });
  const changed = send('', [
    [OP.key, COLOR.op],
    ['rev-18', COLOR.fail],
  ]);
  changed.moveTo(gate.before(changed));
  const admission = beside(
    chip('a new proposal: admission first', { color: COLOR.mark, stroke: COLOR.mark }),
    changed,
    'above',
    'normal',
    'right',
  );
  changed.moveTo(start(changed));
  const access = ['caller', 'tenant, if any', 'access'].map((words) =>
    chip(words, { color: COLOR.mark, stroke: COLOR.mark }),
  );
  place(
    column(access, { gap: 'tight' }),
    b.store.rows(2, 'none')[0].inset('normal').beside(b.heads, 'under', 'tight'),
    'left',
  );

  const carriedSeen = token(
    [
      [OP.job, COLOR.sure],
      [OP.state, 'ink'],
    ],
    COLOR.sure,
  ).moveTo(b.viewBox.point());
  c.take([...b.base.filter((node) => node !== b.request && node !== b.reply), ...own, carriedSeen]);
  s.add(heading(c.title), b.request, b.reply, kinds[0]);
  b.close(c);

  // Part 1: one transaction for the key, the payload and the job. Then two workers, and one lock.
  c.on('sqlite-file', () => s.play(indicate(b.panel, { color: COLOR.mark, scale: 1 })));
  c.show('shared-commit', transaction);
  c.hide('two-workers', transaction);
  c.on('two-workers', () =>
    s.play(
      travel(w1, docked(w1, b.door), { duration: 1 }),
      delay(travel(w2, queued(w2, w1), { duration: 1.1 }), 0.8),
    ),
  );
  c.on('serialize', () =>
    s.play(
      seq(
        fadeIn(lock, { duration: 0.3 }),
        b.absorb(w1),
        // The rows of the first operation make room, and the new rows cross the line into the first row.
        par(
          fadeIn(other, { duration: 0.3 }),
          ...own.map((made, column) => moveTo(made, b.durableAt(column, 1), { duration: 0.4 })),
        ),
        par(
          ...other.map((made, column) => moveTo(made, b.durableAt(column, 0), { duration: 0.6 })),
        ),
        moveTo(w2, docked(w2, b.door), { duration: 0.5 }),
        b.absorb(w2),
        indicate(other[0], { color: COLOR.mark }),
      ),
    ),
  );
  c.hide('shared-replay', carriedSeen);
  c.on('shared-replay', () => s.play(b.arrive(replies[0], { duration: 1.2 })), 0.9);
  c.on(
    'shared-replay',
    () =>
      s.play(
        seq(
          travel(replies[1], docked(replies[1], b.home, 'right'), { duration: 1.1 }),
          vanish(replies[1]),
        ),
      ),
    1.5,
  );
  c.on('two-jobs', () =>
    s.play(
      lagged(
        [own[1], other[1]].map((made) => indicate(made, { color: COLOR.mark })),
        { lag: 0.5 },
      ),
    ),
  );
  c.on(
    'busy',
    () =>
      s.play(
        seq(
          travel(w3, docked(w3, b.door), { duration: 0.8 }),
          shake(w3, { duration: 0.35 }),
          moveTo(w3, parked(w3), { duration: 0.6 }),
        ),
      ),
    -1.2,
  );
  c.show('busy', busy);
  c.show('busy', again, { lead: -2 });

  // Part 2: the same line, with the contract of a service that has versions.
  c.swap(
    1,
    [kinds[0], ...b.heads, ...own, ...other, lock, w3, busy, again, replies[0]],
    [kinds[1], heads, kept, failed, windowName, bar],
  );
  c.show('contract-terms', terms, { stagger: true });
  c.on('v1-replay', () =>
    s.play(
      seq(
        travel(replay, docked(replay, b.door), { duration: 0.9 }),
        b.absorb(replay),
        indicate(failed[1], { color: COLOR.mark }),
        b.arrive(error, { duration: 1.1 }),
      ),
    ),
  );
  c.on(
    'not-saved',
    () =>
      s.play(
        seq(
          travel(invalid, docked(invalid, b.door), { duration: 0.8 }),
          shake(invalid, { duration: 0.35 }),
          moveTo(invalid, parked(invalid), { duration: 0.6 }),
        ),
      ),
    -2.4,
  );
  c.show('not-saved', unsaved);
  const pruned = c.cue('retention-pruned');
  c.on('retention-pruned', () =>
    s.play(
      indicate(terms[2], { color: COLOR.mark, scale: 1.06 }),
      retention.to(0, { duration: pruned.end - pruned.start - 0.6 }),
    ),
  );
  c.hide('retention-pruned', kept, { after: true });
  c.on(
    'pruned-reuse',
    () =>
      s.play(
        seq(
          travel(reuse, docked(reuse, b.door), { duration: 0.9 }),
          b.absorb(reuse),
          fadeIn(fresh, { duration: 0.3 }),
        ),
      ),
    0.5,
  );
  c.swap('v2-complete', kinds[1], kinds[2]);
  c.swap('v2-complete', heads[1], updatedHead);
  c.swap('v2-updated', failed[1], completed, { after: true });
  c.hide('v2-updated', error, { after: true });
  c.after('v2-updated', () => s.play(b.arrive(updated, { duration: 1.1 })), 0.4);
  c.on('versioned', () =>
    s.play(
      lagged(
        terms.map((term) => indicate(term, { color: COLOR.mark, scale: 1.06 })),
        { lag: 0.3 },
      ),
    ),
  );

  // Part 3: a read of a replica that lags, a changed target, and who may read a stored result.
  const third = [
    kinds[3],
    ...b.heads.map((head) => note(head.source).moveTo(head.center)),
    ...row(0, [
      [
        [OP.key, COLOR.op],
        ['→', 'dim'],
        [OP.job, COLOR.sure],
      ],
      [
        [OP.job, COLOR.sure],
        [OP.state, 'ink'],
      ],
    ]),
  ];
  c.swap(
    2,
    [
      kinds[2],
      heads[0],
      updatedHead,
      failed[0],
      completed,
      ...fresh,
      ...terms,
      windowName,
      invalid,
      unsaved,
      updated,
    ],
    [...third, replica, replicaName, behind, empty],
  );
  c.on(
    'lagging-replica',
    () =>
      s.play(
        seq(
          travel(read, over, { duration: 1 }),
          par(fadeOut(read, { duration: 0.3 }), indicate(empty, { color: COLOR.mark, scale: 1 })),
          travel(absent, b.viewBox.point(), { duration: 1.2 }),
        ),
      ),
    0.6,
  );
  c.swap('keep-unknown', absent, unknown);
  c.show('keep-unknown', notAbsent);
  c.show('changed-revision', gate.nodes);
  c.on(
    'changed-revision',
    () =>
      s.play(
        seq(
          travel(changed, gate.before(changed), { duration: 1.1 }),
          shake(changed, { duration: 0.4 }),
        ),
      ),
    0.4,
  );
  c.show('new-admission', admission);
  c.show('auth-tenant', access, { stagger: true });
}
