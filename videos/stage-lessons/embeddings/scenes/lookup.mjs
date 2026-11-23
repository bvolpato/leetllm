import { grid, indicate, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, vec } from '../parts.mjs';

export default function lookup(s, c) {
  const p = plane(s);
  const stored = p.vector(() => V.bank, 'blue');
  const cells = ['bank', 'river', 'money'].flatMap((word, id) => {
    const color = id === 0 ? 'blue' : 'dim';
    return [mono(String(id), { color }), label(word, { color }), mono(vec(V[word]), { color })];
  });
  const table = place(grid(cells, { columns: 3, gap: ['normal', 'wide'] }), TOP, 'left');
  const receipts = [MID, LOW].map((region, i) => {
    const [message, output] = region.columns([1.15, 1], 'normal');
    const color = i === 0 ? 'cyan' : 'green';
    const name = place(label(i === 0 ? 'river bank' : 'bank deposit', { color }), message, 'left');
    return {
      name,
      copy: place(mono(vec(V.bank), { color }), output),
    };
  });
  s.add(
    heading(c.title),
    p.nodes,
    stored,
    table,
    receipts.map((r) => r.name),
  );
  c.on('select', () => s.play(indicate(cells.slice(0, 3), { scale: 1, color: 'yellow' })));
  c.show(
    'identical',
    receipts.map((r) => r.copy),
  );
  c.on('identical', () => s.play(indicate(cells[2], { scale: 1, color: 'yellow' })));
  c.on('halfway', () => s.play(indicate(stored, { scale: 1, color: 'yellow' })));
  c.on('again', () => s.play(indicate(cells[2], { scale: 1, color: 'yellow' })));
  c.on('learned', () => s.play(indicate(table, { scale: 1, color: 'yellow' })));
  c.keep([p.frame, stored]);
}
