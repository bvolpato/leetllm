// Scene `operation-identity`: one operation, several attempts, one job.
//
// The picture: the line of the operation. The key and the payload go on the card of the agent.
// Attempt 1 commits the two records and loses its reply. Attempt 2 has a new trace and the same
// key: it lands on the row that exists and brings back job-1. The same key with another target
// bounces as a conflict, and a new key makes a second job.
import {
  assertEqual,
  beside,
  fadeIn,
  indicate,
  lagged,
  moveTo,
  par,
  place,
  seq,
  shake,
} from 'vizmatic/stage';
import { dispatchOperation } from '../../../films/agent-recovery/model.mjs';
import { chip, heading, note } from '../../kit-narrated.mjs';
import { COLOR, OP, STATE, board, cross, docked, record, tint, token, travel } from '../parts.mjs';

/** A key that the client makes new for a send. It names no earlier operation. */
const NEW_KEY = STATE['operation-identity'].alternativeKey;

export default function operationIdentity(s, c) {
  // The four sends of the scene, through the controller of the model.
  const database = { operations: new Map(), jobs: new Map() };
  const payload = { run: 'RUN-842', revision: OP.revision };
  const first = dispatchOperation(database, OP.key, payload, 'after-commit');
  const replay = dispatchOperation(database, OP.key, payload, 'normal');
  const changed = dispatchOperation(database, OP.key, { ...payload, revision: 'rev-18' }, 'normal');
  const fresh = dispatchOperation(database, NEW_KEY, payload, 'normal');
  assertEqual(
    [first.reply, replay.job, changed.reply],
    ['lost', OP.job, 'conflict'],
    'the replies',
  );

  const b = board();
  const context = beside(note(STATE['operation-identity'].startLabel), b.name, 'right', 'normal');
  const laneY = b.out[1];

  // The card of the agent: the key, and the exact payload under it.
  const key = beside(token(OP.key, COLOR.op), b.agent, 'under', 'normal', 'left');
  const target = beside(token('RUN-842 → ' + OP.revision, COLOR.op), key, 'under', 'tight', 'left');
  const keyName = beside(note('operation key', { color: COLOR.op }), key, 'right', 'tight');

  // The sends: each has its own trace, in the color of the agent side, and carries a key.
  const attempt = (trace, words) => token(words, COLOR.attempt, { tag: trace });
  const a1 = attempt('trace-a1', [[OP.key, COLOR.op]]);
  const a2 = attempt('trace-a2', [[OP.key, COLOR.op]]);
  const a3 = attempt('trace-a3', [
    [OP.key, COLOR.op],
    ['rev-18', COLOR.fail],
  ]);
  const a4 = attempt('trace-a4', [[NEW_KEY, 'ink']]);
  const start = (node) => docked(node, b.out, 'right');
  a1.moveTo(b.shelf(a1));
  const traceName = beside(
    note('trace id', { color: COLOR.attempt }),
    a1,
    'above',
    'tight',
    'left',
  );
  // The refused send waits under the lane, with the answer of the controller under it.
  const parked = [(b.out[0] + b.door[0]) / 2, laneY + a3.height + 24];
  a3.moveTo(parked);
  const conflict = beside(
    chip(changed.reply, { color: COLOR.fail, stroke: COLOR.fail }),
    a3,
    'under',
    'tight',
  );
  for (const node of [a1, a2, a3, a4]) node.moveTo(start(node));

  // The records of the controller, and the two replies.
  const ledgerRow = (words, job, color) =>
    record(
      [
        [words, color === COLOR.fail ? 'ink' : COLOR.op],
        ['→', 'dim'],
        [job, color],
      ],
      b.recordWidth(0),
      { color },
    );
  const jobRow = (job, color) =>
    record(
      [
        [job, color],
        [OP.state, 'ink'],
      ],
      b.recordWidth(1),
      { color },
    );
  const ledger = ledgerRow(OP.key, OP.job, COLOR.sure).moveTo(b.stagedAt(0));
  const job = jobRow(OP.job, COLOR.sure).moveTo(b.stagedAt(1));
  const second = [
    ledgerRow(NEW_KEY, fresh.job, COLOR.fail).moveTo(b.durableAt(0, 1)),
    jobRow(fresh.job, COLOR.fail).moveTo(b.durableAt(1, 1)),
  ];
  // The name of the job id is over the job, just over the commit line. The job is under the line by then.
  const jobName = place(
    note('job id', { color: COLOR.sure }),
    b.stagedBox(1).inset('none', 'normal'),
    'bottom left',
  );
  const lost = token(OP.job, COLOR.sure);
  lost.moveTo(docked(lost, b.exit));
  const broken = cross();
  const answer = token(replay.job, COLOR.sure);
  answer.moveTo(docked(answer, b.exit));

  s.add(heading(c.title), b.base, context);
  b.close(c);
  c.hide('attempt-traces', context);
  c.show('logical-key', [key, keyName]);
  c.show('same-payload', target);
  c.on('across-attempts', () => s.play(indicate(key, { color: COLOR.mark })));

  // Attempt 1: the controller commits both records, and the reply is lost.
  c.on('attempt-traces', () =>
    s.play(
      seq(
        travel(a1, docked(a1, b.door), { duration: 1.1 }),
        par(fadeIn(ledger, { duration: 0.3 }), fadeIn(job, { duration: 0.3 })),
        par(
          moveTo(a1, b.shelf(a1), { duration: 0.6 }),
          moveTo(ledger, b.durableAt(0), { duration: 0.7 }),
          moveTo(job, b.durableAt(1), { duration: 0.7 }),
        ),
        b.lose(lost, broken),
      ),
    ),
  );
  c.show('attempt-traces', traceName, { after: true });
  // Attempt 2: a new trace, and the same key.
  c.on('same-key', () =>
    s.play(
      seq(
        travel(a2, docked(a2, b.door), { duration: 1.1 }),
        lagged(
          [a1, a2, key].map((node) => indicate(node, { color: COLOR.mark })),
          { lag: 0.3 },
        ),
      ),
    ),
  );
  c.show('accepted-job', jobName);
  c.on('accepted-job', () => s.play(indicate(job, { color: COLOR.mark })));
  c.on('third-identity', () =>
    s.play(
      lagged(
        [traceName, keyName, jobName].map((name) =>
          indicate(name, { color: COLOR.mark, scale: 1 }),
        ),
        { lag: 0.5 },
      ),
    ),
  );

  // The controller knows the key: attempt 2 lands on the row that exists, and job-1 comes back.
  c.on('enforces', () => s.play(seq(b.absorb(a2), indicate(ledger, { color: COLOR.mark }))));
  c.on('same-key-replay', () => s.play(b.arrive(answer)));
  // The same key with another target: a conflict.
  c.on('changed-target', () =>
    s.play(
      seq(
        travel(a3, docked(a3, b.door), { duration: 0.8 }),
        shake(a3, { duration: 0.35 }),
        moveTo(a3, parked, { duration: 0.6 }),
      ),
    ),
  );
  c.show('conflict', conflict);
  // A new key: the controller knows nothing of it, so it makes a second job.
  const predict = place(
    chip('How many queued jobs?', { color: COLOR.mark }),
    b.store.inset('normal'),
    'bottom',
  );
  c.on('random-key', () => s.play(travel(a4, docked(a4, b.door), { duration: 0.8 })));
  c.show('job-count-question', predict);
  c.hide('new-job', predict);
  c.on('new-job', () => s.play(seq(b.absorb(a4), fadeIn(second, { duration: 0.3 }))));
  c.keep([
    ...b.base.filter((node) => node !== b.request && node !== b.reply),
    key,
    target,
    ledger,
    job,
    ...second,
    answer,
  ]);
}
