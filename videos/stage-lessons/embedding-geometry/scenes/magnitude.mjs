import { assertEqual, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { cosine, dot as inner, l2 } from '../../../films/embedding-geometry/arithmetic.mjs';
import { footer, guideArrows, guidePlot, guides, QUERY } from '../guide-plot.mjs';

export default function magnitude(s, c) {
  const scale = s.value(1);
  const a = () => guides[0].vector.map((x) => x * scale.value);
  const b = guides[1].vector;
  const [body] = area.rows([7, 1], 'wide');
  const [diagram, readout] = body.rows([3.2, 1.35], 'normal');
  const plot = guidePlot(() => 10.6, diagram);
  const [cosRow, reach, distance] = readout.columns([1, 2.2, 1], 'loose');
  const live = (slot, value, color) =>
    dynamic(() => mono(value(), { color, size: 44 }).moveTo(slot.point('center')));
  const rail = reach.inset('normal');
  const pos = (value) => rail.left + (value / 10) * rail.width;
  const y = rail.cy + 21;
  const reference = inner(QUERY, b);
  const track = [
    place(label('Raw dot product'), reach, 'top'),
    line([pos(0), y], [pos(10), y], { stroke: 'dim', width: 4 }),
    ...[0, reference, 10].flatMap((v) => [
      line([pos(v), y - 12], [pos(v), y + 13], {
        stroke: v === reference ? 'pink' : 'dim',
        width: 4,
      }),
      mono(v === reference ? 'B = ' + v : String(v), {
        color: v === reference ? 'pink' : 'dim',
        size: 30,
      }).moveTo([pos(v), y + 45]),
    ]),
    dynamic(() =>
      group(
        dot(12, 'green').moveTo([pos(inner(QUERY, a())), y]),
        mono('A = ' + inner(QUERY, a()).toFixed(1), { color: 'green', size: 34 }).moveTo([
          pos(inner(QUERY, a())),
          y - 38,
        ]),
      ),
    ),
  ];
  const ask = place(label('At what scale does A tie B on raw dot?', { color: 'yellow' }), footer);
  const factor = dynamic(() =>
    mono('A scale   ×' + scale.value.toFixed(1), {
      size: 42,
      color: 'green',
    }).moveTo(footer.point('center')),
  );
  const gap = l2(
    QUERY,
    guides[0].vector.map((v) => 10 * v),
  );
  assertEqual(gap.toFixed(2), '9.22', 'tenfold A endpoint gap');
  s.add(
    heading(c.title),
    plot.grid,
    guideArrows(plot, { vectors: () => [a(), b] }),
    ...track,
    place(label('Cosine with A'), cosRow, 'top'),
    live(cosRow, () => cosine(QUERY, a()).toFixed(3), 'green'),
    factor,
  );
  c.swap('ask', factor, ask);
  c.hide('four', ask);
  c.show('four', factor, { after: true });
  c.after('four', () =>
    s.play(scale.to(reference / inner(QUERY, guides[0].vector), { duration: 1.1 })),
  );
  c.on('ten', () => s.play(scale.to(10, { duration: 2.2 })));
  c.show('gap', [
    plot.gap(a),
    place(label('Gap from q to A'), distance, 'top'),
    live(distance, () => l2(QUERY, a()).toFixed(2), 'yellow'),
  ]);
}
