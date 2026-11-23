import { dot, place, table, to } from 'vizmatic/stage';
import { heading, label, namedBox, tint } from '../../kit-narrated.mjs';
import { cast, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Passing a synthetic harness still leaves an evidence gap'));
  const [top, body, foot] = work.rows([2, 4, 1], 'wide');
  const ladder = top.columns(3, 'wide');
  const levels = ['Harness', 'Real evidence', 'Shadow service'].map((x, i) =>
    place(
      namedBox(x, { width: ladder[i].width, height: 130, color: 'dim', dash: i > 0 }),
      ladder[i],
    ),
  );
  const checks = place(
    table(
      [
        { key: 'id', label: 'Required layer' },
        { key: 'status', label: 'Evidence', sample: 'Not demonstrated' },
      ],
      [
        { id: 'Fixture replay', status: 'Pending' },
        { id: 'Photographs + weights', status: 'Absent' },
        { id: 'Previous bundle', status: 'Name only' },
        { id: 'Recovery drill', status: 'Not demonstrated' },
      ],
      { width: body.width, size: 34 },
    ),
    body,
  );
  const token = place(dot(20, 'cyan'), ladder[0], 'bottom');
  const hold = place(label('HOLD · synthetic fixture', { color: 'red' }), foot);
  const restore = place(
    label('Locate → load → demonstrate restored behavior', { color: 'yellow', size: 34 }),
    foot,
  );
  s.add(levels, checks, token);
  c.after('harness', () =>
    s.play(
      tint(levels[0], 'green'),
      checks.setCell('Fixture replay', 'status', 'Pass', { duration: 0.4 }),
    ),
  );
  c.show('harness', hold, { after: true });
  c.on('pointer', () => s.play(checks.light('Previous bundle')));
  c.swap('recovery', hold, restore);
  c.on('recovery', () => s.play(checks.light('Recovery drill')));
  c.on('shadow', () =>
    s.play(
      to(token, (n) => place(n, ladder[1], 'bottom'), { duration: 1.4 }),
      tint(levels[1], 'red'),
    ),
  );
}
