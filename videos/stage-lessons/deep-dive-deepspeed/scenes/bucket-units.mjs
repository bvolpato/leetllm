import { assertEqual, barChart, boxOf, column, grid, indicate, place, row } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function buckets(s, c) {
  const b = open(s, c, 'bucket-units'),
    [left, right] = WORK.columns(2, 'loose');
  const elements = 200e6,
    bytes = [2, 4],
    mb = bytes.map((n) => (elements * n) / 1e6),
    workers = 12,
    tp = 3,
    dp = workers / tp;
  assertEqual(mb[0], 400, 'two-byte bucket MB');
  assertEqual(mb[1], 800, 'four-byte bucket MB');
  assertEqual(dp, 4, 'data ranks in twelve workers');
  const [plot, foot] = left.rows([5, 1], 'normal');
  const measure = place(
    barChart(
      bytes.map((n, i) => ({ label: `${n} bytes / element`, value: mb[i], color: 'cyan' })),
      {
        width: plot.width - 130,
        height: plot.height - 130,
        max: 800,
        labelSize: 34,
        showValues: true,
      },
    ),
    plot,
  );
  const chart = barChart(
    bytes.map((n) => ({ label: String(n) + ' bytes / element', value: 0, color: 'cyan' })),
    {
      width: plot.width - 130,
      height: plot.height - 130,
      max: 800,
      labelSize: 34,
      showValues: true,
    },
  );
  const dest = boxOf(measure.baseline).point('center'),
    from = boxOf(chart.baseline).point('center'),
    center = boxOf(chart).point('center');
  chart.moveTo([center[0] + dest[0] - from[0], center[1] + dest[1] - from[1]]);
  const units = place(note('200M elements → decimal MB'), foot);
  const [devices, batchArea] = right.rows([5, 1], 'normal');
  const rows = Array.from({ length: dp }, (_, r) =>
    row(
      [
        label(`R${r}`, { color: 'green', size: 34 }),
        ...Array.from({ length: tp }, (_, i) =>
          namedBox(`TP ${i}`, { width: 160, height: 58, color: 'blue' }),
        ),
      ],
      { gap: 'normal' },
    ),
  );
  place(column(rows, { gap: 'normal' }), devices);
  const result = place(
    mono('global batch = microbatch × accumulation × 4', { size: 30 }),
    batchArea,
  );
  s.add(chart, units, rows);
  c.after('dtype', () => s.play(chart.update(mb, { duration: 1.2 })));
  c.show('batch', result, { after: true });
  c.on('resolve', () => s.play(indicate(chart, { scale: 1 })));
  finish(c, b, 'bucket-units');
}
