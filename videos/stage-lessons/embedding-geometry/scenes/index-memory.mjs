import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  table,
  place,
  beside,
  boxOf,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  circle,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
  polyline,
} from 'vizmatic/stage';
import {
  robustUnit,
  cosine,
  signCode,
  dot as inner,
  l2,
} from '../../../films/embedding-geometry/arithmetic.mjs';

export default function indexMemory(s, c) {
  const M = 32,
    bytes = 2 * M * 4;
  assertEqual(bytes, 256, 'base neighbor slots');
  const [left, right] = area.columns([1, 1], 'loose');
  const [layersArea, captionArea] = left.rows([5, 2], 'wide');
  const chart = place(
    barChart(
      [
        { label: 'layer 0', value: 1, color: 'blue' },
        { label: 'layer 1', value: 0, color: 'green' },
        { label: 'layer 2', value: 0, color: 'pink' },
      ],
      {
        width: layersArea.width - 340,
        height: layersArea.height - 100,
        horizontal: true,
        max: 1,
        labelSize: 36,
        format: (v) => (v === 0 ? '' : (v * 100).toFixed(3) + '%'),
      },
    ),
    layersArea,
  );
  const controls = place(
    column(
      [
        label('M: connectivity capacity'),
        label('ef construction: build work'),
        label('query ef: search effort'),
      ],
      { gap: 'wide' },
    ),
    captionArea,
  );
  const [ledgerArea, barArea] = right.rows([3, 4], 'wide');
  const ledger = place(
    table(
      ['row storage', { key: 'bytes', sample: 'additional' }],
      [
        { id: 'code', 'row storage': 'PQ code', bytes: 96 },
        { id: 'graph', 'row storage': 'base neighbor IDs', bytes: null },
        { id: 'more', 'row storage': 'other overhead', bytes: 'additional' },
      ],
      { size: 36, width: ledgerArea.width },
    ),
    ledgerArea,
  );
  const bars = place(
    barChart(
      [
        { label: 'PQ', value: 96, color: 'blue' },
        { label: 'base slots', value: bytes, color: 'blue' },
      ],
      {
        width: barArea.width - 100,
        height: barArea.height - 100,
        max: bytes,
        format: (v) => (v === 0 ? '' : v.toFixed(0)),
        labelSize: 36,
        showValues: true,
      },
    ),
    barArea,
  );
  const title = heading(c.title);
  s.add(title, chart, controls, ledger, bars);
  s.at(c.start, () => s.play(bars.update([96, 0], { duration: 0.001 })));
  c.after('layer1', () => s.play(chart.update([1, 1 / M, 0], { duration: 1.2 })));
  c.after('layer2', () => s.play(chart.update([1, 1 / M, 1 / M ** 2], { duration: 0.4 })));
  const measured = [
    { ef: 16, recall: 0.89, ms: 42 },
    { ef: 48, recall: 0.97, ms: 56 },
    { ef: 96, recall: 0.99, ms: 78 },
  ];
  const minRecall = 0.96,
    maxMs = 60;
  const feasible = measured.filter((row) => row.recall >= minRecall && row.ms <= maxMs);
  assertEqual(feasible.map((row) => row.ef).join(','), '48', 'serving gates');
  const [premise, runs, verdict] = area.rows([1.2, 4, 1.2], 'wide');
  const limits = place(
    label('Recall@10 ≥ ' + minRecall.toFixed(2) + '       p99 ≤ ' + maxMs + ' ms', { size: 46 }),
    premise,
  );
  const bench = place(
    table(
      ['Query ef', 'Recall@10', 'p99'],
      measured.map((row) => ({
        id: String(row.ef),
        'Query ef': row.ef,
        'Recall@10': row.recall.toFixed(2),
        p99: row.ms + ' ms',
      })),
      { size: 42, width: runs.width * 0.72 },
    ),
    runs,
  );
  const ask = place(
    note('Example measurements on one fixed graph. Which setting fits both gates?'),
    verdict,
  );
  const choice = place(
    label('Use ef ' + feasible[0].ef + ' on this workload', { color: 'yellow' }),
    verdict,
  );
  c.swapAll('query', [limits, bench, ask], { keep: [title] });
  c.swap('choose', ask, choice, { after: true });
  c.after('choose', () => s.play(bench.light(String(feasible[0].ef)), { duration: 0.6 }));
  c.swapAll('memory', [ledger, bars, controls, chart], { keep: [title] });
  c.after('slots', () =>
    s.play(
      ledger.setCell('graph', 'bytes', { value: bytes }),
      bars.update([96, bytes], { duration: 1.5 }),
    ),
  );
}
