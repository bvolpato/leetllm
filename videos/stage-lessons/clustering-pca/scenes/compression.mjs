import { assertEqual, circle, column, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { IDS, cloud, distance, foot, left, mix, pca, query, ribbon, right, xy } from '../parts.mjs';

export default function scene(s, c) {
  const map = cloud(left, { assigned: true });
  const project = (point) => {
    const score = point.reduce((sum, v, j) => sum + (v - pca.mean[j]) * pca.vector[j], 0);
    return pca.mean.map((v, j) => v + score * pca.vector[j]);
  };
  const feet = xy.map(project);
  const queryFoot = project(query);
  const nearest = (docs, q) => {
    const distances = docs.map((p) => distance(p, q));
    return IDS[distances.indexOf(Math.min(...distances))];
  };
  assertEqual(nearest(xy, query), 'B', 'full-space duplicate-charge lookup');
  assertEqual(nearest(feet, queryFoot), 'C', 'PC1 duplicate-charge lookup');
  const cError = distance(xy[2], feet[2]) ** 2;
  const totalError = xy.reduce((sum, p, i) => sum + distance(p, feet[i]) ** 2, 0);
  assertEqual(
    Math.abs(pca.residual - totalError) < 1e-9,
    true,
    'sum of document reconstruction errors',
  );
  const firstDrop = s.value(0),
    drop = s.value(0);
  const current = (p, end, t) => p.map((v, j) => mix(v, end[j], t));
  const documentAt = (i) =>
    current(xy[i], feet[i], i === 2 ? Math.max(drop.value, firstDrop.value) : drop.value);
  const queryAt = () => current(query, queryFoot, drop.value);
  const axis = line(
    ...[-4.4, 4.6].map((t) => map.p(pca.mean.map((v, j) => v + t * pca.vector[j]))),
    { stroke: 'dim', width: 4 },
  ).zIndex(-2);
  const trails = dynamic(() =>
    group(
      ...xy.flatMap((p, i) => {
        const from = map.p(p),
          to = map.p(documentAt(i));
        if (Math.hypot(to[0] - from[0], to[1] - from[1]) < 1) return [];
        return [
          circle(8, { stroke: 'red', width: 3 }).moveTo(from),
          line(from, to, { stroke: 'red', width: 4 }),
        ];
      }),
    ),
  ).zIndex(-2);
  const q = dynamic(() => {
    const [x, y] = map.p(queryAt());
    return group(
      dot(13, 'yellow').moveTo([x, y]),
      label('Q', { size: 34, color: 'yellow' }).moveTo([x, y - 39]),
    );
  });
  const lengths = dynamic(() =>
    group(
      ...[1, 2].map((i) =>
        line(map.p(queryAt()), map.p(documentAt(i)), { stroke: 'yellow', width: 4 }),
      ),
    ),
  ).zIndex(-1);
  const [caption, bRow, cRow, result] = right.rows([1.35, 1.7, 1.7, 0.85], 'normal');
  const reading = [1, 2].flatMap((i, k) => {
    const [name, value] = [bRow, cRow][k].rows(2, 'tight');
    const [baseline, live] = value.columns(2, 'normal');
    return [
      place(
        label(k === 0 ? 'B   Duplicate payment' : 'C   Missing reset link', { size: 37 }),
        name,
        'bottom left',
      ),
      place(mono(distance(xy[i], query).toFixed(3), { size: 42 }), baseline),
      dynamic(() =>
        mono(distance(queryAt(), documentAt(i)).toFixed(3), {
          size: 44,
          color: 'cyan',
        }).moveTo(live.point('center')),
      ),
    ];
  });
  const source = place(
    column(
      [
        label('Reconstruct message C', { size: 38 }),
        mono(`z = ${pca.scores[2].toFixed(3)}`, { size: 40 }),
        mono('mean + z × direction', { size: 32 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const error = place(
    mono(`C’s squared gap ≈ ${cError.toFixed(3)}`, { size: 38, color: 'red' }),
    foot,
  );
  const allSix = place(
    note('All six messages searched    ·    Tracking distances to B and C'),
    ribbon,
  );
  const [title, columns] = caption.rows(2, 'tight');
  const [baseline, live] = columns.columns(2, 'normal');
  const distanceName = [
    place(label('Distance from Q', { size: 38 }), title),
    place(note('Original 2D'), baseline),
    place(note('On the map'), live),
  ];
  const flat = place(label('Full search returns B', { size: 39, color: 'yellow' }), result);
  const ask = place(label('Closest on the line?', { size: 39, color: 'yellow' }), result);
  const wrong = place(label('PC1 search returns C', { size: 39, color: 'pink' }), result);
  const restored = place(label('Full search returns B', { size: 39, color: 'yellow' }), result);
  const spread = place(
    note(
      `PC1 retains ${(100 * pca.varianceKept).toFixed(1)}% of corpus variance    ·    Total squared gap ≈ ${totalError.toFixed(3)}`,
    ),
    foot,
  );
  const zero = place(note('Both coordinates restored    ·    Total squared gap = 0'), foot);
  const targets = (coords) => Object.fromEntries(IDS.map((id, i) => [id, coords[i]]));

  s.add(heading(c.title), map.chart, axis, trails, source);
  c.on('single', () => s.play(firstDrop.to(1), map.chart.move('C', feet[2]), { duration: 1.1 }));
  c.show('error', error, { after: true });
  c.hide('rewind', [error, source]);
  c.on('rewind', () => s.play(firstDrop.to(0), map.chart.move('C', xy[2]), { duration: 0.8 }));
  c.show('query', [q, lengths, reading, allSix, distanceName]);
  c.show('baseline', flat, { after: true });
  c.hide('drop', flat);
  c.on('drop', () => s.play(drop.to(1), map.chart.move(targets(feet)), { duration: 1.8 }));
  c.show('kept', spread, { after: true });
  c.show('predict', ask);
  c.swap('wrong', ask, wrong, { after: true });
  c.hide('restore', [wrong, spread]);
  c.on('restore', () => s.play(drop.to(0), map.chart.move(targets(xy)), { duration: 1.6 }));
  c.show('zero', zero, { after: true });
  c.show('answer', restored, { after: true });
  c.keep(map.chart);
}
