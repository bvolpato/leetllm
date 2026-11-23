import { assertEqual, column, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { footer, guideArrows, guidePlot, guides, QUERY, scoreArea } from '../guide-plot.mjs';
import { dot } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function coordinates(s, c) {
  const plot = guidePlot();
  const [rule, ...rows] = scoreArea.rows([1, 2, 2], 'wide');
  const names = guides.map((g, i) =>
    place(
      column(
        [
          label(g.name + ' guide', { color: g.color }),
          mono('1 × ' + g.vector[0] + ' + 0 × ' + g.vector[1], { size: 40 }),
        ],
        { gap: 'normal' },
      ),
      rows[i],
      'top left',
    ),
  );
  const results = guides.map((g, i) =>
    place(
      mono('= ' + dot(QUERY, g.vector), {
        size: 52,
        color: g.color,
      }),
      rows[i],
      'bottom left',
    ),
  );
  const foot = place(note('q = [1, 0]     ·     raw dot product'), footer);
  const ask = place(label('Which dot product is larger?', { color: 'yellow' }), footer);
  const winner = place(label('Largest dot product    B   Audit', { color: 'pink' }), footer);
  assertEqual(guides.map((g) => dot(QUERY, g.vector)).join(','), '1,4', 'raw dot scores');
  s.add(
    heading(c.title),
    plot.grid,
    guideArrows(plot),
    place(label('Horizontal reach'), rule, 'left'),
    foot,
  );
  c.show('first', [plot.drop(() => guides[0].vector, guides[0].color), names[0]]);
  c.show('second', [plot.drop(() => guides[1].vector, guides[1].color), names[1]]);
  c.swap('ask', foot, ask);
  c.hide('result', ask);
  c.show('result', [...results, winner], { after: true });
}
