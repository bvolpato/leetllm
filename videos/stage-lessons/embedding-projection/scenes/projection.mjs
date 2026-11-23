import { dot, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, RIGHT, TOP } from '../parts.mjs';
import { clauses, distanceFromQuery, policyWindow } from '../policy-window.mjs';

export default function projection(s, c) {
  const map = policyWindow(s);
  const [caption, ...rows] = RIGHT.rows(4, 'normal');
  const readout = rows.map((r, i) => {
    const item = clauses[i + 1];
    const x = r.left + 25,
      y = r.cy + 24,
      length = r.width - 160;
    return group(
      label(item.name, { size: 35, color: item.color }).moveTo([x + 58, y - 44]),
      line([x, y], [x + length, y], { stroke: 'dim', width: 3 }),
      ...[0, 1, 2, 4, 6, 8].map((v) =>
        line([x + (length * v) / 8, y - 9], [x + (length * v) / 8, y + 9], {
          stroke: 'dim',
          width: 2,
        }),
      ),
      dynamic(() => {
        const d = distanceFromQuery(item, map.depth.value);
        return group(
          dot(14, item.color).moveTo([x + (length * d) / 8, y]),
          mono(Number(d.toFixed(1)).toString(), { color: item.color, size: 45 }).moveTo([
            r.right - 53,
            y,
          ]),
        );
      }),
    );
  });
  const coords = place(
    mono('z    query  0      rotation  0      access  0      merge  8', { size: 36 }),
    TOP,
  );
  const question = place(
    label('With z restored, which clause is nearest?', { color: 'yellow' }),
    FOOT,
  );
  const found = place(
    label('Full-vector search returns the rotation clause.', { color: 'green' }),
    FOOT,
  );
  const flattened = place(
    label('Two-coordinate search returns the merge clause.', { color: 'blue' }),
    FOOT,
  );
  s.add(
    heading(c.title),
    place(note('Euclidean distance from the key question'), caption),
    readout,
  );
  c.take([...map.axes, ...map.marks, map.scale]);
  c.show('window-depth', [map.depthAxis, coords]);
  c.show('window-ask', question);
  c.on('window-lift', () => s.play(map.depth.to(1, { duration: 2.2 })));
  c.swap('window-neighbor', question, found, { after: true });
  c.on('window-drop', () => s.play(map.depth.to(0, { duration: 2.2 })));
  c.hide('window-drop', found);
  c.show('window-collision', flattened, { after: true });
}
