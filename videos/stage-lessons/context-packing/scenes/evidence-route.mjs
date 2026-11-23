import { dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { source } from '../packet.mjs';

export default function evidenceRoute(s, c) {
  const [archiveTitle, archive, requestTitle, request, test] = area.rows([0.9, 1.8, 0.8, 1.8, 1], 'normal');
  const documents = { D0: 'Deploy note', D1: 'Signed decision', D2: 'Canary trace', D3: 'Runbook' };
  const ids = Object.keys(documents);
  const phase = s.value(0);
  function packet(region, labels) {
    return region.columns(4, 'normal').flatMap((slot, i) => {
      const item = labels[i];
      if (!item) return [];
      const color = item.includes(source.source) ? 'yellow' : 'blue';
      return [rect(slot.width, 100, { fill: 'surface', stroke: color, width: 3, radius: 7 }).moveTo(slot.point('center')),
        place(label(item, { size: 35, color }), slot)];
    });
  }
  s.add(heading(c.title),
    dynamic(() => {
      const k = phase.value;
      const names = k < 2 ? ids : k <= 4 ? ['D0   Deploy note', k === 4 ? 'D1 v3   Decision' : null, null, 'D3   Runbook'] :
        k === 5 ? ['D0 + D1', 'D2 + D3'] : k === 6 ? ['D1 v3  /  approved', 'D2  /  error'] : [];
      const title = k < 2 ? 'Full packet' : k <= 4 ? 'Retrieved candidates' : k < 7 ? 'Chunk summaries' : 'Exact March tally';
      const nodes = [place(label(k === 7 ? 'Seven trace records' : 'Incident archive', { size: 48 }), archiveTitle, 'left'),
        place(label(title, { size: 48, color: 'cyan' }), requestTitle, 'left')];
      if (k === 7) nodes.push(...packet(archive, ['r1  r2', 'r3  r4  r5', 'r6   February', 'r7   Success']));
      else nodes.push(...packet(archive, ids.map(id => id + '  ' + documents[id])));
      if (k > 0) nodes.push(...packet(request, names));
      if (k === 3) nodes.push(place(label('The decision is missing from the request.', { size: 43, color: 'pink' }), test));
      if (k === 4) nodes.push(place(mono('D1 v3   /   ' + source.actor, { color: 'yellow' }), test));
      if (k === 6) nodes.push(place(note('Trace both claims back to the source records.'), test));
      if (k === 7) nodes.push(place(mono('A  2      B  3       ·       r1 through r5', { size: 51, color: 'green' }), request));
      return nodes;
    }));
  c.on('full-route', () => phase.set(1));
  c.on('lookup-route', () => phase.set(2));
  c.on('missed-source', () => phase.set(3));
  c.after('recover-source', () => phase.set(4));
  c.on('chunk-route', () => phase.set(5));
  c.on('merge-chunks', () => phase.set(6));
  c.on('aggregate-route', () => phase.set(7));
}
