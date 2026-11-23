// Scene `action-boundary`: application code decides if a proposal leaves.
//
// The picture: the model at the left, a wall with one door on the lane, the controller at the
// right. The list of what is allowed is under the model, and the wall reads it. A status read
// goes through the door. The rollback stops, because its approval place is empty. A proposal
// with a bad schema bounces, is repaired one time and passes. A denied proposal bounces again.
import {
  appear,
  beside,
  column,
  indicate,
  line,
  moveTo,
  place,
  pulse,
  row,
  seq,
  shake,
  vanish,
} from 'vizmatic/stage';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, board, docked, token, travel, wall } from '../parts.mjs';

/** The door takes this long to open or to shut. */
const DOOR = 0.4;

export default function actionBoundary(s, c) {
  const b = board({ agentName: 'model', view: false, ledger: false });
  const laneY = b.out[1];
  const lower = b.region.rows(2, 'none')[1];

  // What is allowed: the task gives a status read, and the place of an approval is empty.
  const task = chip('task: status question', { color: COLOR.attempt, stroke: COLOR.attempt });
  const grant = chip('status read', { color: COLOR.sure, stroke: COLOR.sure });
  const gives = mono('→', { color: 'dim' });
  const slot = chip(`approval: ${OP.revision}, now`, {
    color: 'dim',
    stroke: 'dim',
    dash: [10, 8],
  });
  const allowedName = note('what is allowed');
  place(column([allowedName, row([task, gives, grant]), slot], { gap: 'normal' }), lower, 'left');

  // The wall is at six tenths of the lane. It goes down to the place of the approval.
  const at = [b.out[0] + (b.door[0] - b.out[0]) * 0.6, laneY];
  const slotY = slot.center[1];
  const gate = wall(s, { at, top: b.region.top, bottom: slotY });
  const gateName = beside(
    row([note('application code'), label('admission check')]),
    [at[0], b.region.top],
    'left',
    'normal',
    'top',
  );
  // The wall reads the list on these two lines.
  const wire = { stroke: 'faint', width: 3 };
  const grantY = grant.center[1];
  const readLine = line([grant.right[0] + 12, grantY], [at[0], grantY], wire);
  const approvalLine = line([slot.right[0] + 12, slotY], [at[0], slotY], wire);

  // The proposals. Each one starts at the model. A call that is let out rests inside the controller.
  const start = (node) => docked(node, b.out, 'right');
  const inside = (node, index) => [
    b.store.left + node.width / 2 + 24,
    laneY + index * (node.height + 16),
  ];
  const read = token('get_status()');
  const write = token(`${OP.action} → ${OP.revision}`, COLOR.op);
  const bad = token('get_status(??)');
  const fixed = token('get_status(run)');
  const again = token(`${OP.action} → ${OP.revision}`, COLOR.op);
  // A denied proposal waits under the lane, before the wall, with what the wall found under it.
  const parked = [gate.before(write)[0], laneY + write.height + 40];
  write.moveTo(parked);
  const checks = [
    note('valid name', { color: COLOR.sure }),
    note('valid arguments', { color: COLOR.sure }),
    note('no approval', { color: COLOR.fail }),
  ];
  beside(row(checks), write, 'under', 'tight', 'right');
  const ends = beside(
    note('this path ends', { color: COLOR.fail }),
    checks,
    'under',
    'tight',
    'right',
  );
  const badMark = beside(
    chip('schema: invalid', { color: COLOR.fail, stroke: COLOR.fail }),
    gate.before(bad),
    'above',
    'wide',
  );
  const repair = beside(
    chip('repair 1 of 1', { color: COLOR.attempt, stroke: COLOR.attempt }),
    b.agent,
    'above',
    'normal',
    'left',
  );
  for (const node of [read, write, bad, again]) node.moveTo(start(node));
  fixed.moveTo(start(fixed));

  s.add(heading(c.title), b.base, gate.nodes, gateName, allowedName, task, readLine);
  b.close(c);
  c.on('app-decides', () => s.play(indicate(gateName.nodes[0], { color: COLOR.mark, scale: 1 })));

  // A status read: the wall finds the grant, the door opens, and the call goes out.
  c.on('proposed-read', () => s.play(travel(read, gate.before(read), { duration: 1.2 })));
  c.show('read-authority', [gives, grant]);
  c.on('read-authority', () =>
    s.play(
      seq(
        pulse(readLine, { color: COLOR.sure, duration: 0.5 }),
        gate.open.to(1, { duration: DOOR }),
        moveTo(read, inside(read, -1), { duration: 0.9 }),
      ),
    ),
  );

  // The rollback: the door shuts, the proposal stops, and the place of its approval is empty.
  c.on('rollback-proposal', () =>
    s.play(
      gate.open.to(0, { duration: DOOR }),
      travel(write, gate.before(write), { duration: 1.4 }),
    ),
  );
  c.show('separate-approval', [slot, approvalLine]);
  c.on('separate-approval', () =>
    s.play(
      indicate(slot, { color: COLOR.mark }),
      seq(shake(write, { duration: 0.4 }), moveTo(write, parked, { duration: 0.6 })),
    ),
  );
  c.show('valid-request', [checks[0], checks[1]], { stagger: true });
  c.show('no-approval', checks[2]);
  c.on('no-approval', () => s.play(pulse(approvalLine, { color: COLOR.fail, duration: 0.6 })));

  // A bad schema: the proposal bounces, the runtime asks one time, and the new proposal passes.
  c.on('schema-fail', () =>
    s.play(
      seq(
        travel(bad, gate.before(bad), { duration: 0.9 }),
        shake(bad, { duration: 0.4 }),
        moveTo(bad, start(bad), { duration: 0.8 }),
      ),
    ),
  );
  c.show('schema-fail', badMark, { after: true });
  c.on('bounded-repair', () =>
    s.play(vanish(bad), appear(fixed), indicate(fixed, { color: COLOR.mark })),
  );
  c.show('bounded-repair', repair);
  c.hide('readmit-repaired', badMark);
  c.on('readmit-repaired', () =>
    s.play(
      seq(
        moveTo(fixed, gate.before(fixed), { duration: 0.7 }),
        gate.open.to(1, { duration: DOOR }),
        moveTo(fixed, inside(fixed, 1), { duration: 0.7 }),
        gate.open.to(0, { duration: DOOR }),
      ),
    ),
  );

  // A denial ends the path: the same proposal bounces again, and the place stays empty.
  c.show('permission-failure', ends);
  c.on('permission-failure', () => s.play(indicate(checks[2], { color: COLOR.fail, scale: 1.2 })));
  c.on('repeat-call', () =>
    s.play(
      seq(
        travel(again, gate.before(again), { duration: 0.8 }),
        shake(again, { duration: 0.4 }),
        moveTo(again, start(again), { duration: 0.6 }),
        vanish(again),
        indicate(slot, { color: COLOR.mark }),
      ),
    ),
  );
}
