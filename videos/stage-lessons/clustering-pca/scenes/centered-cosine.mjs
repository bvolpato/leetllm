import { arrow, assertEqual, circle, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { cloud, cosine, distance, foot, left, ribbon, right } from '../parts.mjs';

export default function scene(s, c) {
  const points = [
    [1, 2],
    [1.1, 2.1],
    [2, 1],
  ];
  const names = ['Q', 'D1', 'D2'];
  const colors = ['yellow', 'cyan', 'blue'];
  const mean = points[1].map((v, j) => (v + points[2][j]) / 2);
  const translate = (p, t) => p.map((v, j) => v - t * mean[j]);
  const centered = points.map((p) => translate(p, 1));
  const initial = points.slice(1).map((p) => cosine(points[0], p));
  assertEqual(
    initial[1] > 0 && cosine(centered[0], centered[2]) < 0,
    true,
    'D2 crosses a right angle',
  );
  const map = cloud(left, {
    coords: points,
    names,
    colors,
    x: [-1, 2.5],
    y: [-1, 2.5],
    heightRatio: 0.8,
    autoNames: true,
  });
  const progress = s.value(0);
  const vectors = dynamic(() =>
    group(
      ...points.map((p, i) =>
        arrow(map.p([0, 0]), map.p(translate(p, progress.value)), { stroke: colors[i], width: 5 }),
      ),
    ),
  ).zIndex(-2);
  const [name, ...rows] = right.rows([1, 1.2, 1.2, 1.4], 'normal');
  const headers = name.columns([0.6, 1.25, 1.25], 'tight');
  const fixed = place(note('Original'), headers[1], 'bottom');
  const moving = place(note('During shift'), headers[2], 'bottom');
  const fitted = place(note('Centered'), headers[2], 'bottom');
  const originals = [],
    currents = [];
  for (const [index, doc] of points.slice(1).entries()) {
    const slots = rows[index].columns([0.6, 1.25, 1.25], 'tight');
    originals.push(
      place(label(names[index + 1], { size: 37, color: colors[index + 1] }), slots[0]),
      place(mono(initial[index].toFixed(4), { size: 35 }), slots[1]),
    );
    currents.push(
      dynamic(() =>
        mono(
          cosine(translate(points[0], progress.value), translate(doc, progress.value)).toFixed(4),
          { size: 35, color: colors[index + 1] },
        ).moveTo(slots[2].point('center')),
      ),
    );
  }
  const gaps = centered
    .slice(1)
    .map((p, i) =>
      line(map.p(centered[0]), map.p(p), { stroke: colors[i + 1], width: 4 }).zIndex(-1),
    );
  const values = place(
    note(
      'Distances from Q    ·    ' +
        points
          .slice(1)
          .map((p, i) => names[i + 1] + ' ' + distance(p, points[0]).toFixed(3))
          .join('    ·    '),
    ),
    foot,
  );
  const origin = circle(19, { stroke: 'pink', width: 5 }).moveTo(map.p([0, 0]));
  const zero = place(note('At the fitted mean: cosine undefined'), rows[2]);
  s.add(heading(c.title), map.chart, vectors, place(note('Cosine with the yellow query'), ribbon));
  c.show('original', [fixed, originals]);
  c.show('translate', [moving, currents]);
  c.on('translate', () =>
    s.play(
      progress.to(1),
      map.chart.move(Object.fromEntries(names.map((id, i) => [id, centered[i]]))),
      { duration: 2.2 },
    ),
  );
  c.swap('values', moving, fitted);
  c.show('distance', [gaps, values]);
  c.show('zero', [origin, zero], { after: true });
}
