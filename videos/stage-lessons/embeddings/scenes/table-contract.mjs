import { assertEqual, column, dot, grid, indicate, place, to } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, vectorLane } from '../parts.mjs';
export default function tableContract(s, c) {
  const p = plane(s),
    stored = p.vector(() => V.bank, 'blue');
  const selector = place(
    column([label('one-hot × E'), mono('[1, 0, 0]'), note('E: vocabulary × features')], {
      gap: 'normal',
    }),
    TOP,
    'left',
  );
  const tableRows = [V.bank, V.river, V.money],
    oneHot = [1, 0, 0];
  const selected = V.bank.map((_, j) => tableRows.reduce((sum, v, i) => sum + oneHot[i] * v[j], 0));
  selected.forEach((v, i) => assertEqual(v, V.bank[i], 'one-hot selects bank'));
  const cells = ['bank', 'river', 'money'].flatMap((name, i) => [
    label(name, { color: i ? 'dim' : 'blue' }),
    ...tableRows[i].map((v) => mono(String(v), { color: i ? 'dim' : 'blue' })),
  ]);
  const table = place(grid(cells, { columns: 3, gap: ['normal', 'wide'] }), MID, 'left');
  const signal = dot(12, 'yellow').moveTo(MID.point('right'));
  const output = vectorLane(LOW, 'selected row', V.bank, 'yellow');
  const charge = vectorLane(LOW, 'charge: separate row', '[0.8, 0.2]', 'blue');
  const pieces = place(
    column(
      [
        label('subword IDs', { color: 'blue' }),
        mono('piece → row'),
        note('lookup stays sentence-independent'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  c.take([p.frame, stored]);
  s.add(heading(c.title), p.nodes, stored, selector, table);
  c.on('shape', () => s.play(indicate(selector, { scale: 1, color: 'yellow' })));
  c.on('select', () => s.play(indicate(cells.slice(0, 3), { scale: 1, color: 'yellow' })));
  c.show('select', signal);
  c.on('select', () => s.play(to(signal, (n) => n.moveTo(LOW.point('right')), { duration: 1.2 })));
  c.show('select', output, { after: true });
  c.swap('charge', output, charge);
  c.swap('pieces', charge, pieces);
  c.on('static', () => s.play(indicate(pieces, { scale: 1, color: 'yellow' })));
}
