import {
  arrow,
  assertEqual,
  column,
  dot,
  group,
  line,
  place,
  polyline,
  rect,
  table,
} from 'vizmatic/stage';
import { normalizeVector, dotProduct } from 'vizmatic';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';

export default function dense(s, c) {
  const f = frame(c);
  const [plot, detail] = f.body.columns([1, 1.05], 'wide');
  const q = [0.98, 0.05, 0];
  const unit = normalizeVector(q);
  const scores = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ].map((d) => dotProduct(unit, d));
  assertEqual(
    scores.map((x) => x.toFixed(4)).join(' '),
    '0.9987 0.0510 0.0000',
    'paraphrase cosines',
  );
  const length = Math.min(plot.width - 172, plot.height - 155);
  const ox = plot.point('center')[0] - length / 2;
  const oy = plot.point('center')[1] + length / 2;
  const at = (x, y) => [ox + length * x, oy - length * y];
  const tip = at(unit[0], unit[1]);
  const axes = group(
    line(at(0, 0), at(1.08, 0), { stroke: 'grid', width: 3 }),
    line(at(0, 0), at(0, 1.08), { stroke: 'grid', width: 3 }),
    polyline(
      Array.from({ length: 65 }, (_, i) =>
        at(Math.cos((i * Math.PI) / 128), Math.sin((i * Math.PI) / 128)),
      ),
      { stroke: 'dim', width: 2 },
    ),
    label('Session', { size: 38, color: 'blue' }).moveTo([ox + 125, oy - length - 47]),
    label('Key', { size: 38, color: 'green' }).moveTo([ox + length, oy + 45]),
    dot(9, 'green').moveTo(at(1, 0)),
    dot(9, 'blue').moveTo(at(0, 1)),
  );
  const query = arrow(at(0, 0), tip, { stroke: 'pink', width: 6, pad: 0 });
  const [header, readouts] = detail.rows([1, 2.3], 'normal');
  const description = place(
    column(
      [
        note('Supplied vector for Luna’s paraphrase'),
        mono('(0.98, 0.05, 0)', { color: 'pink', size: 49 }),
      ],
      { gap: 'normal' },
    ),
    header,
  );
  const normalized = place(
    column(
      [
        note('Divide by the length of the query'),
        mono('‖q‖ = ' + Math.hypot(...q).toFixed(4), { color: 'pink', size: 49 }),
      ],
      { gap: 'normal' },
    ),
    header,
  );
  const rows = readouts.rows(3, 'normal');
  const bars = scores.map((value, i) => {
    const [name, track, number] = rows[i].columns([1, 1.65, 1], 'normal');
    const width = track.width;
    const y = track.point('center')[1];
    return group(
      place(label(['Key', 'Session', 'Audit'][i], { size: 39 }), name, 'left'),
      rect(width, 23, { fill: 'grid', stroke: 'grid', width: 0 }).moveTo(track.point('center')),
      ...(value > 0
        ? [
            rect(width * value, 23, { fill: i ? 'blue' : 'green', width: 0 }).moveTo([
              track.left + (width * value) / 2,
              y,
            ]),
          ]
        : []),
      place(mono(value.toFixed(4), { size: 37 }), number),
    );
  });
  const horizontal = line(at(0, -0.02), at(unit[0], -0.02), { stroke: 'green', width: 8 });
  const vertical = group(
    line(tip, at(0, unit[1]), { stroke: 'dim', width: 2, dash: [7, 8] }),
    line(at(-0.024, 0), at(-0.024, unit[1]), { stroke: 'blue', width: 8 }),
  );
  const ask = place(label('Which rule points closer to the query?', { color: 'yellow' }), f.foot);
  const result = place(
    label('Returned in order     1   Key rule       2   Session rule', { color: 'yellow' }),
    f.foot,
  );
  const comparison = place(
    table(
      [
        { key: 'query', label: 'Luna’s search' },
        { key: 'lexical', label: 'Lexical returns' },
        { key: 'dense', label: 'Dense returns' },
      ],
      [
        { id: 'code', query: 'KROT-14', lexical: 'Key', dense: 'No vector supplied' },
        { id: 'words', query: 'Paraphrase', lexical: 'Empty', dense: 'Key, Session' },
      ],
      { width: f.body.width - 100, size: 46, leading: 2.6 },
    ),
    f.body,
  );
  s.add(f.title, axes, description);
  c.take(f.shelf.nodes);
  c.swap('normalize', description, normalized);
  c.show('query-direction', query);
  c.show('direction-question', ask);
  c.hide('key-answer', ask);
  c.show('key-answer', horizontal, { after: true });
  c.show('key-projection', bars[0], { after: true });
  c.show('session-projection', [bars[1], vertical], { after: true });
  c.show('audit-projection', bars[2], { after: true });
  c.show('two-returns', result, { after: true });
  c.swapAll('paired-requests', [heading('Two searches for one policy'), comparison], {
    keep: [f.shelf.nodes],
  });
  c.keep(f.shelf.nodes);
}
