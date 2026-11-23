import { column, fadeIn, group, line, linear, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { FOOT, RIGHT } from '../parts.mjs';
import { clauses, policyWindow } from '../policy-window.mjs';

export default function opening(s, c) {
  const [header, ...rows] = area.rows([0.45, 1, 1, 1], 'normal');
  const [words, xCell, yCell, zCell, margin] = area.columns([2.7, 1, 1, 1, 0.9], 'none');
  const title = heading(c.title);
  const kept = [
    mono('x', { size: 46 }).at(xCell.cx, header.cy),
    mono('y', { size: 46 }).at(yCell.cx, header.cy),
  ];
  const dropped = [mono('z', { size: 46 }).at(zCell.cx, header.cy)];
  const items = [
    [clauses[0], '18-day key', 'Can I keep using it?'],
    [clauses[1], 'Rotation rule', 'Over 14 days? Open a ticket.'],
    [clauses[3], 'Merge rule', 'A failed scan blocks a merge.'],
  ];
  for (const [i, [item, name, excerpt]] of items.entries()) {
    const row = rows[i];
    const height = row.height * 0.82;
    const width = yCell.right - words.left - 8;
    const left = words.left + 42;
    kept.push(
      rect(width, height, { fill: 'surface', stroke: 'grid', radius: 16 }).at(
        words.left + width / 2,
        row.cy,
      ),
      line([words.left + 9, row.cy - height * 0.38], [words.left + 9, row.cy + height * 0.38], {
        stroke: item.color,
        width: 9,
      }),
      place(label(name, { color: item.color, size: 58 }), row, 'left').shift(left - row.left, -30),
      place(label(excerpt, { size: 37 }), row, 'left').shift(left - row.left, 36),
      mono(String(item.coordinates[0]), { size: 104 }).at(xCell.cx, row.cy),
      mono(String(item.coordinates[1]), { size: 104 }).at(yCell.cx, row.cy),
    );
    const highlighted = item.coordinates[2] !== 0;
    dropped.push(
      rect(zCell.width - 16, height, {
        fill: highlighted ? item.color : 'surface',
        stroke: item.color,
        radius: 16,
        width: 3,
      }).at(zCell.cx, row.cy),
      mono(String(item.coordinates[2]), { color: highlighted ? 'bg' : item.color, size: 104 }).at(
        zCell.cx,
        row.cy,
      ),
    );
  }

  const vectors = group(...kept);
  const strip = group(...dropped);
  const first = [title, vectors, strip];
  s.add(...first);
  s.play(fadeIn(first, { duration: 0 }));
  s.play(to(strip, (node) => node.shift(margin.width * 0.93, 0), { duration: 1.8, ease: linear }));
  c.hide('open-two', strip);

  const map = policyWindow(s);
  const plot = [...map.axes, ...map.marks, map.scale];
  const address = (item) => '(' + item.coordinates.slice(0, 2).join(', ') + ')';
  const hit = place(
    column(
      [
        label('18-day key   ' + address(clauses[0]), { color: 'cyan', size: 50 }),
        label('Merge rule   ' + address(clauses[3]), { color: 'blue', size: 50 }),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );
  const rotation = place(
    label('Rotation rule   ' + address(clauses[1]), { size: 41, color: 'green' }),
    FOOT,
  );
  c.swap('open-hit', [title, vectors], [heading('Two rows land on one point'), ...plot, hit], {
    after: true,
  });
  c.show('open-rotation', rotation);
  c.keep(plot);
}
