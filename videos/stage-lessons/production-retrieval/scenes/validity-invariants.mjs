import {
  arrow,
  assertEqual,
  dot,
  indicate,
  numberLine,
  place,
  seq,
  to,
  table,
} from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame } from '../parts.mjs';
import { halfOpenCurrent } from '../../../films/production-retrieval/arithmetic.mjs';
export default function validityInvariants(s, c) {
  const f = evidenceFrame(c);
  const [calendarRoom, logicalRoom, checksRoom] = f.work.rows([3, 3.3, 2.7], 'normal');
  const calendar = place(
    table(
      ['revision', 'inclusive calendar dates'],
      [
        { id: 'old', revision: 'v1', 'inclusive calendar dates': 'ends 2026-03-31' },
        { id: 'new', revision: 'v2', 'inclusive calendar dates': 'begins 2026-04-01' },
      ],
      { size: 34, width: f.work.width, leading: 1.7 },
    ),
    calendarRoom,
  );
  const split = 20;
  assertEqual(
    halfOpenCurrent({ start: 0, end: split }, split),
    false,
    'old interval excludes its end',
  );
  assertEqual(
    halfOpenCurrent({ start: split, end: null }, split),
    true,
    'replacement includes its start',
  );
  const [logicalTitleRoom, oldRoom, newRoom] = logicalRoom.rows([1, 2, 2], 'normal');
  const logicalTitle = place(note('Logical time · blue request cursor'), logicalTitleRoom, 'left');
  const tracks = [oldRoom, newRoom].map((room, index) => {
    const [nameRoom, axisRoom] = room.columns([2, 5], 'normal');
    const name = place(
      note(index === 0 ? 'v1 [0, 20)' : 'v2 [20, ∞)', {
        color: index === 0 ? 'pink' : 'cyan',
      }),
      nameRoom,
      'left',
    );
    const axis = numberLine({
      range: [0, 40],
      length: axisRoom.inset('normal').width,
      ticks: [0, 20],
      size: 34,
      labelSize: 34,
      format: String,
      color: 'dim',
      tips: false,
    });
    const interval =
      index === 0 ? axis.interval(0, split, { color: 'pink', openRight: true, width: 7 }) : null;
    place(axis, axisRoom);
    return { name, axis, interval };
  });
  const [oldTrack, newTrack] = tracks;
  const replacement = [
    arrow(newTrack.axis.world(split), newTrack.axis.world(40), {
      stroke: 'cyan',
      width: 7,
      pad: 0,
    }),
    dot(9, 'cyan').moveTo(newTrack.axis.world(split)),
  ];
  const cursorPoint = (track, value) => {
    const [x, y] = track.axis.world(value);
    return [x, y - 24];
  };
  replacement.forEach((n) => n.opacity(0.45));
  const cursor = dot(10, 'blue').moveTo(cursorPoint(oldTrack, 19));
  const from = cursorPoint(oldTrack, 19),
    target = cursorPoint(newTrack, split);
  const detour = [target[0] + 65, (from[1] + target[1]) / 2];
  const activeOld = place(note('Selected: v1', { color: 'yellow' }), logicalTitleRoom, 'right');
  const activeNew = place(note('Selected: v2', { color: 'yellow' }), logicalTitleRoom, 'right');
  const checks = place(
    table(
      ['contract', { key: 'state', sample: 'rejected' }],
      [
        {
          id: 'ids',
          contract: 'duplicate chunk IDs',
          state: { value: 'pending', state: 'pending' },
        },
        { id: 'range', contract: 'reversed dates', state: { value: 'pending', state: 'pending' } },
        {
          id: 'scope',
          contract: 'two active versions',
          state: { value: 'pending', state: 'pending' },
        },
      ],
      { width: f.work.width, size: 29, leading: 1.45 },
    ),
    checksRoom,
  );
  const outcome = place(
    label('At 20: only the replacement is current', { color: 'yellow' }),
    f.foot,
  );
  const grant = place(label('Same bytes · grant revoked → do not serve', { color: 'red' }), f.foot);
  s.add(
    heading(c.title),
    f.nodes,
    calendar,
    logicalTitle,
    tracks.map((t) => [t.name, t.axis]),
    replacement,
    cursor,
    activeOld,
    checks,
  );
  carryIdentity(c, f);
  c.on('pr-dates', () => s.play(indicate(calendar, { scale: 1, color: 'yellow' })));
  c.on('pr-invalid', () =>
    s.play(
      ...['ids', 'range', 'scope'].map((id) =>
        checks.setCell(id, 'state', { value: 'rejected', state: 'fail' }, { duration: 0.5 }),
      ),
    ),
  );
  c.on('pr-at-twenty', () =>
    s.play(
      seq(
        to(cursor, (n) => n.moveTo(detour), { duration: 0.4 }),
        to(cursor, (n) => n.moveTo(target), { duration: 0.4 }),
      ),
    ),
  );
  c.after('pr-at-twenty', () =>
    s.play(
      to(oldTrack.interval, (n) => n.opacity(0.4), { duration: 0.2 }),
      ...replacement.map((node) => to(node, (n) => n.opacity(1), { duration: 0.2 })),
    ),
  );
  c.swap('pr-at-twenty', activeOld, activeNew, { after: true });
  c.on('pr-halfopen', () => s.play(indicate(replacement, { scale: 1, color: 'yellow' })));
  c.show('pr-halfopen', outcome, { after: true });
  c.swap('pr-authority-revision', outcome, grant, { after: true });
}
