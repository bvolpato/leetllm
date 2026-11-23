// Restore the local checkpoint, then read and date the controller response.
//
// The picture: the line of the operation. The agent side holds a checkpoint with the key. The
// records of the controller are question marks, because a checkpoint cannot see them. On resume,
// the key goes to the ledger and a read goes to the job: each question mark becomes a record,
// and each answer goes into the view. The report says what was seen, with its time.
import {
  assertEqual,
  beside,
  column,
  fadeIn,
  fadeOut,
  moveTo,
  par,
  place,
  row,
  seq,
} from 'vizmatic/stage';
import { boundedRecoveryClaim, recoveryObservation } from '../../../films/agent-recovery/model.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, board, cross, docked, record, token, travel } from '../parts.mjs';

export default function resumeWithEvidence(s, c) {
  const observation = recoveryObservation();
  const now = 1000;
  const claim = boundedRecoveryClaim(observation, now);
  assertEqual(claim.age, 10, 'age of the controller observation in seconds');
  assertEqual(
    [observation.jobId, observation.state, claim.text],
    [OP.job, OP.state, `${OP.job} was ${OP.state} when checked`],
    'the claim',
  );

  const b = board();

  // The agent side: the approval over the agent, and the checkpoint under it.
  const approved = beside(
    chip('approved', { color: COLOR.sure, stroke: COLOR.sure }),
    b.agent,
    'above',
    'normal',
    'left',
  );
  const checkpoint = beside(
    chip('checkpoint: wait for the job', { color: COLOR.attempt, stroke: COLOR.attempt }),
    b.agent,
    'under',
    'normal',
    'left',
  );
  const key = beside(token(OP.key, COLOR.op), checkpoint, 'under', 'tight', 'left');
  const pending = beside(note('pending', { color: COLOR.op }), key, 'right', 'tight');
  const target = beside(
    token(`${OP.action} → ${OP.revision}`, COLOR.op),
    key,
    'under',
    'tight',
    'left',
  );

  // The controller: what a checkpoint cannot see, and what is there.
  const hidden = [0, 1].map((column) =>
    record([['?', 'dim']], b.recordWidth(column), { color: 'dim', dash: [10, 8] }).moveTo(
      b.durableAt(column),
    ),
  );
  const ledger = record(
    [
      [OP.key, COLOR.op],
      ['→', 'dim'],
      [OP.job, COLOR.sure],
    ],
    b.recordWidth(0),
  ).moveTo(b.durableAt(0));
  const job = record(
    [
      [observation.jobId, COLOR.sure],
      [observation.state, 'ink'],
    ],
    b.recordWidth(1),
  ).moveTo(b.durableAt(1));
  const unknown = label('?', { color: 'dim' }).moveTo(b.viewBox.point());

  // The sends, the answers, and the place where the first reply was lost.
  const lookup = token([[OP.key, COLOR.op]], COLOR.attempt, { tag: 'trace-a2' });
  const read = token('status?');
  for (const node of [lookup, read]) node.moveTo(docked(node, b.out, 'right'));
  const answer = token(OP.job, COLOR.sure);
  const seen = token(
    [
      [observation.jobId, COLOR.sure],
      [observation.state, 'ink'],
    ],
    COLOR.sure,
  );
  for (const node of [answer, seen]) node.moveTo(docked(node, b.exit));
  const broken = cross().moveTo(b.crossAt(answer));

  const [clockArea] = b.store.inset('normal').rows(2);
  const [thenSlot, nowSlot] = clockArea.columns(2, 'normal');
  const clock = (slot, name, seconds, color) =>
    place(
      column([note(name), mono(seconds + ' s', { size: 51, color })], { gap: 'tight' }),
      slot.inset('normal'),
      'bottom left',
    );
  const then = clock(thenSlot, 'Observed at', observation.observedAt, COLOR.sure);
  const current = clock(nowSlot, 'Clock now', now, 'ink');
  const age = place(
    mono(now + ' − ' + observation.observedAt + ' = ' + claim.age + ' s', {
      size: 47,
      color: COLOR.mark,
    }),
    b.store.rows(2)[1].inset('wide'),
    'bottom left',
  );
  const report = chip(
    observation.jobId + ' was ' + observation.state + ' ' + claim.age + ' seconds ago',
    {
      color: COLOR.sure,
      stroke: COLOR.sure,
    },
  );
  const reportName = note('report');
  beside(row([reportName, report]), b.view, 'under', 'normal', 'left');

  s.add(heading(c.title), b.base, broken, checkpoint);
  b.close(c);
  c.show('pending-identity', [key, pending]);
  c.show('verified-inputs', [target, approved]);
  c.show('job-question', [hidden, unknown]);

  // Resume: the key finds its row, and a read finds the job as it is now.
  c.hide('reconcile-controller', broken);
  c.on('reconcile-controller', () =>
    s.play(
      seq(
        travel(lookup, docked(lookup, b.door), { duration: 1 }),
        b.absorb(lookup),
        par(fadeOut(hidden[0], { duration: 0.2 }), fadeOut(unknown, { duration: 0.2 })),
        fadeIn(ledger, { duration: 0.3 }),
        b.arrive(answer, { duration: 1.2 }),
      ),
    ),
  );
  c.on('check-state', () =>
    s.play(
      seq(
        travel(read, docked(read, b.door), { duration: 0.9 }),
        b.absorb(read),
        fadeOut(hidden[1], { duration: 0.2 }),
        fadeIn(job, { duration: 0.3 }),
      ),
    ),
  );
  c.on('current-status', () =>
    s.play(
      seq(
        travel(seen, docked(seen, b.home, 'right'), { duration: 1 }),
        fadeOut(answer, { duration: 0.2 }),
        moveTo(seen, b.viewBox.point(), { duration: 0.35 }),
      ),
    ),
  );
  c.show('observed-at', then);
  c.show('current-time', current);
  c.show('age', age);
  c.show('bounded-claim', [reportName, report]);
  c.keep([...b.base.filter((node) => node !== b.request && node !== b.reply), ledger, job, seen]);
}
