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

export default function signAngle(s, c) {
  const vectors = [
      [1, 0.01, -1, -0.01],
      [0.01, 1, -0.01, -1],
    ],
    score = cosine(...vectors);
  assertEqual(signCode(vectors[0]), signCode(vectors[1]), 'sign collision');
  const mix = s.value(0);
  const [upper, lower] = area.rows([4.8, 3.2], 'wide');
  const [left, right] = upper.columns(2, 'loose');
  const chart = place(
    barChart(
      vectors[0].map((v, i) => ({
        label: 'd' + i + (i < 2 ? ' +' : ' -'),
        value: Math.abs(v),
        color: 'green',
      })),
      { width: left.width - 100, height: left.height - 115, min: 0, max: 1, labelSize: 36 },
    ),
    left,
  );
  const other = place(
    barChart(
      vectors[0].map((v, i) => ({
        label: 'd' + i + (i < 2 ? ' +' : ' -'),
        value: Math.abs(v),
        color: 'pink',
      })),
      { width: right.width - 100, height: right.height - 115, min: 0, max: 1, labelSize: 36 },
    ),
    right,
  );
  const [signs, results] = lower.columns(2, 'loose');
  const bits = place(
    column(
      [
        label('fixed-axis sign codes'),
        arrayCells(
          vectors[0].map((v) => (v > 0 ? 1 : 0)),
          { cell: 100, size: 40, indices: false },
        ),
      ],
      { gap: 'wide' },
    ),
    signs,
  );
  const tab = place(
    table(
      ['comparison', { key: 'result', sample: '385 distances' }],
      [
        { id: 'hamming', comparison: 'Hamming', result: null },
        { id: 'cos', comparison: 'cosine', result: null },
        { id: 'angle', comparison: 'angle / pi', result: null },
        { id: 'ties', comparison: '384 bits', result: null },
      ],
      { size: 34, width: results.width },
    ),
    results,
  );
  const signValues = bits.nodes.at(-1).items;
  for (const item of signValues) item.opacity(0);
  s.add(heading(c.title), chart, other, bits, tab);
  c.on('shift', () => s.play(other.update(vectors[1].map(Math.abs), { duration: 3 })));
  c.after('same', () =>
    s.play(
      tab.setCell('hamming', 'result', { value: 0 }),
      ...signValues.map((n) => fade(n, 1, { duration: 0.5 })),
      { duration: 0.5 },
    ),
  );
  c.after('cos', () =>
    s.play(tab.setCell('cos', 'result', { value: score.toFixed(2) }), { duration: 0.5 }),
  );
  c.after('angle', () =>
    s.play(tab.setCell('angle', 'result', { value: (Math.acos(score) / Math.PI).toFixed(3) }), {
      duration: 0.5,
    }),
  );
  c.on('random', () => s.play(indicate(bits, { scale: 1 })));
  c.after('ties', () =>
    s.play(tab.setCell('ties', 'result', { value: '385 distances' }), { duration: 0.5 }),
  );
}
