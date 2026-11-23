import { column, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { fullPairs } from '../../../films/context-packing/arithmetic.mjs';

export default function costLength(s, c) {
  const [grid, detail] = area.columns([1.1, 1], 'loose');
  const [matrix, legend] = grid.rows([8, 1], 'tight');
  const size = s.value(1), phase = s.value(0), decode = s.value(0);
  const pitch = Math.min(matrix.width, matrix.height) / 21;
  const prefix = 20, first = 10;
  s.add(heading(c.title), dynamic(() => {
    const k = phase.value, n = Math.round(size.value);
    const activeRows = n + (decode.value > 0 ? 1 : 0);
    const nodes = [];
    for (let q = 0; q < activeRows; q++) {
      const keys = q === prefix ? Math.round(decode.value) : q + 1;
      for (let key = 0; key < keys; key++) {
        const color = q === prefix ? 'yellow' : k === 5 ? 'dim' : key === 1 ? 'yellow' : 'cyan';
        nodes.push(rect(pitch - 3, pitch - 3, { fill: color, stroke: null })
          .moveTo([matrix.left + (key + 0.5) * pitch, matrix.top + (q + 0.5) * pitch]));
      }
    }
    nodes.push(place(note('Each row is a query. Each column is a key.'), legend));
    const lines = [label(k >= 5 ? 'One decode step' : 'Causal prefill', { size: 55 }),
      mono((k >= 5 ? prefix : n) + (k >= 5 ? ' cached positions' : ' positions'), { size: 48, color: 'cyan' })];
    if (k === 1) lines.push(mono('1 + 2 + ... + 10 = ' + fullPairs(first), { size: 42 }));
    if (k === 2 || k === 3 || k === 4) lines.push(mono(`n × (n + 1) / 2`, { size: 44 }));
    if (k === 3 || k === 4) lines.push(mono(fullPairs(prefix) + ' allowed pairs', { size: 48, color: 'yellow' }));
    if (k === 4) lines.push(note('4K → 128K     32² = 1,024× leading term'));
    if (k === 5) lines.push(label(decode.value > 0 ? 'One new query' : 'Which rows do we need?', { size: 44 }),
      decode.value >= prefix + 1 ? mono(`20 cached + 1 new = ${prefix + 1} pairs`, { size: 39, color: 'yellow' }) : null);
    nodes.push(...place(column(lines, { gap: 'wide' }), detail, 'left').nodes);
    return nodes;
  }));
  c.on('prefill', () => s.play(size.to(first, { duration: 2 })));
  c.after('pair-count', () => phase.set(1));
  c.on('double-length', () => { phase.set(2); s.play(size.to(prefix, { duration: 1.8 })); });
  c.after('double-total', () => phase.set(3));
  c.on('real-scale', () => phase.set(4));
  c.on('cached-prefix', () => phase.set(5));
  c.after('decode-row', () => s.play(decode.to(prefix + 1, { duration: 1.2 })));
}
