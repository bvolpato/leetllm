import {
  assertEqual,
  column,
  dynamic,
  group,
  line,
  place,
  projectionMark,
  projectToLine,
  row,
} from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { footer, guideArrows, guidePlot, guides, scoreArea } from '../guide-plot.mjs';
import { cosine, dot, l2, normalized } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function synthesis(s, c) {
  const angle = s.value(0),
    mix = s.value(0),
    extent = s.value(5.7);
  const query = () => [Math.cos(angle.value), Math.sin(angle.value)];
  const vectors = () =>
    guides.map(({ vector }) => vector.map((x, i) => x + mix.value * (normalized(vector)[i] - x)));
  const plot = guidePlot(() => extent.value);
  const q = [0, 1];
  const metrics = [dot, cosine, l2].map((fn) => guides.map(({ vector }) => fn(q, vector)));
  const winners = metrics.map((v, i) =>
    i === 2 ? v.indexOf(Math.min(...v)) : v.indexOf(Math.max(...v)),
  );
  assertEqual(winners.join(','), '1,1,0', 'upward query winners before normalization');
  const [tip, ...lanes] = scoreArea.rows([1, 1.7, 1.7, 1.7], 'normal');
  const oldQuery = place(mono('q = [1, 0]', { color: 'cyan' }), tip, 'left');
  const newQuery = place(mono('q = [0, 1]', { color: 'cyan' }), tip, 'left');
  const origin = [0, 0];
  const reaches = () =>
    guides.map(({ vector }) => projectToLine(vector, origin, query()).signedDistance);
  const ruler = dynamic(() => {
    const [x, y] = query();
    const length = Math.max(...reaches()) + 0.2;
    const onRuler = (distance, offset = 0) =>
      plot.point([distance * x - offset * y, distance * y + offset * x]);
    const ticks = [];
    for (let unit = 0.5; unit < length; unit += 0.5) {
      const halfTick = Number.isInteger(unit) ? 0.085 : 0.045;
      ticks.push(
        line(onRuler(unit, -halfTick), onRuler(unit, halfTick), { stroke: 'cyan', width: 2 }),
      );
    }
    return group(
      line(onRuler(0), onRuler(length), { stroke: 'cyan', width: 3 }),
      ...ticks,
      ...guides.map(({ vector, color }) =>
        projectionMark(plot.point(vector), plot.point(origin), plot.point(query()), {
          color,
          width: 3,
          radius: 9,
        }),
      ),
    );
  });
  const readings = dynamic(() => {
    const values = reaches();
    return place(
      column(
        [
          label('Reach along q', { size: 36 }),
          row(
            guides.map(({ id, color }, i) =>
              mono(id + '  ' + values[i].toFixed(2), { color, size: 40 }),
            ),
            { gap: 'wide' },
          ),
        ],
        { gap: 'tight' },
      ),
      lanes[0],
      'left',
    ).nodes;
  });
  const rows = metrics.map((values, i) =>
    place(
      column(
        [
          label(['Dot product', 'Cosine', 'Endpoint gap'][i], { size: 36 }),
          mono('A ' + values[0].toFixed(3) + '     B ' + values[1].toFixed(3), { size: 40 }),
        ],
        { gap: 'tight' },
      ),
      lanes[i],
      'left',
    ),
  );
  const [coordinates, question] = footer.columns([1, 1.4], 'normal');
  const premises = place(label('A [1, 0.2]      B [4, 2]', { size: 40 }), coordinates);
  const ask = place(label('Which tip is nearest to q?', { color: 'yellow' }), question);
  const raw = place(label('Smallest original gap    A   Rotation', { color: 'green' }), footer);
  const result = place(
    label('On the unit circle    B   Audit ranks first', { color: 'pink' }),
    footer,
  );
  const unitRows = guides.map(({ id, color, vector }, i) => {
    const v = normalized(vector),
      cos = cosine(q, v),
      squared = l2(q, v) ** 2;
    assertEqual(squared.toFixed(3), (2 - 2 * cos).toFixed(3), 'upward unit identity');
    return place(
      column(
        [
          label(id + '   Unit arrow', { color, size: 36 }),
          mono('dot = cos ≈ ' + cos.toFixed(3), { size: 38 }),
          mono('gap² ≈ ' + squared.toFixed(3), { size: 38 }),
        ],
        { gap: 'tight' },
      ),
      lanes[i],
      'left',
    );
  });
  const gaps = guides.map((_, i) => plot.gap(() => vectors()[i], query));
  const title = heading(c.title);
  s.add(
    title,
    plot.grid,
    ruler,
    guideArrows(plot, { query, vectors, queryOffset: [-34, -53], unitCircle: true }),
    oldQuery,
    premises,
    readings,
  );
  c.on('turn', () => s.play(angle.to(Math.PI / 2, { duration: 1.3 })));
  c.hide('turn', oldQuery);
  c.show('up', newQuery, { after: true });
  c.swap('dot', readings, rows[0], { after: true });
  c.show('cos', rows[1], { after: true });
  c.show('ask', ask);
  c.swap('gap', [premises, ask], raw, { after: true });
  c.show('gap', [rows[2], ...gaps], { after: true });
  c.hide('unit', [raw, ruler, ...rows]);
  c.show('unit', plot.unitArc);
  c.on('unit', () => s.play(mix.to(1, { duration: 1.7 }), extent.to(1.3, { duration: 1.7 })));
  c.show('order', [...unitRows, result], { after: true });
}
