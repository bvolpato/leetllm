import { assertEqual, column, dot, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { dot as inner, scalarEncode } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function scalarScales(s, c) {
  const q = [1, 1],
    bounds = [10, 1],
    originals = [
      [8, 0],
      [0, 1],
    ];
  const [premise, inputs, readout, foot] = area.rows([1, 4, 1.7, 1], 'normal');
  const rows = inputs.rows(2, 'wide'),
    ids = ['A', 'B'],
    colors = ['green', 'pink'];
  const scales = bounds.map((b) => b / 127);
  const codes = originals.map((r) => r.map((v, j) => scalarEncode(v, bounds[j])));
  const raw = codes.map((r) => inner(q, r));
  const fixed = codes.map((r) =>
    inner(
      q,
      r.map((n, j) => n * scales[j]),
    ),
  );
  assertEqual(raw.join(','), '102,127', 'code-only score');
  assertEqual(fixed.map((n) => n.toFixed(3)).join(','), '8.031,1.000', 'scale-aware score');
  const origin = place(label('q = [1, 1]       A = [8, 0]       B = [0, 1]'), premise);
  const rulers = rows.flatMap((r, i) => {
    const [legend, graph] = r.columns([1, 3.3], 'loose');
    const board = graph.inset('wide', 'none');
    const y = board.cy;
    const pos = (n) => board.left + (board.width * n) / 127;
    return [
      place(
        column(
          [
            label('Coordinate ' + (i + 1), { size: 38 }),
            mono('step ' + bounds[i] + '/127', { size: 32 }),
          ],
          { gap: 'tight' },
        ),
        legend,
        'left',
      ),
      line([pos(0), y], [pos(127), y], { stroke: 'dim', width: 5 }),
      ...[0, 32, 64, 96, 127].map((n) =>
        line([pos(n), y - 10], [pos(n), y + 10], { stroke: 'dim', width: 3 }),
      ),
      mono('0', { size: 34 }).moveTo([pos(0), y + 35]),
      mono(String(bounds[i]), { size: 34 }).moveTo([pos(127), y + 35]),
    ];
  });
  const data = rows.flatMap((r, i) => {
    const graph = r.columns([1, 3.3], 'loose')[1].inset('wide', 'none');
    const code = codes[i][i],
      x = graph.left + (graph.width * code) / 127;
    return [
      dot(12, colors[i]).moveTo([x, graph.cy]),
      mono(ids[i] + '   code ' + code, { color: colors[i], size: 38 }).moveTo([
        x - (i ? 80 : 0),
        graph.cy - 44,
      ]),
    ];
  });
  const slots = readout.columns(2, 'loose');
  const wrong = ids.map((name, i) =>
    place(
      mono(name + '   ' + raw[i] + ' counts', {
        size: 45,
        color: colors[i],
      }),
      slots[i],
    ),
  );
  const corrected = ids.map((name, i) =>
    place(
      mono(name + '   ' + raw[i] + ' × ' + bounds[i] + '/127 ≈ ' + fixed[i].toFixed(3), {
        size: 42,
        color: colors[i],
      }),
      slots[i],
    ),
  );
  const ask = place(
    label('Which row has the larger reconstructed dot product?', { color: 'yellow' }),
    foot,
  );
  const trueScores = originals.map((v) => inner(q, v));
  const baseline = place(
    note('Full precision     A = ' + trueScores[0] + '     B = ' + trueScores[1]),
    foot,
  );
  s.add(heading(c.title), origin, rulers);
  c.show('codes', data, { after: true });
  c.show('wrong', wrong, { after: true });
  c.show('ask', ask);
  c.swap('restore', [...wrong, ask], [...corrected, baseline], { after: true });
}
