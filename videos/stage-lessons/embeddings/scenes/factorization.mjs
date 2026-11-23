import { column, dot, indicate, place, to } from 'vizmatic/stage';
import { heading, label, mono, note, chip } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, vec, fmt } from '../parts.mjs';
import { countRepresentation } from '../../../films/embeddings/model.mjs';
export default function factorization(s, c) {
  const m = countRepresentation(),
    p = plane(s, {
      range: [-1.2, 1.2],
      title: 'one fitted basis',
      xName: 'singular direction 1',
      yName: 'singular direction 2',
    });
  const names = ['apple', 'pear', 'river', 'lake'],
    colors = ['cyan', 'cyan', 'green', 'green'];
  const rows = place(
    column(
      names.map((name, i) => label(`${name}  ${vec(m.ppmi[i])}`, { size: 34, color: colors[i] })),
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const points = names.map((name, i) => dot(i % 2 ? 9 : 15, colors[i]).moveTo(TOP.point('left')));
  const labels = names.map((name, i) =>
    chip(name, { color: colors[i], width: 140 }).moveTo([
      p.point(m.vectors[i])[0],
      p.point(m.vectors[i])[1] + (i % 2 ? 54 : -54),
    ]),
  );
  const singular = place(
    column(
      [
        label('keep two directions'),
        mono(m.singular.map((v) => fmt(v)).join('   ')),
        note('U √Σ   /   V √Σ'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const comparison = place(
    column(
      [
        label('apple · pear: cosine 1', { color: 'cyan' }),
        label('apple · river: cosine 0', { color: 'green' }),
        note('one basis for every word'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const flip = s.value(1),
    rays = m.vectors.map((v, i) => p.vector(() => [v[0] * flip.value, v[1]], colors[i]));
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, rows);
  c.show('two', points);
  c.on('two', () =>
    s.play(
      ...points.map((n, i) => to(n, (q) => q.moveTo(p.point(m.vectors[i])), { duration: 1.8 })),
    ),
  );
  c.show('scale', rays);
  c.show('singular', singular, { after: true });
  c.show('same', [labels[0], labels[1], comparison.nodes[0]], { after: true });
  c.show('cross', [labels[2], labels[3], comparison.nodes[1], comparison.nodes[2]], {
    after: true,
  });
  c.hide('sign', labels);
  c.hide('sign', points);
  c.on('sign', () => s.play(flip.to(-1, { duration: 1.8 })));
}
