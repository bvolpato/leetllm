import { column, dynamic, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { allocation } from '../parts.mjs';
import { small, packRequest, newest, middle, notePacket, citedAnswer, source } from '../packet.mjs';

export default function synthesis(s, c) {
  const [task, history, summary, action] = area.rows([1, 2.5, 2.5, 1], 'normal');
  const recent = packRequest(small, [newest, middle]);
  const compact = packRequest(small, [notePacket, newest]);
  const phase = s.value(0);
  s.add(heading(c.title),
    dynamic(() => {
      const nodes = [place(label(phase.value < 2 ? 'Which request identifies the approver and the source?' : 'Who approved the rollback?', { size: 60 }), task)];
      for (const [i, packed] of [recent, compact].entries()) {
        const region = i ? summary : history;
        const [name, rail] = region.columns([1, 2], 'wide');
        const who = citedAnswer(packed, 'actor');
        const line = who ? who + '   /   D1 v' + source.version : 'Approver unknown';
        const evidence = phase.value >= i + 2 ? label(line, { size: 36, color: who ? 'yellow' : 'pink' }) : null;
        nodes.push(...place(column([label(i ? 'Checked note' : 'Recent pairs', { size: 43 }),
          mono(packed.total + ' / ' + small.capacity), evidence], { gap: 'tight' }), name, 'left').nodes);
        if (phase.value >= 1) nodes.push(...allocation(rail, small, packed));
      }
      if (phase.value === 4) nodes.push(place(note('Model-use test   ·   score the reported role and citation at each depth.'), action));
      return nodes;
    }));
  c.on('compare-input', () => phase.set(1));
  c.after('recent-answer', () => phase.set(2));
  c.after('cited-answer', () => phase.set(3));
  c.on('audit-answer', () => phase.set(4));
}
