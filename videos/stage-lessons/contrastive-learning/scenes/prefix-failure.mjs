import { assertEqual, heatmap, indicate, place, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { finiteUnit } from '../../../films/contrastive-learning/arithmetic.mjs';

export default function prefixFailure(s, c) {
  const [body, foot] = area.rows([5, 2], 'loose');
  const values = [
    [0.6, 0.8],
    [0.6, 0.8],
    [0.6, -0.8],
  ];
  const grid = place(
    heatmap(values, {
      size: 40,
      cellWidth: 300,
      cellHeight: 120,
      values: true,
      format: (v) => v.toFixed(2),
      rowLabels: ['query', 'match', 'distractor'],
      columnLabels: ['keep', 'discard'],
      domain: [-1, 1],
    }),
    body,
  );
  const scores = values.slice(1).map((v) => v.reduce((sum, x, i) => sum + x * values[0][i], 0));
  const full = place(
    mono(`full scores: ${scores.map((v) => v.toFixed(2)).join('   /   ')}`, { color: 'yellow' }),
    foot,
  );
  const tied = place(label('prefix scores: 1 / 1 · lost distinction', { color: 'red' }), foot);
  const invalid = place(label('zero prefix → reject before normalization', { color: 'red' }), foot);
  assertEqual(finiteUnit([values[0][0]])[0], 1, 'one-dimensional positive prefix');
  s.add(heading(c.title), grid);
  c.show('cl-prefix-failure-full', full, { after: true });
  c.on('cl-prefix-failure-cut', () =>
    s.play(
      grid.mark({ col: 1 }, 'masked'),
      grid.setValue({ col: 0 }, [[1], [1], [1]], { duration: 1.6 }),
    ),
  );
  c.swap('cl-prefix-failure-tie', full, tied, { after: true });
  c.swap('cl-prefix-failure-zero', tied, invalid);
}
