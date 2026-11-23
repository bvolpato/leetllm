import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { allocation, detail, receipt } from '../parts.mjs';
import { small, packRequest, newest, middle, source, draft, checked, matchesRecord, notePacket } from '../packet.mjs';

export default function compaction(s, c) {
  const [documents, verdict, rail, amount] = area.rows([4.8, 0.85, 1.25, 0.9], 'normal');
  const [left, right] = documents.columns(2, 'loose');
  const [originalHead, requester, approver] = left.inset('normal').rows([0.7, 1, 1], 'normal');
  const [draftHead, decision, actor] = right.inset('normal').rows([0.7, 1, 1], 'normal');
  const actorLine = region => region.rows([1, 1.5], 'tight')[1];
  const sourceValue = place(label(source.actor, { size: 48 }), actorLine(approver), 'top left');
  const targetValue = place(label(source.actor, { size: 48 }), actorLine(actor), 'top left');
  const outline = (region, color) => rect(region.width, region.height, { fill: 'surface', stroke: color, radius: 10, width: 2 }).moveTo(region.point('center'));
  const phase = s.value(0), copy = s.value(0), load = s.value(0);
  s.add(heading(c.title), outline(left, 'yellow'), outline(right, 'dim'),
    place(mono('D1   /   v' + source.version + '   /   decision', { size: 36, color: 'yellow' }), originalHead, 'left'),
    ...detail(requester, 'Requested by', source.requestedBy), ...detail(approver, 'Approved by', source.actor, 'yellow'));
  s.add(dynamic(() => {
    const k = phase.value, data = k >= 4 ? checked : draft;
    const extras = load.value === 2 ? [notePacket, newest] : load.value === 1 ? [newest] : [newest, middle];
    const packed = packRequest(small, extras);
    const nodes = [...allocation(rail, small, packed), receipt(amount, small, packed)];
    if (k === 0) return nodes;
    nodes.push(place(mono('4-unit note   /   D1 v' + data.version, { size: 36, color: 'cyan' }), draftHead, 'left'),
      ...detail(decision, 'Decision', data.approved ? 'Approved' : 'Rejected'));
    const [field, text] = detail(actor, 'Approved by', data.actor, k === 2 ? 'pink' : k >= 4 ? 'yellow' : 'ink');
    nodes.push(field);
    if (k !== 3) nodes.push(text);
    if (k === 3) {
      const p = copy.value;
      const from = sourceValue.center, to = targetValue.center;
      nodes.push(label(source.actor, { size: 48, color: 'yellow' }).moveTo(from.map((v, i) => v + (to[i] - v) * p)));
    }
    if (k === 1.5) nodes.push(place(label('Does D1 give that person the same role?', { size: 46, color: 'cyan' }), verdict));
    if (k === 2 || k === 4) nodes.push(place(label(matchesRecord(data) ? 'Decision, actor and source match' : 'The draft names the requester', {
      size: 42, color: matchesRecord(data) ? 'green' : 'pink',
    }), verdict));
    return nodes;
  }));
  c.on('draft-note', () => phase.set(1));
  c.on('challenge', () => phase.set(1.5));
  c.after('check-role', () => phase.set(2));
  c.on('repair-actor', () => { phase.set(3); s.play(copy.to(1, { duration: 1.25 })); });
  c.after('verified', () => phase.set(4));
  c.after('remove-middle', () => load.set(1));
  c.after('insert-note', () => load.set(2));
}
