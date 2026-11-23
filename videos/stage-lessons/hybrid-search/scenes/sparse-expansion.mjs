import {
  assertEqual,
  barChart,
  boxOf,
  column,
  fade,
  par,
  place,
  seq,
  tokens,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
export default function sparse(s, c) {
  const f = frame(c);
  const [top, plots] = f.body.rows([1.2, 4], 'loose');
  const [inputRegion, coordinateRegion] = top.columns(2, 'loose');
  const [left, right] = plots.columns(2, 'loose');
  const input = place(
    column([tokens(['refresh', 'key'], { size: 40 }), note('input · position 1 and position 2')], {
      gap: 'tight',
    }),
    inputRegion,
  );
  const coordinate = place(
    column(
      [label('credential', { color: 'cyan' }), note('vocabulary coordinate · absent from input')],
      { gap: 'tight' },
    ),
    coordinateRegion,
  );
  const raw = [-2, 3],
    v = Math.log1p(raw[1]);
  assertEqual(v.toFixed(3), '1.386', 'log activation');
  assertEqual(Math.max(0, raw[0]), 0, 'negative logit clipped');
  const positions = barChart(
    [
      { label: 'refresh', value: raw[0], color: 'cyan' },
      { label: 'key', value: raw[1], color: 'cyan' },
    ],
    {
      width: left.width,
      height: left.height * 0.72,
      min: -2.5,
      max: 3.5,
      labelSize: 34,
      showValues: true,
      format: (x) => x.toFixed(3),
    },
  );
  const pooled = barChart(
    [
      { label: 'sum · SPLADE', value: 0, color: 'cyan' },
      { label: 'max · v2', value: 0, color: 'cyan' },
    ],
    {
      width: right.width,
      height: right.height * 0.72,
      max: 3.5,
      min: -2.5,
      labelSize: 34,
      showValues: true,
      reference: [0, 0],
      referenceColor: 'cyan',
      format: (x) => x.toFixed(3),
    },
  );
  const chartHeight = left.height * 0.72;
  for (const chart of [positions, pooled])
    for (const words of chart.labels) words.moveTo([words.get('x'), chartHeight / 2 + 65]);
  place(positions, left, 'bottom');
  place(pooled, right, 'bottom');
  pooled.at(
    pooled.get('x'),
    pooled.get('y') +
      boxOf(positions.baseline).point('center')[1] -
      boxOf(pooled.baseline).point('center')[1],
  );
  pooled.readouts.forEach((n) => n.opacity(0));
  const rawText = place(mono('supplied logits [−2, 3]'), f.foot);
  const relu = place(mono('ReLU: max(0, z) → [0, 3]'), f.foot);
  const log = place(mono('log(1 + ReLU(z))'), f.foot);
  const second = place(mono('supplied logits [3, 3]'), f.foot);
  const warning = place(
    label('Weighted postings need a compatible scorer', { color: 'red' }),
    f.foot,
  );
  s.add(f.title, input, coordinate, positions, pooled, rawText);
  c.take(f.shelf.nodes);
  c.after('sparse-rule', () =>
    s.play(
      seq(
        par(...positions.readouts.map((n) => fade(n, 0, { duration: 0.1 }))),
        positions.update([0, raw[1]], { duration: 1.1 }),
        par(...positions.readouts.map((n) => fade(n, 1, { duration: 0.1 }))),
      ),
    ),
  );
  c.swap('sparse-rule', rawText, relu, { after: true });
  c.after('sparse-log', () => s.play(positions.update([0, v], { duration: 1.1 })));
  c.swap('sparse-log', relu, log, { after: true });
  c.after('sparse-pool', () =>
    s.play(
      pooled.update([v, v]),
      pooled.reference([0, v]),
      ...pooled.readouts.map((n) => fade(n, 1)),
    ),
  );
  c.swap('sparse-second', log, second);
  c.after('sparse-second', () => s.play(positions.update([v, v])));
  c.after('sparse-answer', () => s.play(pooled.update([2 * v, v])));
  c.swap('weighted-index', second, warning);
  c.keep(f.shelf.nodes);
}
