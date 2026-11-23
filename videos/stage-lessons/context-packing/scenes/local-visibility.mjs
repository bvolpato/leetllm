import { column, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { localPairs } from '../../../films/context-packing/arithmetic.mjs';

export default function localVisibility(s, c) {
  const [diagram, detail] = area.columns([1, 1], 'wide');
  const [matrix, legend] = diagram.rows([7, 1], 'normal');
  const pitch = Math.min(matrix.width, matrix.height) / 10.8;
  const phase = s.value(0), hops = s.value(0);
  const path = [[3, 1], [6, 3], [9, 6]];
  s.add(heading(c.title), dynamic(() => {
    const k = phase.value;
    const nodes = [place(note('Rows: queries   /   columns: keys 0–9'), legend)];
    for (let q = 0; q < 10; q++) for (let key = 0; key <= q; key++) {
      const allowed = k === 0 || q - key < 4 || (k === 4 && key === 0);
      const onPath = k === 3 && path.slice(0, Math.floor(hops.value)).some(([r, col]) => r === q && col === key);
      const color = k === 4 && key === 0 ? 'pink' : key === 1 || onPath ? 'yellow' : 'cyan';
      nodes.push(rect(pitch - 5, pitch - 5, { fill: color, opacity: allowed ? q === 9 || onPath || key === 1 ? 0.96 : 0.48 : 0.09, stroke: null })
        .moveTo([matrix.cx + (key - 4.5) * pitch, matrix.cy + (q - 4.5) * pitch]));
    }
    const lines = [label('D1 at key 1', { color: 'yellow', size: 55 }), label('Query at position 9', { size: 44 })];
    if (k === 0) lines.push(mono('9 can read 1'));
    if (k === 1) lines.push(mono('Width 4, including self'), label('Which keys can 9 read?', { size: 39 }));
    if (k === 2) lines.push(mono('6   7   8   9', { color: 'cyan' }), note(localPairs(10, 4) + ' allowed pairs across the grid'));
    if (k === 3) lines.push(mono('1 → 3 → 6 → 9', { color: 'yellow' }), note('Three successive layers'));
    if (k === 4) lines.push(mono('0    +    6   7   8   9', { color: 'pink' }), note('Sink at 0. Approval at 1.'));
    nodes.push(...place(column(lines, { gap: 'wide' }), detail, 'left').nodes);
    return nodes;
  }));
  c.on('local-window', () => phase.set(1));
  c.after('direct-answer', () => phase.set(2));
  c.on('stacked-path', () => { phase.set(3); s.play(hops.to(3, { duration: 2 })); });
  c.on('sink', () => phase.set(4));
}
