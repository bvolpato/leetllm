import { column, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { footer, guideArrows, guidePlot, guides, scoreArea } from '../guide-plot.mjs';
import { METRICS } from '../../../films/embedding-geometry/fixtures.mjs';

export default function rulers(s, c) {
  const plot = guidePlot();
  const regions = scoreArea.rows(3, 'wide');
  const rule = place(label('Compare directions'), regions[0], 'left');
  const rule2 = place(label('Measure from q’s tip'), regions[0], 'left');
  const angle = guides.map((g, i) => plot.angle(() => g.vector, 110 + i * 40, g.color));
  const cards = METRICS.map((m, i) =>
    place(
      column(
        [
          label(guides[i].name, { color: guides[i].color }),
          mono(
            m.dot + ' / (1 × ' + Math.hypot(...m.vector).toFixed(3) + ') ≈ ' + m.cosine.toFixed(3),
            { size: 37 },
          ),
        ],
        { gap: 'tight' },
      ),
      regions[i + 1],
      'left',
    ),
  );
  const gaps = METRICS.map((m, i) => [
    plot.gap(() => m.vector),
    place(
      column(
        [
          label(guides[i].name, { color: guides[i].color }),
          mono('L2 = ' + m.distance.toFixed(2), { size: 42 }),
        ],
        { gap: 'normal' },
      ),
      regions[i + 1],
      'left',
    ),
  ]);
  const cosine = place(note('cosine = dot / (query length × passage length)'), footer);
  const distance = place(note('Euclidean distance in the original coordinates'), footer);
  s.add(heading(c.title), plot.grid, guideArrows(plot), rule, cosine);
  c.show('angle', angle);
  c.show('a', cards[0], { after: true });
  c.show('b', cards[1], { after: true });
  c.swap('gap', [rule, cosine, ...cards, ...angle], [rule2, distance]);
  c.show('short', gaps[0], { after: true });
  c.show('long', gaps[1], { after: true });
}
