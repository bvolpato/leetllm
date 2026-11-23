import { area, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import {
  table,
  boxOf,
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
  polyline,
} from 'vizmatic/stage';
import {
  robustUnit,
  cosine,
  scalarEncode,
  dot as inner,
  l2,
} from '../../../films/embedding-geometry/arithmetic.mjs';

export default function wideArithmetic(s, c) {
  const q = [127, 127],
    rows = [
      [127, 127],
      [126, 126],
    ],
    exact = rows.map((v) => inner(q, v)),
    wrap = (v) => ((v + 128) % 256) - 128;
  assertEqual(exact.join(','), '32258,32004', 'wide dot scores');
  const bound = 1536 * 127 ** 2;
  assertEqual(bound, 24774144, 'INT32 bound');
  const [input, lanes, foot] = area.rows([2, 5, 1], 'wide');
  const inputs = place(
    row(
      [
        label('q = 127, 127', { color: 'cyan' }),
        label('A = 127, 127', { color: 'green' }),
        label('B = 126, 126', { color: 'pink' }),
      ],
      { gap: 'loose' },
    ),
    input,
  );
  const [scoreRegion, byteRegion] = lanes.rows([3, 2], 'normal');
  const byteSlots = byteRegion.columns(2, 'loose');
  const byteStrips = byteSlots.map((r, i) =>
    place(
      row(
        [
          label(['A', 'B'][i], { color: ['green', 'pink'][i] }),
          arrayCells(['high byte', 'low byte'], {
            cell: 170,
            size: 34,
            font: 'text-serif',
            indices: false,
            color: 'blue',
          }),
        ],
        { gap: 'wide' },
      ),
      r,
    ),
  );
  const high = byteStrips.map((b) => b.nodes.at(-1).cell(0));
  const hex = exact.map((v, i) => {
    const cells = byteStrips[i].nodes.at(-1);
    return [v >> 8, v & 255].map((byte, j) =>
      mono('0x' + byte.toString(16).toUpperCase().padStart(2, '0'), {
        size: 36,
        color: ['green', 'pink'][i],
      }).moveTo(boxOf(cells.cell(j)).point('center')),
    );
  });
  const lost = high.map((n) => dot(12, 'red').moveTo(boxOf(n).point('center')));
  const tab = place(
    table(
      [
        { key: 'row', label: 'row' },
        { key: 'correct', label: 'wide product', sample: 32258 },
        { key: 'narrow', label: 'INT8 wraps', sample: 4, marks: true },
        { key: 'late', label: 'cast afterward', sample: 4 },
        { key: 'repair', label: 'widen first', sample: 32258 },
      ],
      rows.map((v, i) => ({
        id: ['A', 'B'][i],
        row: ['A', 'B'][i],
        correct: null,
        narrow: null,
        late: null,
        repair: null,
      })),
      { size: 38, width: lanes.width },
    ),
    scoreRegion,
  );
  const limit = place(
    mono('1536 × 127² = ' + bound + ' < INT32 max', { size: 38, color: 'yellow' }),
    foot,
  );
  s.add(heading(c.title), inputs, tab, byteStrips);
  c.hide(
    'correct',
    byteStrips.flatMap((b) => b.nodes.at(-1).items),
    { after: true },
  );
  c.show('correct', hex, { after: true });
  c.hide(
    'wrap',
    hex.map((r) => r[0]),
  );
  c.after('correct', () =>
    s.play(...exact.map((v, i) => tab.setCell(['A', 'B'][i], 'correct', { value: v })), {
      duration: 0.5,
    }),
  );
  c.show('wrap', lost);
  c.on('wrap', () =>
    s.play(
      ...high.map((n) => fade(n, 0.1, { duration: 0.4 })),
      ...lost.map((n, i) =>
        to(n, (x) => x.moveTo(byteSlots[i].point('bottom')), { duration: 1.2 }),
      ),
    ),
  );
  c.hide('late', lost);
  c.after('wrap', () =>
    s.play(
      ...exact.map((v, i) =>
        tab.setCell(['A', 'B'][i], 'narrow', { value: wrap(v), state: 'fail' }),
      ),
      { duration: 0.5 },
    ),
  );
  c.after('late', () =>
    s.play(...exact.map((v, i) => tab.setCell(['A', 'B'][i], 'late', { value: wrap(v) })), {
      duration: 0.5,
    }),
  );
  c.on('widen', () => s.play(...high.map((n) => fade(n, 1, { duration: 0.6 }))));
  c.on('widen', () =>
    s.play(
      ...exact.map((v, i) => tab.setCell(['A', 'B'][i], 'repair', { value: v })),
      tab.light(null, 'repair'),
      { duration: 0.8 },
    ),
  );
  c.show('bound', limit, { after: true });
}
