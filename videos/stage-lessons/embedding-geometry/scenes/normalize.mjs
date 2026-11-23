import { assertEqual, column, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { footer, guideArrows, guidePlot, guides, scoreArea } from '../guide-plot.mjs';
import { SCALED_A, UNIT_METRICS } from '../../../films/embedding-geometry/fixtures.mjs';
import { normalized } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function normalize(s, c) {
  const progress = s.value(0),
    extent = s.value(10.6);
  const raw = [SCALED_A, guides[1].vector];
  const unit = raw.map(normalized);
  const vectors = () => raw.map((v, i) => v.map((x, j) => x + progress.value * (unit[i][j] - x)));
  const plot = guidePlot(() => extent.value);
  const [premise, ...rows] = scoreArea.rows([1, 2, 2], 'normal');
  const unitNote = place(label('Query length = 1', { color: 'cyan' }), premise, 'left');
  const divisions = raw.map((v, i) =>
    place(
      column(
        [
          label(guides[i].name, { color: guides[i].color }),
          mono('[' + v.join(', ') + '] / √' + v.reduce((s, x) => s + x * x, 0), { size: 42 }),
        ],
        { gap: 'normal' },
      ),
      rows[i],
      'left',
    ),
  );
  const scores = UNIT_METRICS.map((m, i) => {
    assertEqual((2 - 2 * m.score).toFixed(3), m.squaredDistance.toFixed(3), 'unit chord squared');
    return place(
      column(
        [
          label(guides[i].name, { color: guides[i].color }),
          mono('dot = cos ≈ ' + m.score.toFixed(3), { size: 38 }),
          mono('gap² ≈ ' + m.squaredDistance.toFixed(3), { size: 38 }),
        ],
        { gap: 'tight' },
      ),
      rows[i],
      'left',
    );
  });
  const formula = place(mono('gap² = 1 + 1 − 2 × dot', { size: 44 }), footer);
  const assumption = place(note('Each arrow keeps its direction'), footer);
  s.add(
    heading(c.title),
    plot.grid,
    plot.unitArc,
    guideArrows(plot, { vectors, unitCircle: true }),
    unitNote,
    divisions,
    assumption,
  );
  c.on('divide', () => s.play(progress.to(1, { duration: 2.2 })));
  c.on('closer', () => s.play(extent.to(1.3, { duration: 1.4 })));
  c.show(
    'chords',
    guides.map((_, i) => plot.gap(() => vectors()[i])),
  );
  c.swap('identity', assumption, formula);
  c.swap('a', divisions[0], scores[0], { after: true });
  c.swap('b', divisions[1], scores[1], { after: true });
}
