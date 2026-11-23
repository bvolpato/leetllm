import { indicate, place } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, REQUEST_Y } from '../parts.mjs';

export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const byFeature = [0.1, -0.1],
    byRequest = [0.1, -0.1, 0];
  const appliedColumns = s.value(0),
    appliedRows = s.value(0);
  const axes = { rows: ['A', 'B', 'C'], columns: ['time (s)', 'priority'] };
  const featureTable = ownedTable(left, {
    ...axes,
    title: 'Offsets by feature  (2,)',
    values: () =>
      REQUEST_Y.map((r) => r.map((v, j) => v + (j < appliedColumns.value ? byFeature[j] : 0))),
    cellColor: (_, j) => (j < appliedColumns.value ? ['blue', 'pink'][j] : 'dim'),
  });
  const rowTable = ownedTable(right, {
    ...axes,
    title: 'Offsets by request  (3, 1)',
    values: () =>
      REQUEST_Y.map((r, i) => r.map((v) => v + (i < appliedRows.value ? byRequest[i] : 0))),
    cellColor: (i) => (i < appliedRows.value ? ['blue', 'pink', 'dim'][i] : 'dim'),
  });
  const legend = place(mono('time  +0.1 s       priority  −0.1', { size: 40 }), f.foot);
  const other = place(mono('A  +0.1       B  −0.1       C  0', { size: 40 }), f.foot);
  const question = place(
    label('Which value in request B catches the mistake?', { color: 'yellow' }),
    f.foot,
  );
  const check = place(mono('B.time = 5 + 0.1 = 5.1 s', { size: 40, color: 'yellow' }), f.foot);
  s.add(f.title, featureTable.nodes, rowTable.nodes, legend);
  c.on('down-time', () => appliedColumns.set(1));
  c.on('down-priority', () => appliedColumns.set(2));
  c.after('feature-bias', () =>
    s.play(indicate(featureTable.rows[1], { scale: 1, duration: 0.55 })),
  );
  c.swap('across-rows', legend, other);
  c.on('across-rows', () => {
    for (let i = 0; i < 3; i++) {
      appliedRows.set(i + 1);
      s.play(indicate(rowTable.rows[i], { scale: 1, duration: 0.55 }));
    }
  });
  c.after('row-bias', () => s.play(indicate(rowTable.rows[1], { scale: 1, duration: 0.55 })));
  c.swap('check-b', other, question);
  c.after('test-time', () =>
    s.play(
      indicate([featureTable.cells[1][0], rowTable.cells[1][0]], {
        scale: 1,
        color: 'yellow',
        duration: 0.9,
      }),
    ),
  );
  c.swap('test-time', question, check, { after: true });
  c.on('broadcast-diagnosis', () =>
    s.play(indicate(featureTable.names[0], { scale: 1, duration: 0.8 })),
  );
}
