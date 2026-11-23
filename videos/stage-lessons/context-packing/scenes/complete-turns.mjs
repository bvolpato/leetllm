import { column, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { allocation, receipt } from '../parts.mjs';
import { small, packRequest, newest, middle, oldest } from '../packet.mjs';

export default function completeTurns(s, c) {
  const [candidates, trial, rail, total] = area.rows([3, 1.2, 1.2, 1], 'normal');
  const packets = [newest, middle, oldest];
  const slots = candidates.columns(3, 'wide');
  const step = s.value(0), trying = s.value(0);
  s.add(heading(c.title), dynamic(() => {
    const packed = packRequest(small, packets.slice(0, step.value));
    const nodes = [...allocation(rail, small, packed), receipt(total, small, packed)];
    for (const [i, packet] of packets.entries()) {
      const region = slots[i], kept = packed.kept.includes(packet);
      const color = kept ? 'green' : i === 2 && trying.value ? 'yellow' : 'dim';
      nodes.push(rect(region.width, region.height * 0.78, { fill: 'surface', stroke: color, width: 2, radius: 8 }).moveTo(region.point('center')),
        ...place(column([label(packet.id, { size: 43, color }), mono(packet.units + ' units'),
          note(kept ? 'In the request' : i === 2 ? 'D1 decision record' : 'Question + answer')], { gap: 'normal' }), region).nodes);
    }
    if (trying.value) {
      const attempted = packed.total + oldest.units;
      const text = step.value === 3 ? `${packed.total} + ${oldest.units} = ${attempted}   >   ${small.capacity}    ·    E1 stays out` :
        `Can E1 fit in ${packed.remaining} free slots?`;
      nodes.push(place(label(text, { size: 46, color: step.value === 3 ? 'pink' : 'yellow' }), trial));
    }
    return nodes;
  }));
  c.after('pack-newest', () => step.set(1));
  c.after('pack-middle', () => step.set(2));
  c.on('try-oldest', () => trying.set(1));
  c.after('exclude-oldest', () => step.set(3));
}
