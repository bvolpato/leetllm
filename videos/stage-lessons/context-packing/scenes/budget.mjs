import { dynamic, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { allocation } from '../parts.mjs';
import { small, packRequest } from '../packet.mjs';

export default function budget(s, c) {
  const [capacity, rail, equation, units] = area.rows([2, 1.5, 2, 1], 'normal');
  const phase = s.value(0);
  s.add(heading(c.title), place(label('32 units for input and reply', { size: 68 }), capacity),
    place(note('Example costs include message framing.'), units));
  s.add(dynamic(() => {
    const k = phase.value;
    const shape = { ...small, rules: k >= 2 ? small.rules : 0, question: k >= 3 ? small.question : 0, reserve: k >= 1 ? small.reserve : 0 };
    const packed = packRequest(shape);
    const nodes = allocation(rail, shape, packed, { showFree: k >= 4 });
    if (k >= 3) nodes.push(place(mono(`32 − 8 − 4 − 4 = ${k >= 4 ? packed.remaining : '?'}`, { size: 64, color: 'cyan' }), equation));
    return nodes;
  }));
  c.after('reserve-reply', () => phase.set(1));
  c.after('rules', () => phase.set(2));
  c.after('question', () => phase.set(3));
  c.after('available', () => phase.set(4));
}
