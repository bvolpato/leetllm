import { area, heading, label, mono, note, chip, tint } from '../../kit-narrated.mjs';
import {
  table,
  place,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
} from 'vizmatic/stage';
import { robustUnit, cosine, scalarEncode } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function payload(s, c) {
  const rows = 1e6,
    dimensions = 1536,
    fp32 = dimensions * 4,
    int8 = dimensions,
    sign = Math.ceil(dimensions / 8),
    pq = 96;
  assertEqual(fp32 / pq, 64, 'PQ payload ratio');
  assertEqual((pq * 256 * (dimensions / pq) * 4) / 2 ** 20, 1.5, 'shared codebooks MiB');
  const [upper, lower] = area.rows([5, 3], 'wide');
  const chart = place(
    barChart(
      [
        { label: 'FP32', value: fp32, color: 'blue' },
        { label: 'INT8', value: 0, color: 'blue' },
        { label: 'sign', value: 0, color: 'blue' },
        { label: 'PQ', value: 0, color: 'blue' },
      ],
      {
        width: upper.width - 360,
        height: upper.height - 90,
        max: fp32,
        ticks: [0, 1536, 3072, 6144],
        horizontal: true,
        labelSize: 36,
        format: (v) => (v === 0 ? '' : v.toFixed(0) + ' B'),
      },
    ),
    upper,
  );
  const [shelfArea, ledgerArea] = lower.columns([1, 1], 'wide');
  const shelf = place(
    column(
      [
        label('retained originals', { color: 'blue' }),
        rect(shelfArea.width - 40, 60, { fill: 'blue', stroke: null }),
        mono(((fp32 * rows) / 2 ** 30).toFixed(2) + ' GiB', { size: 36 }),
      ],
      { gap: 'normal' },
    ),
    shelfArea,
  );
  const ledger = place(
    table(
      ['storage', 'payload'],
      [
        { id: 'book', storage: 'codebooks', payload: null },
        { id: 'other', storage: 'graph + metadata', payload: 'separate' },
      ],
      { size: 34, width: ledgerArea.width },
    ),
    ledgerArea,
  );
  const title = heading(c.title);
  s.add(title, chart, ledger);
  s.at(c.start, () => s.play(chart.update([0, 0, 0, 0], { duration: 0.001 })));
  c.after('fp32', () => s.play(chart.update([fp32, 0, 0, 0], { duration: 1.2 })));
  c.after('int8', () => s.play(chart.update([fp32, int8, 0, 0], { duration: 1.5 })));
  c.after('sign', () => s.play(chart.update([fp32, int8, sign, 0], { duration: 0.7 })));
  c.after('codes', () => s.play(chart.update([fp32, int8, sign, pq], { duration: 1.5 })));
  c.after('book', () =>
    s.play(ledger.setCell('book', 'payload', { value: '1.5 MiB' }), { duration: 0.5 }),
  );
  c.show('originals', shelf);
  const [premise, pair, caption] = area.rows([1, 4, 1], 'wide');
  const sizes = [768 * 4, 768, 96];
  const names = ['FP32', 'INT8', 'PQ'];
  const scaling = place(
    table(
      ['Code', 'Bytes per row', '50 million rows'],
      sizes.map((n, i) => ({
        id: names[i],
        Code: names[i],
        'Bytes per row': n,
        '50 million rows': ((50e6 * n) / 1e9).toFixed(1) + ' GB',
      })),
      { width: pair.width * 0.8, size: 42 },
    ),
    pair,
  );
  c.swapAll(
    'scale',
    [
      place(label('New store    ·    50 million rows at width 768'), premise),
      scaling,
      place(
        note('Decimal GB of row payload. Shared structures and originals are additional.'),
        caption,
      ),
    ],
    { keep: [title] },
  );
}
