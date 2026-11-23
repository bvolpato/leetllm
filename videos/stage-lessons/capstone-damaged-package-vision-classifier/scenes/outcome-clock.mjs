import { dot, dynamic, grid, indicate, line, place, rect, table, to } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { cast, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Review time and availability time are different clocks'));
  const [head, body, foot] = work.rows([2, 4, 1], 'wide');
  const cutoff = s.value(12);
  const t = place(
    table(
      [
        { key: 'id', label: 'Evidence' },
        { key: 'capture', label: 'Capture' },
        { key: 'review', label: 'Review' },
        { key: 'available', label: 'Available' },
      ],
      [{ id: 'R-408', capture: 10, review: 12, available: 12 }],
      { size: 36, width: head.width },
    ),
    head,
  );
  const lanes = body.rows(3, 'loose');
  const rail = lanes.map((r, i) => {
    const [name, track] = r.columns([1, 4], 'wide');
    return {
      name: place(label(['Capture', 'Review', 'Available'][i], { size: 34, color: 'dim' }), name),
      track,
    };
  });
  const lines = rail.map((x) =>
    place(rect(x.track.width, 6, { fill: 'grid', stroke: null }), x.track),
  );
  const dayAt = (day, i) => [
    rail[i].track.left + ((day - 10) / 4) * rail[i].track.width,
    rail[i].track.point('center')[1],
  ];
  const marks = [
    dot(20, 'cyan').moveTo(dayAt(10, 0)),
    dot(20, 'green').moveTo(dayAt(12, 1)),
    dot(20, 'green').moveTo(dayAt(12, 2)),
  ];
  const readout = dynamic(() =>
    line(dayAt(cutoff.value, 0), dayAt(cutoff.value, 2), { stroke: 'yellow', width: 3 }),
  );
  const note12 = place(label('Readout day 12', { color: 'yellow' }), foot);
  const delayed = place(
    label('Available day 13 → wait outside this report', { color: 'red', size: 34 }),
    foot,
  );
  s.add(
    t,
    rail.map((x) => x.name),
    lines,
    marks,
    readout,
    note12,
  );
  c.on('eligible', () => s.play(indicate(marks[2], { scale: 1, color: 'green' })));
  c.on('late', () =>
    s.play(
      to(marks[2], (n) => n.moveTo(dayAt(13, 2)), { duration: 1.6 }),
      t.setCell('R-408', 'available', 13, { duration: 0.4 }),
    ),
  );
  c.swap('wait', note12, delayed, { after: true });
  c.on('append', () => s.play(indicate(t, { scale: 1, color: 'yellow' })));
  c.clear([readout], 0.6, 0.2);
}
