import { assertEqual, column, dot, dynamic, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { QUANTIZATION_FIXTURE as F } from '../../../films/embedding-geometry/fixtures.mjs';
import { cosine, quantize } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function quantization(s, c) {
  const [body, foot] = area.rows([7, 1], 'normal');
  const [left, right] = body.columns([6, 4], 'loose');
  const [title, graph] = left.rows([1, 7], 'normal');
  const [query, ...rows] = right.rows([1, 2, 2], 'wide');
  const side = Math.min(graph.height - 110, graph.width - 150);
  const x = (v) => graph.cx + ((v - 1) / 0.4) * side;
  const y = (v) => graph.cy - ((v - 0.2) / 0.4) * side;
  const xy = (v) => [x(v[0]), y(v[1])];
  const grid = [0, 1, 2].flatMap((i) => {
    const u = 0.8 + i * F.step,
      v = i * F.step;
    return [
      line([x(u), y(0)], [x(u), y(0.4)], { stroke: 'dim', width: 2 }),
      line([x(0.8), y(v)], [x(1.2), y(v)], { stroke: 'dim', width: 2 }),
      mono(u.toFixed(1), { size: 32, color: 'dim' }).moveTo([x(u), y(0) + 45]),
      mono(v.toFixed(1), { size: 32, color: 'dim' }).moveTo([x(0.8) - 52, y(v)]),
    ];
  });
  const codes = F.candidates.map((v) => quantize(v, F.step));
  assertEqual(codes[0].join(','), codes[1].join(','), 'both originals round to one point');
  const paint = ['green', 'pink'];
  const names = ['C', 'D'];
  const t = s.value(0);
  const points = dynamic(() =>
    group(
      ...F.candidates.flatMap((v, i) => {
        const current = v.map((coord, j) => coord + t.value * (codes[i][j] - coord));
        const [cx, cy] = xy(current);
        const labelAt = i ? [cx - 40, cy - 34 * t.value] : [cx - 42, cy + 22];
        return [
          dot(i ? 11 : 20, paint[i]).moveTo([cx, cy]),
          label(names[i], { color: paint[i], size: 38 }).moveTo(labelAt),
        ];
      }),
    ),
  );
  const paths = F.candidates.flatMap((v, i) => [
    dot(7, paint[i]).moveTo(xy(v)),
    line(xy(v), xy(codes[i]), { stroke: paint[i], width: 3, dash: [7, 6] }),
  ]);
  const cell = rect(side / 2, side / 2, {
    fill: null,
    stroke: 'yellow',
    width: 4,
    dash: [12, 8],
  }).moveTo(xy(codes[0]));
  const namesAndInputs = F.candidates.map((v, i) =>
    place(
      column(
        [
          label(names[i] + '   Original', { color: paint[i], size: 40 }),
          mono('[' + v.join(', ') + ']', { size: 40 }),
          mono('cos ≈ ' + cosine(F.query, v).toFixed(4), { size: 36 }),
        ],
        { gap: 'tight' },
      ),
      rows[i],
      'left',
    ),
  );
  const ask = place(label('Where will C and D land?', { color: 'yellow' }), foot);
  const joint = place(
    mono(
      'Both store [' + codes[0].join(', ') + ']     cos ≈ ' + cosine(F.query, codes[0]).toFixed(4),
      { color: 'yellow', size: 42 },
    ),
    foot,
  );
  s.add(
    heading(c.title),
    grid,
    points,
    place(note('Magnified endpoints     ·     grid spacing 0.2'), title),
    place(label('q = [1, 0]', { color: 'cyan' }), query, 'left'),
    namesAndInputs,
  );
  c.show('cell', cell);
  c.show('ask', ask);
  c.hide('round', ask);
  c.show('round', paths);
  c.on('round', () => s.play(t.to(1, { duration: 1.3 })));
  c.show('tie', joint, { after: true });
}
