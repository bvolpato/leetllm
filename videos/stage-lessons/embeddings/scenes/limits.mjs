import { column, dynamic, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, cosine, fmt } from '../parts.mjs';
export default function limits(s, c) {
  const shift = s.value(0),
    center = s.value(0),
    zoom = s.value(0),
    raw = Object.values(V),
    mean = raw[0].map((_, j) => raw.reduce((n, v) => n + v[j], 0) / raw.length);
  const p = plane(s, {
    range: () => [-0.8, 4.5 - 3.7 * zoom.value],
    title: 'shared offset, changing directions',
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const current = () =>
    raw.map((v) =>
      v.map((x, j) => x + 3 * shift.value - center.value * (mean[j] + 3 * shift.value)),
    );
  const rays = raw.map((_, i) =>
    p.vector(() => current()[i], ['blue', 'cyan', 'cyan', 'green'][i]),
  );
  const link = dynamic(() => [
    line(p.point(current()[1]), p.point(current()[3]), { stroke: 'yellow', width: 4 }),
  ]);
  const input = place(
    column(
      [
        label('river ↔ money', { color: 'yellow' }),
        note('one common translation'),
        mono('add [3, 3]'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const read = dynamic(() => {
    const v = current(),
      distance = Math.hypot(...v[1].map((x, j) => x - v[3][j]));
    return column(
      [
        mono(`distance ${fmt(distance)}`, { color: 'yellow' }),
        mono(`cosine ${fmt(cosine(v[1], v[3]))}`, { color: 'yellow' }),
      ],
      { gap: 'normal' },
    ).nodes.map((n) => n);
  });
  // The live numbers use a fixed region instead of following their endpoints.
  const distance = dynamic(() =>
    mono(`distance ${fmt(Math.hypot(...current()[1].map((x, j) => x - current()[3][j])))}`, {
      color: 'yellow',
    }).moveTo(MID.point('center')),
  );
  const cos = dynamic(() =>
    mono(`cosine ${fmt(cosine(current()[1], current()[3]))}`, { color: 'yellow' }).moveTo(
      LOW.point('center'),
    ),
  );
  const centering = place(
    column(
      [
        label('subtract the population mean', { color: 'yellow' }),
        note('one fixed translation for every vector'),
        note('the view zooms during centering'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, rays, link, input, distance, cos);
  c.on('shift', () => s.play(shift.to(1, { duration: 2.5 })));
  c.swap('center', input, centering);
  c.on('center', () => s.play(center.to(1, { duration: 2.5 }), zoom.to(1, { duration: 2.5 })));
  c.on('evaluate', () => s.play(zoom.to(0.85, { duration: 1.2 })));
  c.keep(p.frame);
}
