import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { small, packRequest } from '../packet.mjs';

export default function overflow(s, c) {
  const [caseName, diagram, arithmetic, status] = area.rows([1, 2.5, 1.4, 1], 'normal');
  const larger = { ...small, rules: 14, question: 12 };
  const phase = s.value(0);
  const cases = [larger, small].map(shape => {
    try { return { shape, result: packRequest(shape) }; }
    catch (error) {
      if (error.message !== 'Mandatory input and output exceed context limit') throw error;
      return { shape, result: null };
    }
  });
  s.add(heading(c.title), dynamic(() => {
    const { shape, result } = cases[phase.value >= 3 ? 1 : 0];
    const { capacity, rules, question, reserve } = shape;
    const sum = rules + question + reserve;
    const tested = phase.value === 2 || phase.value === 4;
    const [rail, marks] = diagram.rows([1, 1], 'tight');
    const pitch = rail.width / 35;
    const nodes = [place(label('Empty history   ·   limit 32   ·   reserve 8'), caseName)];
    for (let i = 0; i < (tested ? Math.max(capacity, sum) : capacity); i++) {
      const fill = phase.value === 0 || i >= (tested ? sum : rules + question) ? null : i < rules ? 'blue' : i < rules + question ? 'cyan' : 'pink';
      nodes.push(rect(pitch - 3, 68, { fill, stroke: i >= capacity ? 'pink' : 'dim', width: 2 })
        .moveTo([rail.left + (i + 0.5) * pitch, rail.cy]));
    }
    nodes.push(label('Limit 32', { size: 31, color: 'pink' }).moveTo([rail.left + capacity * pitch, marks.cy]));
    if (phase.value) nodes.push(place(mono(`${rules} rules  +  ${question} question  +  ${reserve} reply  =  ${tested ? sum : '?'}`, { size: 47 }), arithmetic));
    if (tested) nodes.push(place(label(result ? 'Accepted' : 'Rejected   ·   2 units over', { color: result ? 'green' : 'pink', size: 56 }), status));
    return nodes;
  }));
  c.on('larger-input', () => phase.set(1));
  c.after('reject-request', () => phase.set(2));
  c.on('retry-request', () => phase.set(3));
  c.after('accept-request', () => phase.set(4));
}
